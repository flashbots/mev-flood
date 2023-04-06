import MevFlood from '..'
import { getExistingDeploymentFilename } from '../lib/liquid'
import { PROVIDER } from '../lib/providers'
import { getAdminWallet, getTestWallet } from '../lib/wallets'
import { getSpamArgs, SendRoute } from '../lib/cliArgs'
import { now } from '../lib/helpers'

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const {wallet, bundlesPerSecond, txsPerBundle, sendRoute, overdrive} = getSpamArgs()

const spam = async () => {
    const mevFlood = await (
        await new MevFlood(wallet, PROVIDER).withDeploymentFile(await getExistingDeploymentFilename())
    ).initFlashbots(getAdminWallet())
    let virtualNonce = await wallet.connect(PROVIDER).getTransactionCount()
    let lastBlockSampledAt = now()
    let targetBlockNumber = await PROVIDER.getBlockNumber() + 1
    while (true) {
        // calling generateSwaps with only one wallet will produce a bundle with only one tx
        const txBundles = await Promise.all(Array(txsPerBundle).fill(0).map((_, idx) => mevFlood.generateSwaps({}, [wallet], virtualNonce + idx)))
        virtualNonce += txBundles.map(b => b.swaps.signedSwaps.length).reduce((a, b) => a + b, 0)
        const bundle = txBundles.map(txb => txb.swaps.signedSwaps.map(s => s.signedTx)).flat()

        if (sendRoute === SendRoute.Mempool) {
            mevFlood.sendToMempool(bundle).catch(() => {/* completely ignore errors */})
        } else if (sendRoute === SendRoute.MevShare) {
            mevFlood.sendToMevShare(bundle, {hints: {calldata: true, logs: true}}).catch(() => {/* completely ignore errors */})
        } else {
            mevFlood.sendBundle(bundle, targetBlockNumber).catch(() => {/* completely ignore errors */})
        }

        await sleep(1000 / bundlesPerSecond)
        if (now() - lastBlockSampledAt > 12000) {
            targetBlockNumber += 1
            lastBlockSampledAt = now()
        }
    }
}

for (let i = 0; i < overdrive; i++) {
    spam().then(() => {
        process.exit(0)
    })
}
