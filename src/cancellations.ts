import { createDumbLotteryBundles } from './lib/lottery'
import { getWalletSet } from './lib/wallets'
import { GWEI, ETH, PROVIDER } from './lib/helpers'
import { sendBundle, cancelBundle, simulateBundle } from './lib/flashbots'
import { useMempool } from './lib/cliArgs'
import { v4 as uuidv4 } from 'uuid';

// load wallets from disk
const walletSet = getWalletSet("dumb-search")

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// run a block monitor to send bundles on every block
PROVIDER.on('block', async blockNum => {
    console.log(`[BLOCK ${blockNum}]`)
    const bundles = await createDumbLotteryBundles(walletSet, GWEI.mul(31))
    console.log("bundles", bundles)

        console.warn("SENDING TXS TO FLASHBOTS")

        // send
		const uuid = uuidv4()
        try {
			for (const bundle of bundles) {
				const res = await sendBundle([bundle.bidTx, bundle.claimTx], blockNum + 1, uuid)
await cancelBundle(uuid)
				await sleep(800)
				console.log("sent bundle", res.data)
			}
        } catch (e) {
            const err: any = e
            console.error("[sendBundle] backend error", err.code)
        }
})
