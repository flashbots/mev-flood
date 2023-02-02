import { BigNumber, Contract, Transaction, utils } from 'ethers'
import { formatEther, formatUnits } from 'ethers/lib/utils'
import { calculateBackrunProfit } from './lib/arbitrage'
import { getSwapdArgs } from './lib/cliArgs'
import contracts from './lib/contracts'
import { coinToss, randInRange, populateTxFully, ETH, MAX_U256, PROVIDER, TransactionRequest, extract4Byte } from './lib/helpers'
import math, { numify } from "./lib/math"

import { ContractDeployment, getDeployment, getExistingDeploymentFilename, signSwap } from "./lib/liquid"
import { getAdminWallet, getWalletSet } from './lib/wallets'

// TODO: use this!
interface SwapParams {
    // address[] memory path,
    path: string[]
    // uint256 amountIn,
    amountIn: BigNumber
    // address factory,
    factory: string
    // address recipient,
    recipient: string
    // bool fromThis
    fromThis: boolean
}

async function main() {
    // get cli args
    const {startIdx, endIdx, actionsPerBlock, numPairs, program, modes} = getSwapdArgs()
    const isArbd = program === modes.arbd
    // TODO: actually use numPairs lol

    const walletSet = getWalletSet(startIdx, endIdx)

    // get deployment params (// TODO: specify deployment via cli params)
    const filename = await getExistingDeploymentFilename()
    console.log("filename", filename)
    const {deployments} = await getDeployment()
    
    const atomicSwapContract = new Contract(deployments.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
    const uniFactoryA = new Contract(deployments.uniV2Factory_A.contractAddress, contracts.UniV2Factory.abi, PROVIDER)
    const uniFactoryB = new Contract(deployments.uniV2Factory_B.contractAddress, contracts.UniV2Factory.abi, PROVIDER)
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

    /**
     * juicy swap generator. Generates random univ2 swaps from wallets specified in args.
     * @param blockNum new block number from RPC provider.
     */
    const swapd = async (blockNum: number) => {
        console.log(`[BLOCK ${blockNum}]`)
        // generate swaps
        let swaps: string[] = []
        for (const wallet of walletSet) {
            let nonce = await PROVIDER.getTransactionCount(wallet.address)
            for (let i = 0; i < actionsPerBlock; i++) {
                // pick random uni factory
                const uniFactory = coinToss() ? uniFactoryA.address : uniFactoryB.address
                // TODO: use `numPairs` here
                const daiContract = daiContracts.length > 1 ? daiContracts[randInRange(0, daiContracts.length)] : 
                    daiContracts[0]
                // pick random path
                const path = coinToss() ? [wethContract.address, daiContract.address] : [daiContract.address, wethContract.address]
                // pick random amountIn: [500..10000] USD
                const amountInUSD = ETH.mul(randInRange(500, 2000))
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

    const findTokenName = (addr: string) => {
        // if it's either WETH or one of the DAI tokens
        if (addr === deployments.weth.contractAddress) {
            return "WETH"
        } else {
            for (let i = 0; i < deployments.dai.length; i++) {
                if (deployments.dai[i].contractAddress === addr) {
                    return `DAI${i+1}`
                }
            }
        }
        // if it's any other top-level contract
        for (const deployment of Object.entries(deployments)) {
            const key: string = deployment[0]
            const val: ContractDeployment = deployment[1]
            if (val.contractAddress === addr) {
                return key
            }
        }
        return "-?-"
    }

    /**
     * backrun-arbitrage daemon; watches mempool for juicy swaps and backruns them w/ an arb when profitable. 
     * Arbs are generated from wallet set passed in args; will cause conflicts often.
     * @param pendingTx pending tx from mempool.
     */
    const arbd = async (pendingTx: Transaction) => {
        console.log(`[pending tx ${pendingTx.hash}]`)
        if (pendingTx.to === atomicSwapContract.address) {
            // swap detected
            // TODO: hmmmm we need a side daemon that caches the reserves (on new block);
            // for now we can just pull the reserves for every tx but
            // long term we can't be doin' that

            // decode tx to get pair
            // we're expecting a call to `swap` on atomicSwap
            const fnSignature = extract4Byte(pendingTx.data)
            if (fnSignature === "0cc73263") {
                // swap detected
                const decodedTxData = utils.defaultAbiCoder.decode([
                    "address[] path", 
                    "uint256 amountIn",
                    "address factory",
                    "address recipient",
                    "bool fromThis",
                ], `0x${pendingTx.data.substring(10)}`)
                const path = decodedTxData[0]
                // get reserves
                // TODO: make a helper function to do this; this block is getting ugly
                const pairAddressA = await uniFactoryA.getPair(path[0], path[1])
                const pairAddressB = await uniFactoryB.getPair(path[0], path[1])
                // TODO: cache these contracts or use something more efficient than
                // instantiating new Contracts every time
                const pairA = new Contract(pairAddressA, contracts.UniV2Pair.abi, PROVIDER)
                const pairB = new Contract(pairAddressB, contracts.UniV2Pair.abi, PROVIDER)
                const reservesA = await pairA.getReserves()
                const reservesB = await pairB.getReserves()

                // TODO: only calculate each `k` once
                const kA = reservesA[0].mul(reservesA[1])
                const kB = reservesB[0].mul(reservesB[1])

                // we can assume that the pair ordering is the same on both pairs
                // bc they are the same contract, so they order the same way
                const token0A = await pairA.callStatic.token0()
                const token1A = await pairA.callStatic.token1()
                const estimatedProfit = calculateBackrunProfit(
                    numify(reservesA[0]),
                    numify(reservesA[1]),
                    numify(kA),
                    numify(reservesB[0]),
                    numify(reservesB[1]),
                    numify(kB),
                    numify(decodedTxData[1]),
                    path[0] === token0A,
                    // TODO: add a local addr:name cache
                    {x: findTokenName(token0A), y: findTokenName(token1A)}
                )
                console.debug("estimated profit", utils.formatEther(estimatedProfit.toFixed(0)))
                // TODO: calculate gas cost dynamically (accurately)
                const gasCost = math.bignumber(150000).mul(1e9)
                if (math.bignumber(estimatedProfit).gt(gasCost)) {
                    console.log("DOING THE ARBITRAGE...")
                    // TODO...
                }
            }
        }
        // checking profit against min/max profit flags b4 executing

        console.warn("unfinished!")
    }

    if (isArbd) {
        // watch mempool
        PROVIDER.on('pending', arbd)
    } else {
        // watch blocks
        PROVIDER.on('block', swapd)
    }
}

main()
