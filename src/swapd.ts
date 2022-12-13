import { BigNumber, Contract, utils } from 'ethers'
import { getSwapdArgs } from './lib/cliArgs'
import contracts from './lib/contracts'
import { ETH, MAX_U256, populateTxFully, PROVIDER } from './lib/helpers'

import { getDeployment, getExistingDeploymentFilename, signSwap } from "./lib/liquid"
import { getAdminWallet, getWalletSet } from './lib/wallets'

async function main() {
    // get cli args
    const {startIdx, endIdx} = getSwapdArgs()
    const walletSet = getWalletSet(startIdx, endIdx)

    // get deployment params (// TODO: specify deployment via cli params)
    const filename = await getExistingDeploymentFilename()
    console.log("filename", filename)
    const {deployments} = await getDeployment()
    
    const atomicSwapContract = new Contract(deployments.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
    const uniFactoryA = new Contract(deployments.uniV2Factory_A.contractAddress, contracts.UniV2Factory.abi)
    const uniFactoryB = new Contract(deployments.uniV2Factory_B.contractAddress, contracts.UniV2Factory.abi)
    const wethContract = new Contract(deployments.weth.contractAddress, contracts.WETH.abi, PROVIDER)
    const daiContract = new Contract(deployments.dai.contractAddress, contracts.DAI.abi, PROVIDER)

    // check token balances for each wallet, mint more if needed
    let signedMints: string[] = []
    for (const wallet of walletSet) {
        let nonce = await PROVIDER.getTransactionCount(wallet.address)
        let wethBalance: BigNumber = await wethContract.callStatic.balanceOf(wallet.address)
        if (wethBalance.lte(20)) {
            // mint 20 ETH
            const mintTx = await wallet.signTransaction(populateTxFully(await wethContract.populateTransaction.deposit({value: ETH.mul(20)}), nonce, {
                gasLimit: 50000,
                from: wallet.address,
            }))
            nonce += 1
            signedMints.push(mintTx)
        }
        let daiBalance: BigNumber = await daiContract.callStatic.balanceOf(wallet.address)
        if (daiBalance.lte(50000)) {
            // mint 50k DAI to wallet from admin account (DAI deployer)
            const adminWallet = getAdminWallet()
            const mintTx = await adminWallet.signTransaction(populateTxFully(await daiContract.populateTransaction.mint(wallet.address, ETH.mul(50000)), nonce, {
                gasLimit: 60000,
                from: adminWallet.address
            }))
            signedMints.push(mintTx)
        }
    }
    const mintPromises = signedMints.map(tx => PROVIDER.sendTransaction(tx))
    const mintResults = await Promise.all(mintPromises)
    console.log("minted for the following accounts", mintResults.map(res => res.from))

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    let signedApprovals: string[] = []
    for (const wallet of walletSet) {
        const allowanceWeth: BigNumber = await wethContract.callStatic.allowance(wallet.address, atomicSwapContract.address)
        const allowanceDai: BigNumber = await daiContract.callStatic.allowance(wallet.address, atomicSwapContract.address)
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
        if (allowanceDai.lte(ETH.mul(100000))) {
            const approveTx = populateTxFully(
                await daiContract.populateTransaction.approve(atomicSwapContract.address, MAX_U256), 
                nonce, 
                {
                    from: wallet.address, gasLimit: 50000
                })
            const signedTx = await wallet.signTransaction(approveTx)
            signedApprovals.push(signedTx)
        }
    }
    const approvalPromises = signedApprovals.map(tx => {
        return PROVIDER.sendTransaction(tx)
    })
    if (approvalPromises.length > 0) {
        const finishedApprovals = await Promise.all(approvalPromises)
        console.log(
            "finished approvals for the following addresses", 
            finishedApprovals
                .map(txRes => txRes.from)
                .filter((val, idx, arr) => 
                    arr.indexOf(val) === idx
                ))
    }

    const coinToss = (): boolean => {
        return Math.floor(Math.random() * 2) % 2 == 0
    }

    const randInRange = (min: number, max: number): BigNumber => {
        return ETH.mul(
            Math.floor(Math.random() * (max - min) + min)
        )
    }

    // generate swaps
    let swaps: string[] = []
    for (const wallet of walletSet) {
        // pick random uni factory
        const uniFactory = coinToss() ? uniFactoryA.address : uniFactoryB.address
        // pick random path
        const path = coinToss() ? [wethContract.address, daiContract.address] : [daiContract.address, wethContract.address]
        // pick random amountIn: [500..20000] USD
        const amountInUSD = randInRange(500, 20000)
        // if weth out (path_0 == weth) then amount should be (1 ETH / 2000 DAI) * amountIn
        const amountIn = path[0] == wethContract.address ? amountInUSD.div(2000) : amountInUSD

        swaps.push(await signSwap(atomicSwapContract, uniFactory, wallet, amountIn, path))
    }
    
    const swapPromises = swaps.map(tx => PROVIDER.sendTransaction(tx))
    const swapResults = await Promise.all(swapPromises)
    console.log(swapResults)
    console.log(`swapped with ${swapResults.length} wallets`)

    console.log("OK!")
}

main()
