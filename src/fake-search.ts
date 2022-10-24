import { createRevertingUniTx } from './lib/lottery'
import { calculateBundleHash, PROVIDER } from './lib/helpers'
import { sendBundle, simulateBundle } from './lib/flashbots'
import { getAdminWallet } from './lib/wallets'

const sendRevertingBundle = async (blockNum: number) => {
    console.log(`[BLOCK ${blockNum}]`)
    const targetBlock = blockNum + 2
    const adminWallet = getAdminWallet()
    const tx = await createRevertingUniTx(2000000000)
    if (!tx) {
        console.warn("reverting tx is undefined")
        return
    }
    const signedTx = await adminWallet.signTransaction(tx)
    const bundle = signedTx ? [signedTx] : []
    const bundleHash = calculateBundleHash(bundle)
    console.log("bundleHash (pre-calculated)", bundleHash)
    
    // simulate
    console.log('simulating bundle...')
    const simResult = simulateBundle(bundle, blockNum - 1)
    console.log("simResult", await simResult)
    
    // send
    console.log(`sending bundle, targeting block ${targetBlock}...`)
    const sendResult = sendBundle(bundle, targetBlock)
    console.log(await sendResult)
}

PROVIDER.on('block', async (blockNum: number) => {
    await sendRevertingBundle(blockNum)
})
