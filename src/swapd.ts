import { BigNumber, Contract, ethers, Transaction, utils } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { calculateBackrunParams } from './lib/arbitrage'
import { getSwapdArgs } from './lib/cliArgs'
import contracts from './lib/contracts'
import { coinToss, randInRange, populateTxFully, ETH, MAX_U256, PROVIDER, extract4Byte } from './lib/helpers'
import math, { numify } from "./lib/math"

import { ContractDeployment, getDeployment, getExistingDeploymentFilename, signSwap } from "./lib/liquid"
import { getAdminWallet, getWalletSet } from './lib/wallets'

// TODO: use this!
interface ISwapParams {
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

class SwapParams implements ISwapParams {
    path: string[]
    amountIn: BigNumber
    factory: string
    recipient: string
    fromThis: boolean
    constructor(params: utils.Result) {
        this.path = params[0]
        this.amountIn = params[1]
        this.factory = params[2]
        this.recipient = params[3]
        this.fromThis = params[4]
    }
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
    const daiContracts: Contract[] = deployments.dai.map(dai => new Contract(dai.contractAddress, contracts.DAI.abi, PROVIDER))

    // check token balances for each wallet, mint more if needed
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let signedDeposits: string[] = []
    let signedMints: string[] = []
    let adminNonce = await adminWallet.getTransactionCount()
    console.log("using wallets", walletSet.map(w => w.address))
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
        if (addr.toLowerCase() === deployments.weth.contractAddress.toLowerCase()) {
            return "WETH"
        } else {
            for (let i = 0; i < deployments.dai.length; i++) {
                if (deployments.dai[i].contractAddress.toLowerCase() === addr.toLowerCase()) {
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
        // const wallet = walletSet[0]
        for (const wallet of walletSet) {
            if (pendingTx.to === atomicSwapContract.address) {
                // const nonce = await PROVIDER.getTransactionCount(wallet.address)
                // swap detected
                // TODO: side daemon that caches the reserves on new blocks
                // for now we can just pull the reserves for every tx but it's not ideal
    
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
                    const userSwap = new SwapParams(decodedTxData)
    
                    // get reserves
                    // TODO: make a helper function to do this; this block is getting ugly
                    const pairAddressA = await uniFactoryA.getPair(userSwap.path[0], userSwap.path[1])
                    const pairAddressB = await uniFactoryB.getPair(userSwap.path[0], userSwap.path[1])
                    // TODO: cache these contracts
                    const pairA = new Contract(pairAddressA, contracts.UniV2Pair.abi, PROVIDER)
                    const pairB = new Contract(pairAddressB, contracts.UniV2Pair.abi, PROVIDER)
                    const reservesA = await pairA.getReserves()
                    const reservesB = await pairB.getReserves()
    
                    // TODO: only calculate each `k` once
                    const kA = reservesA[0].mul(reservesA[1])
                    const kB = reservesB[0].mul(reservesB[1])
    
                    // we can assume that the pair ordering is the same on both pairs
                    // bc they are the same contract, so they order the same way
                    const token0: string = await pairA.callStatic.token0()
                    const token1: string = await pairA.callStatic.token1()
                    const wethIndex = token0.toLowerCase() === deployments.weth.contractAddress.toLowerCase() ? 0 : 1
                    const backrunParams = calculateBackrunParams(
                        numify(reservesA[0]),
                        numify(reservesA[1]),
                        numify(kA),
                        numify(reservesB[0]),
                        numify(reservesB[1]),
                        numify(kB),
                        numify(decodedTxData[1]),
                        userSwap.path[0].toLowerCase() === token0.toLowerCase(),
                        wethIndex
                    )
                    if (!backrunParams) {
                        console.debug("not profitable")
                        return
                    }
                    console.debug("estimated profit", utils.formatEther(backrunParams.profit.toFixed(0)))
                    // TODO: calculate gas cost dynamically (accurately)
                    const gasCost = math.bignumber(100000).mul(1e9).mul(20)
                    if (math.bignumber(backrunParams.profit).gt(gasCost)) {
                        console.log("DOING THE ARBITRAGE...")
                        const tokenArb = backrunParams.settlementToken === 1 ? token0 : token1
                        const tokenSettle = backrunParams.settlementToken === 0 ? token0 : token1
                        const startFactory = userSwap.factory
                        const endFactory = startFactory === uniFactoryA.address ? uniFactoryB.address : uniFactoryA.address
                        const pairStart: string = startFactory === uniFactoryA.address ? pairAddressA : pairAddressB
                        const pairEnd: string = startFactory === uniFactoryB.address ? pairAddressA : pairAddressB
                        const amountIn = BigNumber.from(backrunParams.backrunAmount.toFixed(0))

                        console.log("tokenArb", findTokenName(tokenArb), tokenArb)
                        console.log("tokenSettle", findTokenName(tokenSettle), tokenSettle)

                        const arbRequest = await atomicSwapContract.populateTransaction.arb(
                            tokenArb,
                            tokenSettle,
                            startFactory,
                            endFactory,
                            pairStart,
                            pairEnd,
                            amountIn
                        )
                        const signedArb = wallet.signTransaction(populateTxFully(arbRequest, await PROVIDER.getTransactionCount(wallet.address), {from: wallet.address}))
                        try {
                            const res = await PROVIDER.sendTransaction(await signedArb)
                            const daiAddress = wethIndex === 0 ? token1 : token0
                            const daiIdx = daiContracts.map(c => c.address.toLowerCase()).indexOf(daiAddress.toLowerCase())
                            const daiContract = daiContracts[daiIdx]
                            if ((await res.wait()).confirmations > 0){
                                console.log("ARB LANDED")
                            }
                            const userBalances = {
                                WETH: formatEther(await wethContract.balanceOf(wallet.address)),
                                DAI: formatEther(await daiContract.balanceOf(wallet.address)),
                            }
                            const swapContractBalances = {
                                WETH: formatEther(await wethContract.balanceOf(atomicSwapContract.address)),
                                DAI: formatEther(await daiContract.balanceOf(atomicSwapContract.address)),
                            }
                            console.log(`[${wallet.address}] DAI${daiIdx+1}`, userBalances)
                            console.log(`[atomicSwapContract]`, swapContractBalances)
                        } catch (e) {
                            type E = {
                                code: string
                            }
                            if ((e as E).code === ethers.errors.NONCE_EXPIRED) {
                                console.warn("nonce expired")
                            } else if ((e as E).code === ethers.errors.REPLACEMENT_UNDERPRICED) {
                                console.warn("replacement underpriced")
                            } else {
                                console.error(e)
                            }
                        }
                    }
                }
            }
            // checking profit against min/max profit flags b4 executing
        }

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
