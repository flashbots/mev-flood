import { BigNumber, Contract, ethers, providers, Transaction, utils, Wallet } from 'ethers'
import { formatEther, UnsignedTransaction } from 'ethers/lib/utils'
import { calculateBackrunParams } from './arbitrage'
import contracts from './contracts'
import { extract4Byte, populateTxFully } from './helpers'
import { ContractDeployment, LiquidContracts, LiquidDeployment } from './liquid'
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

export type Reserves = {
    A: {reserves0: BigNumber, reserves1: BigNumber},
    B: {reserves0: BigNumber, reserves1: BigNumber},
}

/** Gets reserves for a given pair on each exchange.
 * @param token0 Address of token0
 * @param token1 Address of token1
 * @param deployedContracts LiquidContracts object
 * @param provider ethers provider
 * @param userPairReserves Optional user-provided reserves
 * @returns reserves: {reservesA: [BigNumber, BigNumber], reservesB: [BigNumber, BigNumber]}
 */
const getReserves = async (token0: string, token1: string, deployedContracts: LiquidContracts, provider: providers.JsonRpcProvider, userPairReserves?: Reserves) => {
    // get reserves
    const pairAddressA = await deployedContracts.uniV2FactoryA.getPair(token0, token1)
    const pairAddressB = await deployedContracts.uniV2FactoryB.getPair(token0, token1)
    // TODO: cache these contracts
    const pairA = new Contract(pairAddressA, contracts.UniV2Pair.abi, provider)
    const pairB = new Contract(pairAddressB, contracts.UniV2Pair.abi, provider)
    const reserves = userPairReserves ? {
        reservesA: [userPairReserves.A.reserves0, userPairReserves.A.reserves1],
        reservesB: [userPairReserves.B.reserves0, userPairReserves.B.reserves1],
        pairA,
        pairB,
    } : {
        reservesA: await pairA.getReserves(),
        reservesB: await pairB.getReserves(),
        pairA,
        pairB,
    }
    return reserves
}

/**
 * Interprets a pending tx and attempts to create a transaction to backrun it.
 * @param provider Provider to pull blockchain state from.
 * @param deployment Liquid deployment instance.
 * @param wallet Wallet from which to send backrun.
 * @param pendingTx Pending tx to try to backrun.
 * @param userPairReserves Optional; specifies pre-trade reserves (before the user makes their swap). Default: reads from chain.
 * @returns Bundle of transactions to backrun the user's swap, along with arb details.
 */
export const generateBackrun = async (provider: providers.JsonRpcProvider, deployment: LiquidDeployment, wallet: Wallet, pendingTx: Transaction, userPairReserves?: Reserves) => {
    if (pendingTx.to === deployment.atomicSwap.contractAddress) {
        // const nonce = await PROVIDER.getTransactionCount(wallet.address)
        // swap detected
        // TODO: side daemon that caches the reserves on new blocks
        // for now we can just pull the reserves for every tx but it's not ideal
        const deployedContracts = deployment.getDeployedContracts(provider)

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
            const {reservesA, reservesB, pairA, pairB} = await getReserves(userSwap.path[0], userSwap.path[1], deployedContracts, provider, userPairReserves)

            // TODO: only calculate each `k` once
            const kA = reservesA[0].mul(reservesA[1])
            const kB = reservesB[0].mul(reservesB[1])

            // we can assume that the pair ordering is the same on both pairs
            // bc they are the same contract, so they order the same way
            const token0: string = await pairA?.callStatic.token0()
            const token1: string = await pairA?.callStatic.token1()
            const wethIndex = token0.toLowerCase() === deployment.weth.contractAddress.toLowerCase() ? 0 : 1
            const userSwapXForY = userSwap.path[0].toLowerCase() === token0.toLowerCase()
            const userExchange = userSwap.factory.toLowerCase() === deployment.uniV2FactoryA.contractAddress.toLowerCase() ? "A" : "B"
            const backrunParams = calculateBackrunParams(
                numify(reservesA[0]),
                numify(reservesA[1]),
                numify(kA),
                numify(reservesB[0]),
                numify(reservesB[1]),
                numify(kB),
                numify(decodedTxData[1]),
                userSwapXForY,
                userExchange
            )
            if (!backrunParams) {
                return
            }
            const settlesInWeth = backrunParams.settlementToken === wethIndex
            
            // TODO: check profit against min/max profit flags b4 executing
            // TODO: calculate gas cost dynamically (accurately)
            const gasCost = math.bignumber(100000).mul(1e9).mul(40)
            // normalize profit to ETH
            const reserves0 = backrunParams.otherReserves.reserves0
            const reserves1 = backrunParams.otherReserves.reserves1
            const price = wethIndex === 0 ? reserves1.div(reserves0) : reserves0.div(reserves1)
            const profit = settlesInWeth ? backrunParams.profit : backrunParams.profit.div(price)
            if (profit.gt(gasCost)) {
                console.debug(`BACKRUN. estimated proceeds: ${utils.formatEther(backrunParams.profit.toFixed(0))} ${settlesInWeth ? "WETH" : "DAI"}`)
                const tokenArb = backrunParams.settlementToken === 1 ? token0 : token1
                const tokenSettle = backrunParams.settlementToken === 0 ? token0 : token1
                const factoryStart = userSwap.factory
                const factoryEnd = factoryStart === deployment.uniV2FactoryA.contractAddress ? deployment.uniV2FactoryB.contractAddress : deployment.uniV2FactoryA.contractAddress
                const pairStart: string | undefined = factoryStart === deployment.uniV2FactoryA.contractAddress ? pairA?.address : pairB?.address
                const pairEnd: string | undefined = factoryStart === deployment.uniV2FactoryA.contractAddress ? pairB?.address : pairA?.address
                const amountIn = BigNumber.from(backrunParams.backrunAmount.toFixed(0))
                if (!pairStart || !pairEnd) {
                    return
                }

                const arbRequest = await deployedContracts.atomicSwap.populateTransaction.arb(
                    tokenArb,
                    tokenSettle,
                    factoryStart,
                    factoryEnd,
                    pairStart,
                    pairEnd,
                    amountIn
                )
                const signedArb = await wallet.signTransaction(populateTxFully(arbRequest, await provider.getTransactionCount(wallet.address), {from: wallet.address, chainId: provider.network.chainId}))
                if (pendingTx.type === 2) {
                    delete pendingTx.gasPrice
                }
                return {
                    arbRequest,
                    signedArb,
                    bundle: [
                        utils.serializeTransaction(pendingTx as UnsignedTransaction, {r: pendingTx.r || "0x", s: pendingTx.s, v: pendingTx.v}),
                        signedArb,
                    ],
                }
            }
        }
    }
}
