import { BigNumber, Contract, ethers, providers, Transaction, utils, Wallet } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { calculateBackrunParams } from './arbitrage'
import contracts from './contracts'
import { extract4Byte, populateTxFully } from './helpers'
import { ContractDeployment, LiquidDeployment } from './liquid'
import math, { numify } from './math'

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

const findTokenName = (addr: string, deployment: LiquidDeployment) => {
    // if it's either WETH or one of the DAI tokens
    if (addr.toLowerCase() === deployment.weth.contractAddress.toLowerCase()) {
        return "WETH"
    } else {
        for (let i = 0; i < deployment.dai.length; i++) {
            if (deployment.dai[i].contractAddress.toLowerCase() === addr.toLowerCase()) {
                return `DAI${i+1}`
            }
        }
    }
    // if it's any other top-level contract
    for (const cd of Object.entries(deployment.inner())) {
        const key: string = cd[0]
        const val: ContractDeployment = cd[1]
        if (val.contractAddress === addr) {
            return key
        }
    }
    return "-?-"
}

export const handleBackrun = async (provider: providers.JsonRpcProvider, deployment: LiquidDeployment, wallet: Wallet, pendingTx: Transaction) => {
    if (pendingTx.to === deployment.atomicSwap.contractAddress) {
        // const nonce = await PROVIDER.getTransactionCount(wallet.address)
        // swap detected
        // TODO: side daemon that caches the reserves on new blocks
        // for now we can just pull the reserves for every tx but it's not ideal
        const deployedContracts = deployment.getDeployedContracts(provider)
        const getReserves = async (token0: string, token1: string) => {
            // get reserves
            const pairAddressA = await deployedContracts.uniV2FactoryA.getPair(token0, token1)
            const pairAddressB = await deployedContracts.uniV2FactoryB.getPair(token0, token1)
            // TODO: cache these contracts
            const pairA = new Contract(pairAddressA, contracts.UniV2Pair.abi, provider)
            const pairB = new Contract(pairAddressB, contracts.UniV2Pair.abi, provider)
            const reservesA = pairA.getReserves()
            const reservesB = pairB.getReserves()
            return {reservesA: await reservesA, reservesB: await reservesB, pairA, pairB}
        }

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
            const {reservesA, reservesB, pairA, pairB} = await getReserves(userSwap.path[0], userSwap.path[1])

            // TODO: only calculate each `k` once
            const kA = reservesA[0].mul(reservesA[1])
            const kB = reservesB[0].mul(reservesB[1])

            // we can assume that the pair ordering is the same on both pairs
            // bc they are the same contract, so they order the same way
            const token0: string = await pairA.callStatic.token0()
            const token1: string = await pairA.callStatic.token1()
            const wethIndex = token0.toLowerCase() === deployment.weth.contractAddress.toLowerCase() ? 0 : 1
            const backrunParams = calculateBackrunParams(
                numify(reservesA[0]),
                numify(reservesA[1]),
                numify(kA),
                numify(reservesB[0]),
                numify(reservesB[1]),
                numify(kB),
                numify(decodedTxData[1]),
                userSwap.path[0].toLowerCase() === token0.toLowerCase(),
                userSwap.factory.toLowerCase() === deployment.uniV2FactoryA.contractAddress.toLowerCase() ? "A" : "B"
            )
            if (!backrunParams) {
                return
            }
            const settlesInWeth = backrunParams.settlementToken === wethIndex
            console.debug("estimated proceeds", `${utils.formatEther(backrunParams.profit.toFixed(0))} ${settlesInWeth ? "WETH" : "DAI"}`)
            // TODO: check profit against min/max profit flags b4 executing
            // TODO: calculate gas cost dynamically (accurately)
            const gasCost = math.bignumber(100000).mul(1e9).mul(20)
            // normalize profit to ETH
            const avgReserves0 = backrunParams.otherReserves.reserves0.add(backrunParams.userReserves.reserves0).div(2)
            const avgReserves1 = backrunParams.otherReserves.reserves1.add(backrunParams.userReserves.reserves1).div(2)
            const avgPrice = wethIndex === 0 ? avgReserves1.div(avgReserves0) : avgReserves0.div(avgReserves1)
            const profit = settlesInWeth ? backrunParams.profit : backrunParams.profit.div(avgPrice)
            if (profit.gt(gasCost)) {
                console.log("BACKRUN")
                const tokenArb = backrunParams.settlementToken === 1 ? token0 : token1
                const tokenSettle = backrunParams.settlementToken === 0 ? token0 : token1
                const startFactory = userSwap.factory
                const endFactory = startFactory === deployment.uniV2FactoryA.contractAddress ? deployment.uniV2FactoryB.contractAddress : deployment.uniV2FactoryA.contractAddress
                const pairStart: string = startFactory === deployment.uniV2FactoryA.contractAddress ? pairA.address : pairB.address
                const pairEnd: string = startFactory === deployment.uniV2FactoryA.contractAddress ? pairB.address : pairA.address
                const amountIn = BigNumber.from(backrunParams.backrunAmount.toFixed(0))

                console.log("tokenArb", findTokenName(tokenArb, deployment), tokenArb)
                console.log("tokenSettle", findTokenName(tokenSettle, deployment), tokenSettle)

                const arbRequest = await deployedContracts.atomicSwap.populateTransaction.arb(
                    tokenArb,
                    tokenSettle,
                    startFactory,
                    endFactory,
                    pairStart,
                    pairEnd,
                    amountIn
                )
                const signedArb = wallet.signTransaction(populateTxFully(arbRequest, await provider.getTransactionCount(wallet.address), {from: wallet.address, chainId: provider.network.chainId}))
                let arbSendResult
                try {
                    arbSendResult = await provider.sendTransaction(await signedArb)
                    const daiAddress = wethIndex === 0 ? token1 : token0
                    const daiIdx = deployedContracts.dai.map(c => c.address.toLowerCase()).indexOf(daiAddress.toLowerCase())
                    const daiContract = deployedContracts.dai[daiIdx]
                    if ((await arbSendResult.wait()).confirmations > 0){
                        console.log("ARB LANDED")
                    }
                    const userBalances = {
                        WETH: formatEther(await deployedContracts.weth.balanceOf(wallet.address)),
                        DAI: formatEther(await daiContract.balanceOf(wallet.address)),
                    }
                    const swapContractBalances = {
                        WETH: formatEther(await deployedContracts.weth.balanceOf(deployment.atomicSwap.contractAddress)),
                        DAI: formatEther(await daiContract.balanceOf(deployment.atomicSwap.contractAddress)),
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
                return {
                    arbRequest,
                    signedArb,
                    arbSendResult,
                }
            }
        }
    }
}
