import { createDumbLotteryBundles } from './lib/lottery'
import { getWalletSet } from './lib/wallets'
import { PROVIDER } from './lib/helpers'
import { sendBundle, simulateBundle } from './lib/flashbots'
import { useMempool } from './lib/cliArgs'

// load wallets from disk
const walletSet = getWalletSet("dumb-search")

// run a block monitor to send bundles on every block
PROVIDER.on('block', async (blockNum: number) => {
    console.log(`[BLOCK ${blockNum}]`)
    const bundles = await createDumbLotteryBundles(walletSet)
    console.log("bundles", bundles)

    if (useMempool) {
        console.warn("SENDING TXS TO MEMPOOL")
        try {
            const bundleResultPromises = bundles.map(bundle => {
                const bidRes = PROVIDER.sendTransaction(bundle.bidTx)
                const claimRes = PROVIDER.sendTransaction(bundle.claimTx)
                return {bidRes, claimRes}
            })
            const bundleResults = await Promise.all(bundleResultPromises.map(async bundleResult => {
                return await Promise.all([bundleResult.bidRes, bundleResult.claimRes])
            }))
            console.log("[mempool] bundle results", bundleResults)
        } catch (e) {
            const err: any = e
            console.error("[mempool] backend error", err)
        }
    } else {
        console.warn("SENDING TXS TO FLASHBOTS")
        // simulate
        try {
            for (const bundle of bundles) {
                // each tx should be in its own bundle
                const simResult = await simulateBundle([bundle.bidTx, bundle.claimTx], blockNum - 1)
                console.log("sim result", simResult)
            }
            // throws 500
        } catch (e) {
            const err: any = e
            console.error("[simulateBundle] backend error", err.code)
        }

        // send
        try {
            const sentBundles = await Promise.all(bundles.map(async bundle => {
                return await sendBundle([bundle.bidTx, bundle.claimTx], blockNum + 2)
            }))
            console.log("sent bundles", sentBundles)
        } catch (e) {
            const err: any = e
            console.error("[sendBundle] backend error", err.code)
        }
    }
})
