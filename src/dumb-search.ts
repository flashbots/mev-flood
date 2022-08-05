import { createDumbLotteryBundles } from './lib/lottery'
import { getWalletSet } from './lib/wallets'
import { PROVIDER } from './lib/helpers'
import { sendBundle, simulateBundle } from './lib/flashbots'

// load wallets from disk
const walletSet = getWalletSet("dumb-search")

// run a block monitor to send bundles on every block
PROVIDER.on('block', async blockNum => {
    console.log(`[BLOCK ${blockNum}]`)
    const bundles = await createDumbLotteryBundles(walletSet)
    console.log(bundles)

    // simulate
    try {
        for (const bundle of bundles) {
            // each tx should be in its own bundle
            const simResult = await simulateBundle([bundle.bidTx, bundle.claimTx], blockNum)
            console.log("sim result", simResult)
        }
        // throws 500
    } catch (e) {
        const err: any = e
        console.error("backend error", err.code)
    }

    //send
    try {
        const sentBundles = await Promise.all(bundles.map(async bundle => {
            return await sendBundle([bundle.bidTx, bundle.claimTx], blockNum)
        }))
        console.log("sent bundles", sentBundles.map(res => res.data))
    } catch (e) {
        const err: any = e
        console.error("backend error", err.code)
    }

    // console.warn("aborting for debug")
    // process.exit(0)
})
