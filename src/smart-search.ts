import { createSmartLotteryTxs } from './lib/lottery'
import { getWalletSet } from './lib/wallets'
import { PROVIDER } from './lib/helpers'
import { sendBundle, simulateBundle } from './lib/flashbots'
import { useMempool } from './lib/cliArgs'

// load wallets from disk
const walletSet = getWalletSet("smart-search")

// run a block monitor to send bundles on every block
PROVIDER.on('block', async blockNum => {
    console.log(`[BLOCK ${blockNum}]`)
    const signedTxs = await createSmartLotteryTxs(walletSet)
    if (signedTxs.length === 0) {
        console.log("no profit to be had")
        return
    }

    if (useMempool) {
        console.warn("SENDING TXS TO MEMPOOL")
        try {
            for (const signedTx of signedTxs) {
                const res = await PROVIDER.sendTransaction(signedTx)
                console.log("tx result", res)
            }
        } catch (e) {
            const err: any = e
            console.error("backend error", err)
        }
    } else {
        console.warn("SENDING TXS TO FLASHBOTS")
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
            console.error("[simulateBundle] backend error", err.code)
        }

        //send
        try {
            const sentBundles = await Promise.all(signedTxs.map(async tx => {
                return await sendBundle([tx], blockNum + 2)
            }))
            console.log("sent bundles", sentBundles)
        } catch (e) {
            const err: any = e
            console.error("[sendBundle] backend error", err)
        }
    }


    // console.warn("aborting for debug")
    // process.exit(0)
})
