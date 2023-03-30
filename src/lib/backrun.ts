import { BigNumber, Contract, PopulatedTransaction, providers, Transaction, utils, Wallet } from 'ethers'
import { formatEther, UnsignedTransaction } from 'ethers/lib/utils'
import { calculateBackrunParams, Pool } from './arbitrage'
import contracts from './contracts'
import { extract4Byte, populateTxFully } from './helpers'
import { LiquidContracts, LiquidDeployment } from './liquid'
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
    public path: string[]
    public amountIn: BigNumber
    public factory: string
    public recipient: string
    public fromThis: boolean
    constructor(params: utils.Result) {
        this.path = params[0]
        this.amountIn = params[1]
        this.factory = params[2]
        this.recipient = params[3]
        this.fromThis = params[4]
    }
}

/** Reserves regarding two pools on which we'll trade. */
export type Reserves = {
    A: {reserves0: BigNumber, reserves1: BigNumber, k: BigNumber},
    B: {reserves0: BigNumber, reserves1: BigNumber, k: BigNumber},
}

export class CoreReserves {
    public A: Pool
    public B: Pool
    constructor(ethersReserves: Reserves) {
        this.A = {
            reserves0: numify(ethersReserves.A.reserves0),
            reserves1: numify(ethersReserves.A.reserves1),
            k: numify(ethersReserves.A.k),
        }
        this.B = {
            reserves0: numify(ethersReserves.B.reserves0),
            reserves1: numify(ethersReserves.B.reserves1),
            k: numify(ethersReserves.B.k),
        }
    }
}

/** Options interface for {@link generateBackrun} */
export type BackrunOptions = {
    minProfit?: BigNumber,
    maxProfit?: BigNumber,
    userPairReserves?: Reserves,
    nonce?: number,
}

/** Gets reserves for a given pair on each exchange.
 * @param token0 Address of token0
 * @param token1 Address of token1
 * @param deployedContracts LiquidContracts object
 * @param provider ethers provider
 * @param userPairReserves Optional user-provided reserves
 * @returns reserves: {reservesA: [BigNumber, BigNumber], reservesB: [BigNumber, BigNumber]}
 */
const getReserves = async (pairAddresses: {pairA: string, pairB: string}, provider: providers.JsonRpcProvider): Promise<Reserves> => {
    // TODO: cache these contracts
    const {pairA, pairB} = getPairContracts(pairAddresses, provider)
    // `pair.getReserves` returns an array [token0Reserves, token1Reserves]
    const reservesA = await pairA.getReserves()
    const reservesB = await pairB.getReserves()
    return {
        A: {reserves0: reservesA[0], reserves1: reservesA[1], k: reservesA[0].mul(reservesA[1])},
        B: {reserves0: reservesB[0], reserves1: reservesB[1], k: reservesB[0].mul(reservesB[1])},
    }
}

const getPairContracts = (pairAddresses: {pairA: string, pairB: string}, provider: providers.JsonRpcProvider) => {
    const pairA = new Contract(pairAddresses.pairA, contracts.UniV2Pair.abi, provider)
    const pairB = new Contract(pairAddresses.pairB, contracts.UniV2Pair.abi, provider)
    return {pairA, pairB}
}

const getPairAddresses = (deployedContracts: LiquidContracts, token0: string, token1: string) => {
    const pairA = deployedContracts.uniV2FactoryA.getPair(token0, token1)
    const pairB = deployedContracts.uniV2FactoryB.getPair(token0, token1)
    return {pairA, pairB}
}

const decodeUserSwap = (calldata: string) => {
    const fnSignature = extract4Byte(calldata)
    // we're expecting a call to `swap` on atomicSwap
    if (fnSignature === "0cc73263") {
        // swap detected
        const decodedTxData = utils.defaultAbiCoder.decode([
            "address[] path",
            "uint256 amountIn",
            "address factory",
            "address recipient",
            "bool fromThis",
        ], `0x${calldata.substring(10)}`)
        return new SwapParams(decodedTxData)
    } else {
        console.warn("unknown function signature", fnSignature)
        return undefined
    }
}

/**
 * Interprets a pending tx and attempts to create a transaction to backrun it.
 * @param provider Provider to pull blockchain state from.
 * @param deployment Liquid deployment instance.
 * @param wallet Wallet from which to send backrun.
 * @param pendingTx Pending tx to try to backrun.
 * @param opts Optional; specifies options including pre-trade reserves (before the user makes their swap). Default: reads from chain.
 * @returns Bundle of transactions to backrun the user's swap, along with arb details.
 */
export async function generateBackrunTx(
    provider: providers.JsonRpcProvider,
    deployment: LiquidDeployment,
    pendingTx: Transaction,
    opts?: BackrunOptions,
): Promise<PopulatedTransaction | undefined> {
    if (pendingTx.to === deployment.atomicSwap.contractAddress) { // swap detected
        // decode tx to get pair and amount
        const userSwap = decodeUserSwap(pendingTx.data)
        if (!userSwap) {
            return undefined
        }

        // get reserves
        // TODO: side daemon that caches the reserves on new blocks
        // for now we can just pull the reserves for every tx but it's not ideal
        const deployedContracts = deployment.getDeployedContracts(provider)
        const pairAddresses = getPairAddresses(deployedContracts, userSwap.path[0], userSwap.path[1])
        const reserves = opts?.userPairReserves || await getReserves(pairAddresses, provider)
        const {pairA, pairB} = getPairContracts(pairAddresses, provider)

        // we can assume that the pair ordering is the same on both pairs
        // bc they are the same contract, so they order the same way
        const token0: string = await pairA?.callStatic.token0()
        const token1: string = await pairA?.callStatic.token1()
        const wethIndex = token0.toLowerCase() === deployment.weth.contractAddress.toLowerCase() ? 0 : 1
        const userSwapXForY = userSwap.path[0].toLowerCase() === token0.toLowerCase()
        const userExchange = userSwap.factory.toLowerCase() === deployment.uniV2FactoryA.contractAddress.toLowerCase() ? "A" : "B"
        const backrunParams = calculateBackrunParams(
            new CoreReserves(reserves),
            numify(userSwap.amountIn),
            userSwapXForY,
            userExchange
        )
        if (!backrunParams) {
            return undefined
        }
        const settlesInWeth = backrunParams.settlementToken === wethIndex

        // TODO: calculate gas cost dynamically (accurately)
        const gasCost = math.bignumber(100000).mul(1e9).mul(40)
        // normalize profit to ETH
        const reserves0 = backrunParams.otherReserves.reserves0
        const reserves1 = backrunParams.otherReserves.reserves1
        const price = wethIndex === 0 ? reserves1.div(reserves0) : reserves0.div(reserves1)
        const profit = settlesInWeth ? backrunParams.profit : backrunParams.profit.div(price)
        if (profit.gt(gasCost)) {
            if (opts?.maxProfit && profit.gt(numify(opts.maxProfit))) {
                console.warn("profit exceeds maxProfit setting")
                return undefined
            }
            if (opts?.minProfit && profit.lt(numify(opts.minProfit))) {
                console.warn(`profit ${formatEther(BigNumber.from(profit.toFixed(0)))} is less than minProfit setting ${formatEther(opts.minProfit)}`)
                return undefined
            }
            console.debug(`BACKRUN. estimated proceeds: ${utils.formatEther(backrunParams.profit.toFixed(0))} ${settlesInWeth ? "WETH" : "DAI"}`)
            const tokenArb = backrunParams.settlementToken === 1 ? token0 : token1
            const tokenSettle = backrunParams.settlementToken === 0 ? token0 : token1
            const factoryStart = userSwap.factory
            const factoryEnd = factoryStart === deployment.uniV2FactoryA.contractAddress ?
                deployment.uniV2FactoryB.contractAddress :
                deployment.uniV2FactoryA.contractAddress
            const pairStart: string | undefined = factoryStart === deployment.uniV2FactoryA.contractAddress ? pairA?.address : pairB?.address
            const pairEnd: string | undefined = factoryStart === deployment.uniV2FactoryA.contractAddress ? pairB?.address : pairA?.address
            const amountIn = BigNumber.from(backrunParams.backrunAmount.toFixed(0))
            if (!pairStart || !pairEnd) {
                return undefined
            }
            return await deployedContracts.atomicSwap.populateTransaction.arb(
                tokenArb,
                tokenSettle,
                factoryStart,
                factoryEnd,
                pairStart,
                pairEnd,
                amountIn
            )
        }
    }
}
