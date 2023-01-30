import { BigNumber, Contract, utils } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { getSwapdArgs } from './lib/cliArgs'
import contracts from './lib/contracts'
import { coinToss, randInRange, populateTxFully, ETH, MAX_U256, PROVIDER } from './lib/helpers'

import { getDeployment, getExistingDeploymentFilename, signSwap } from "./lib/liquid"
import { getAdminWallet, getWalletSet } from './lib/wallets'

async function main() {
    // get cli args
    const {startIdx, endIdx, actionsPerBlock, numPairs, program, modes} = getSwapdArgs()
    const isArbd = program === modes.arbd
    console.log("numPairs", numPairs)

    const walletSet = getWalletSet(startIdx, endIdx)

    // get deployment params (// TODO: specify deployment via cli params)
    const filename = await getExistingDeploymentFilename()
    console.log("filename", filename)
    const {deployments} = await getDeployment()

    deployments
    
    const atomicSwapContract = new Contract(deployments.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
    const uniFactoryA = new Contract(deployments.uniV2Factory_A.contractAddress, contracts.UniV2Factory.abi)
    const uniFactoryB = new Contract(deployments.uniV2Factory_B.contractAddress, contracts.UniV2Factory.abi)
    const wethContract = new Contract(deployments.weth.contractAddress, contracts.WETH.abi, PROVIDER)
    let daiContracts: Contract[] = deployments.dai.map(dai => new Contract(dai.contractAddress, contracts.DAI.abi, PROVIDER))

    // check token balances for each wallet, mint more if needed
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let signedDeposits: string[] = []
    let signedMints: string[] = []
    let adminNonce = await adminWallet.getTransactionCount()
    for (const wallet of walletSet) {
        let wethBalance: BigNumber = await wethContract.callStatic.balanceOf(wallet.address)
        if (wethBalance.lte(ETH.mul(20))) {
            let nonce = await wallet.connect(PROVIDER).getTransactionCount()
            // mint 20 ETH
            const tx = populateTxFully(await wethContract.populateTransaction.deposit({value: ETH.mul(20)}), nonce, {
                gasLimit: 50000,
                from: wallet.address,
            })
            const signedDeposit = await wallet.signTransaction(tx)
            signedDeposits.push(signedDeposit)
        }
        for (const dai of daiContracts) {
            let daiBalance: BigNumber = await dai.callStatic.balanceOf(wallet.address)
            if (daiBalance.lte(50000)) {
                // mint 50k DAI to wallet from admin account (DAI deployer)
                const mintTx = await adminWallet.signTransaction(populateTxFully(await dai.populateTransaction.mint(wallet.address, ETH.mul(50000)), adminNonce++, {
                    gasLimit: 60000,
                    from: adminWallet.address,
                }))
                signedMints.push(mintTx)
            }
        }
    }
    const depositPromises = signedDeposits.map(tx => PROVIDER.sendTransaction(tx))
    const mintPromises = signedMints.map(tx => PROVIDER.sendTransaction(tx))
    if (depositPromises.length > 0) {
        const depositResults = await Promise.all(depositPromises)
        console.log(`deposited for ${depositResults.length} accounts`)
        await depositResults[depositResults.length - 1].wait(1) // wait for last tx to be included before proceeding
    } else {
        console.log("no deposits required")
    }
    if (mintPromises.length > 0) {
        const mintResults = await Promise.all(mintPromises)
        console.log(`minted for ${mintResults.length} accounts`)
        await mintResults[mintResults.length - 1].wait(1) // wait for last tx to be included before proceeding
    } else {
        console.log("no mints required")
    }

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    let signedApprovals: string[] = []
    for (const wallet of walletSet) {
        const allowanceWeth: BigNumber = await wethContract.callStatic.allowance(wallet.address, atomicSwapContract.address)
        let nonce = await PROVIDER.getTransactionCount(wallet.address)
        if (allowanceWeth.lte(ETH.mul(50))) {
            const approveTx = populateTxFully(
                await wethContract.populateTransaction.approve(atomicSwapContract.address, MAX_U256), 
                nonce, 
                {
                    from: wallet.address, gasLimit: 50000
                })
            nonce += 1
            const signedTx = await wallet.signTransaction(approveTx)
            signedApprovals.push(signedTx)
        }

        for (const dai of daiContracts) {
            const allowance: BigNumber = await dai.callStatic.allowance(wallet.address, atomicSwapContract.address)
            if (allowance.lte(ETH.mul(100000))) {
                const approveTx = populateTxFully(
                    await dai.populateTransaction.approve(atomicSwapContract.address, MAX_U256), 
                    nonce, 
                    {
                        from: wallet.address, gasLimit: 50000
                    })
                const signedTx = await wallet.signTransaction(approveTx)
                signedApprovals.push(signedTx)
            }
        }
    }
    const approvalPromises = signedApprovals.map(tx => {
        return PROVIDER.sendTransaction(tx)
    })
    if (approvalPromises.length > 0) {
        const approvalResults = await Promise.all(approvalPromises)
        console.log(
            "finished approvals for the following addresses", 
            approvalResults
                .map(txRes => txRes.from)
                .filter((val, idx, arr) => 
                    arr.indexOf(val) === idx
                ))
            await approvalResults[approvalResults.length - 1].wait(1) // wait for last tx to be included before proceeding
    } else {
        console.log("no approvals required")
    }

    const swapd = async (blockNum: number) => {
        console.log(`[BLOCK ${blockNum}]`)
        // generate swaps
        let swaps: string[] = []
        for (const wallet of walletSet) {
            let nonce = await PROVIDER.getTransactionCount(wallet.address)
            for (let i = 0; i < actionsPerBlock; i++) {
                // pick random uni factory
                const uniFactory = coinToss() ? uniFactoryA.address : uniFactoryB.address
                const daiContract = daiContracts.length > 1 ? daiContracts[randInRange(0, daiContracts.length)] : 
                    daiContracts[0]
                // pick random path
                const path = coinToss() ? [wethContract.address, daiContract.address] : [daiContract.address, wethContract.address]
                // pick random amountIn: [500..10000] USD
                const amountInUSD = ETH.mul(randInRange(500, 2000))
                console.log("amountInUSD")
                // if weth out (path_0 == weth) then amount should be (1 ETH / 2000 DAI) * amountIn
                const amountIn = path[0] == wethContract.address ? amountInUSD.div(2000) : amountInUSD
                const tokenInName = path[0] === wethContract.address ? "WETH" : "DAI"
                const tokenOutName = path[1] === wethContract.address ? "WETH" : "DAI"

                console.log(`${wallet.address} trades ${formatEther(amountIn).padEnd(6, "0")} ${tokenInName.padEnd(4, " ")} for ${tokenOutName}`)
                swaps.push(await signSwap(atomicSwapContract, uniFactory, wallet, amountIn, path, nonce++))
                console.log("pushed signed swap")
            }
        }
        
        const swapPromises = swaps.map(tx => {
            try {
                return PROVIDER.sendTransaction(tx)
            } catch (e) {
                console.warn("swap failed", e)
                return new Promise((_, reject) => {
                    reject("swap failed")
                })
            }
        })
        const swapResults = await Promise.allSettled(swapPromises)
        console.log(`${swapResults.length} swaps executed with ${walletSet.length} wallet${walletSet.length == 1 ? '' : 's'}`)
    }

    const arbd = (blockNum: number) => {
        console.log(`[BLOCK ${blockNum}]`)
        console.warn("unimplemented!")
        // TODO: everything lol
        //  - if isArbd, detect swaps to backrun, checking min/max profit flags b4 executing
    }

    PROVIDER.on('block', isArbd ? arbd : swapd)
}

main()
