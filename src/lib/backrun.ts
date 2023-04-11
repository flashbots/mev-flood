import { BigNumber, Contract, PopulatedTransaction, providers, utils } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { calculateBackrunParams, Pool } from './arbitrage'
import contracts from './contracts'
import { GasFeeOptions, GWEI } from './helpers'
import { LiquidContracts, LiquidDeployment } from './liquid'
import { numify } from './math'
import { PendingSwap } from './swap'

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

/** Options interface for {@link generateBackrunTx} */
export type BackrunOptions = {
    minProfit?: BigNumber,
    maxProfit?: BigNumber,
    userPairReserves?: Reserves,
    nonce?: number,
    gasFees?: GasFeeOptions,
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

/**
 * Interprets a pending tx and attempts to create a transaction to backrun it.
 * @param provider Provider to pull blockchain state from.
 * @param deployment Liquid deployment instance.
 * @param wallet Wallet from which to send backrun.
 * @param pendingTx Pending tx to try to backrun.
 * @param opts Optional; specifies options including pre-trade reserves (before the user makes their swap). Default: reads from chain.
 * @param gasFees Optional; specifies gas fees to use for backrun tx. gasTip is added to each base & priority fee per gas.
 * @returns Bundle of transactions to backrun the user's swap, along with arb details.
 */
export async function generateBackrunTx(
    provider: providers.JsonRpcProvider,
    deployment: LiquidDeployment,
    userSwap: PendingSwap,
    opts?: BackrunOptions,
): Promise<PopulatedTransaction | undefined> {
    // get reserves
    // TODO: side daemon that caches the reserves on new blocks
    // for now we can just pull the reserves for every tx but it's not ideal
    const deployedContracts = deployment.getDeployedContracts(provider)
    const pairAddresses = getPairAddresses(deployedContracts, userSwap.path[0], userSwap.path[1])
    const reserves = opts?.userPairReserves || await getReserves(pairAddresses, provider)
    const {pairA, pairB} = getPairContracts(pairAddresses, provider)

    const token0: string = await pairA?.callStatic.token0()
    const token1: string = await pairA?.callStatic.token1()
    // we can assume that the pair ordering is the same on both pairs
    // bc they are the same contract, so they order the same way
    const wethIndex = token0.toLowerCase() === deployment.weth.contractAddress.toLowerCase() ? 0 : 1

    const backrunParams = calculateBackrunParams(
        new CoreReserves(reserves),
        numify(userSwap.amountIn),
        userSwap.path[0].toLowerCase() === token0.toLowerCase(), // user swapping x for y?
        userSwap.factory.toLowerCase() === deployment.uniV2FactoryA.contractAddress.toLowerCase() ? "A" : "B" // user exchange
    )
    if (!backrunParams) {
        return undefined
    }

    // TODO: calculate gas cost dynamically (accurately)
    const gasUsed = 162000
    const feeData = provider.getFeeData()
    const baseFee = (opts?.gasFees?.maxFeePerGas || (await feeData).maxFeePerGas || GWEI.mul(40))
    const prioFee = (opts?.gasFees?.maxPriorityFeePerGas || (await feeData).maxPriorityFeePerGas || GWEI.mul(2))
    const gasCost = numify(
        baseFee
        .add(prioFee)
        .add(opts?.gasFees?.gasTip || 0)
        .mul(gasUsed)
    )
    // normalize profit to ETH
    const reserves0 = backrunParams.otherReserves.reserves0
    const reserves1 = backrunParams.otherReserves.reserves1
    const price = wethIndex === 0 ? reserves1.div(reserves0) : reserves0.div(reserves1)
    const settlesInWeth = backrunParams.settlementToken === wethIndex
    const proceeds = settlesInWeth ? backrunParams.proceeds : backrunParams.proceeds.div(price)
    const profit = proceeds.sub(gasCost)
    if (proceeds.gt(gasCost)) {
        if (opts?.maxProfit && profit.gt(numify(opts.maxProfit))) {
            console.warn("profit exceeds maxProfit setting")
            return undefined
        }
        if (opts?.minProfit && profit.lt(numify(opts.minProfit))) {
            console.warn(`profit ${formatEther(BigNumber.from(profit.toFixed(0)))} is less than minProfit setting ${formatEther(opts.minProfit)}`)
            return undefined
        }
        console.debug(`BACKRUN. minimum estimated profit: ${utils.formatEther(profit.mul(settlesInWeth ? 1 : price).toFixed(0))} ${settlesInWeth ? "WETH" : "DAI"}`)
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
        return {
            ...await deployedContracts.atomicSwap.populateTransaction.arb(
                tokenArb,
                tokenSettle,
                factoryStart,
                factoryEnd,
                pairStart,
                pairEnd,
                amountIn
            ),
            gasLimit: BigNumber.from(gasUsed),
        }
    }
}
