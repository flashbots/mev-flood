import { randomUUID } from 'crypto'
import { utils } from 'ethers'
import { cancelBundle, sendBundle } from '../lib/flashbots'
import { getWethDepositBundle, GWEI, PROVIDER, sleep } from "../lib/helpers"
import { getTestWallet } from '../lib/wallets'

async function main() {
    const sender = getTestWallet()
    const nonce = await sender.connect(PROVIDER).getTransactionCount()
    const gasPrice = await (await PROVIDER.getGasPrice()).add(GWEI.mul(5))

    PROVIDER.on('block', async blockNum => {
        console.log(`[block ${blockNum}]`)
        // test wallet should have a little eth in it
        console.log(`Using wallet ${sender.address}`)
        const bundle = await getWethDepositBundle(sender, nonce, gasPrice)
        const replacementBundle = await getWethDepositBundle(sender, nonce, gasPrice.add(gasPrice.div(10)))
        if (!bundle) {
            console.error("bundle undefined")
            process.exit(1)
        }
        if (!replacementBundle) {
            console.error("replacementBundle undefined")
            process.exit(1)
        }
        const uuid = randomUUID()
        const targetBlock = (await blockNum) + 2

        try {
            const sendRes = await sendBundle(bundle, targetBlock, uuid)
            console.log("sendRes", sendRes)
        } catch (e) {
            console.error("sendBundle failed", {bundle, targetBlock, uuid}, e)
        }
        await sleep(420)

        try {
            const sendReplacementRes = await sendBundle(replacementBundle, targetBlock, uuid)
            console.log("sendReplacementRes", sendReplacementRes)
        } catch (e) {
            console.error("sendBundle replacement failed", {bundle, targetBlock, uuid}, e)
        }
        await sleep(420)

        const txHashes = [...bundle, ...replacementBundle].map(tx => utils.keccak256(tx))
        txHashes.forEach(async hash => {
            const landed = await PROVIDER.getTransaction(hash)
            console.log(`tx ${hash}`, landed)
        })

        try {
            const cancelRes = await cancelBundle(uuid)
            console.log("cancelRes", cancelRes.data)
        } catch (e) {
            console.error("cancel failed", {bundle, targetBlock, uuid}, e)
        }
    })
    
}

main()
