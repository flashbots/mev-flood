import MevFlood from '..'
import { getExistingDeploymentFilename } from '../lib/liquid'
import { PROVIDER } from '../lib/providers'
import { getAdminWallet } from '../lib/wallets'
import { getSpamArgs, SendRoute } from '../lib/cliArgs'
import { now } from '../lib/helpers'

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const {wallet, bundlesPerSecond, txsPerBundle, sendRoute, overdrive} = getSpamArgs()

const spam = async (mevFlood: MevFlood, targetBlockNumber: number, virtualNonce: number) => {
    // calling generateSwaps with only one wallet will produce a bundle with only one tx
    const txBundles = await Promise.all(Array(txsPerBundle).fill(0).map((_, idx) => mevFlood.generateSwaps({}, [wallet], virtualNonce + idx)))
    virtualNonce = virtualNonce + txBundles.map(b => b.swaps.signedSwaps.length).reduce((a, b) => a + b, 0)
    const bundle = txBundles.map(txb => txb.swaps.signedSwaps.map(s => s.signedTx)).flat()

    if (sendRoute === SendRoute.Mempool) {
        mevFlood.sendToMempool(bundle).catch((e) => {console.warn(e)})
    } else if (sendRoute === SendRoute.MevShare) {
        mevFlood.sendToMevShare(bundle, {hints: {calldata: true, logs: true}}).catch((e) => {console.warn(e)})
    } else {
        mevFlood.sendBundle(bundle, targetBlockNumber).catch((e) => {console.warn(e)})
    }
}

async function main() {
    const mevFlood = await (
        await new MevFlood(wallet, PROVIDER)
        .withDeploymentFile(await getExistingDeploymentFilename())
    ).initFlashbots(getAdminWallet())
    let targetBlockNumber = await PROVIDER.getBlockNumber() + 1
    let virtualNonce = await wallet.connect(PROVIDER).getTransactionCount()

    while (true) {
        spam(mevFlood, targetBlockNumber, virtualNonce)
        await sleep(1000 / bundlesPerSecond)
        if (now() - lastBlockSampledAt > 12000) {
            targetBlockNumber += 1
            lastBlockSampledAt = now()
        }
    }
}

let lastBlockSampledAt = now()
for (let i = 0; i < overdrive; i++) {
    main().then(() => {
        process.exit(0)
    })
}
