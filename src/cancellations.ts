import { createDumbLotteryBundles } from './lib/lottery'
import { getWalletSet } from './lib/wallets'
import { GWEI, PROVIDER } from './lib/helpers'
import { sendBundle, cancelBundle } from './lib/flashbots'
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';

// load wallets from disk
const walletSet = getWalletSet("cancel")

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// run a block monitor to send bundles on every block
PROVIDER.on('block', async blockNum => {
    console.log(`[BLOCK ${blockNum}]`)
    const bundles = await createDumbLotteryBundles(walletSet, GWEI.mul(31 + randomInt(42)))
    console.log("bundles", bundles)

        console.warn("SENDING TXS TO FLASHBOTS")

        // send
        try {
            const sendResults = []
			for (const bundle of bundles) {
                const uuid = uuidv4()
				sendResults.push({
                    bundle: sendBundle([bundle.bidTx, bundle.claimTx], blockNum + 1, uuid),
                    uuid,
                })
			}
            const sentBundles = await Promise.all(sendResults.map(res => res.bundle))
            console.log("sent bundles", sentBundles)
            await sleep(1800)
            for (const sentBundle of sentBundles) {
                const cancelRes = await cancelBundle(sentBundle.uuid)
                console.log("canceled bundles", cancelRes.data)
            }
        } catch (e) {
            const err: any = e
            console.error("[sendBundle] backend error", err.code)
        }
})
