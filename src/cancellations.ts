import { createDumbLotteryBundles } from './lib/lottery'
import { getSearchWalletSet } from './lib/wallets'
import { GWEI } from './lib/helpers'
import { PROVIDER } from './lib/providers'
import { sendBundle, cancelBundle } from './lib/flashbots'
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';

// load wallets from disk
const walletSet = getSearchWalletSet("cancel")

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// run a block monitor to send bundles on every block
PROVIDER.on('block', async blockNum => {
    console.log(`[BLOCK ${blockNum}]`)
    const bundles = await createDumbLotteryBundles(walletSet, GWEI.mul(31 + randomInt(42)))
    console.log("bundles", bundles)

        console.warn("SENDING TXS TO FLASHBOTS")

        // send
		const uuid = uuidv4()
        try {
            const sendResults = []
			for (const bundle of bundles) {
				sendResults.push(sendBundle([bundle.bidTx, bundle.claimTx], blockNum + 1, uuid))
			}
            const sentBundles = await Promise.all(sendResults)
            console.log("sent bundles", sentBundles)
            await sleep(1800)
            const cancelRes = await cancelBundle(uuid)
            console.log("canceled bundles", cancelRes.data)
        } catch (e) {
            const err: any = e
            console.error("[sendBundle] backend error", err.code)
        }
})
