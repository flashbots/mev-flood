import { createSmartLotteryTxs } from './lib/lottery'
import { getWalletSet } from './lib/wallets'
import { PROVIDER } from './lib/helpers'
import { sendBundle, simulateBundle } from './lib/flashbots'

// load wallets from disk
const walletSet = getWalletSet("smart-search")

// run a block monitor to send bundles on every block
PROVIDER.on('block', async blockNum => {
    console.log(`[BLOCK ${blockNum}]`)
    const signedTxs = await createSmartLotteryTxs(walletSet)
    console.log(signedTxs)

    // simulate
    try {
        for (const tx of signedTxs) {
            // each tx should be in its own bundle
            const simResult = await simulateBundle([tx], blockNum)
            console.log("sim result", simResult)
        }
        // throws 500
    } catch (e) {
        const err: any = e
        console.error("backend error", err.code)
    }

    //send
    try {
        const sentBundles = await Promise.all(signedTxs.map(async tx => {
            return await sendBundle([tx], blockNum + 1)
        }))
        console.log("sent bundles", sentBundles.map(res => res.data))
    } catch (e) {
        const err: any = e
        console.error("backend error", err.code)
    }

    // console.warn("aborting for debug")
    // process.exit(0)
})
