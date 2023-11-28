import { Wallet } from 'ethers'
import MevFlood from '../..'
import { SendRoute } from '../cliArgs'
import { now } from '../helpers'
import { SwapOptions } from '../swap'

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export enum TxStrategy {
    UniV2 = "univ2",
    UniV2Reverting = "univ2-reverting",
}

/** Sends a batch of bundles. */
export const spam = async (
    mevFlood: MevFlood,
    wallet: Wallet,
    params: {
        targetBlockNumber: number,
        txsPerBundle: number,
        sendRoute: SendRoute,
        txStrategy?: TxStrategy,
}) => {
    const swapParams: SwapOptions = params.txStrategy === TxStrategy.UniV2Reverting ? {
        minUSD: 1000000000000, // $1T trade should revert
        swapWethForDai: false, // always swap DAI for WETH
        daiIndex: 0, // always use the first DAI contract
    } : {}
    // calling generateSwaps with only one wallet will produce a bundle with only one tx
    const txBundles = await Promise.all(
        Array(params.txsPerBundle)
        .fill(0)
        .map((_, idx) => mevFlood.generateSwaps(
            swapParams,
            [wallet],
            idx
        )))
    const bundle = txBundles.map(txb => txb.swaps.signedSwaps.map(s => s.signedTx)).flat()

    if (params.sendRoute === SendRoute.Mempool) {
        mevFlood.sendToMempool(bundle).catch((e) => {console.warn("caught", e)})
    } else if (params.sendRoute === SendRoute.MevShare) {
        mevFlood.sendToMevShare(bundle, {hints: {calldata: true, logs: true}}).catch((e) => {console.warn(e)})
    } else {
        mevFlood.sendBundle(bundle, params.targetBlockNumber).catch((e) => {console.warn(e)})
    }
}

/** Spams continuously, updating the target block if needed. */
export const spamLoop = async (mevFlood: MevFlood, wallet: Wallet, params: {
    txsPerBundle: number,
    sendRoute: SendRoute,
    msPerBundle: number,
    txStrategy?: TxStrategy,
}) => {
    try {
        await wallet.provider.getBlockNumber()
    } catch {
        console.error("wallet must be connected to a provider")
        process.exit(1)
    }
    let lastBlockSampledAt = now()
    let targetBlockNumber = await wallet.provider.getBlockNumber() + 1
    while (true) {
        spam(mevFlood, wallet, {targetBlockNumber, txsPerBundle: params.txsPerBundle, sendRoute: params.sendRoute, txStrategy: params.txStrategy})
        await sleep(params.msPerBundle)
        if (now() - lastBlockSampledAt > 12000) {
            targetBlockNumber += 1
            lastBlockSampledAt = now()
        }
    }
}
