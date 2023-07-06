import { Wallet } from 'ethers'
import MevFlood from '../..'
import { SendRoute } from '../cliArgs'
import { now } from '../helpers'

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/** Sends a batch of bundles. */
export const spam = async (
    mevFlood: MevFlood,
    wallet: Wallet,
    params: {
        targetBlockNumber: number,
        virtualNonce: number,
        txsPerBundle: number,
        sendRoute: SendRoute,
}) => {
    // calling generateSwaps with only one wallet will produce a bundle with only one tx
    const txBundles = await Promise.all(Array(params.txsPerBundle).fill(0).map((_, idx) => mevFlood.generateSwaps({}, [wallet], params.virtualNonce + idx)))
    params.virtualNonce = params.virtualNonce + txBundles.map(b => b.swaps.signedSwaps.length).reduce((a, b) => a + b, 0)
    const bundle = txBundles.map(txb => txb.swaps.signedSwaps.map(s => s.signedTx)).flat()

    if (params.sendRoute === SendRoute.Mempool) {
        mevFlood.sendToMempool(bundle).catch((e) => {console.warn(e)})
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
    secondsPerBundle: number,
}) => {
    try {
        await wallet.provider.getBlockNumber()
    } catch {
        console.error("wallet must be connected to a provider")
        process.exit(1)
    }
    let lastBlockSampledAt = now()
    let targetBlockNumber = await wallet.provider.getBlockNumber() + 1
    let virtualNonce = await wallet.getTransactionCount()
    while (true) {
        spam(mevFlood, wallet, {targetBlockNumber, virtualNonce, txsPerBundle: 1, sendRoute: SendRoute.Mempool})
        await sleep(params.secondsPerBundle * 1000)
        if (now() - lastBlockSampledAt > 12000) {
            targetBlockNumber += 1
            lastBlockSampledAt = now()
        }
    }
}
