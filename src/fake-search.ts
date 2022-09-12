import { createNonLandingTx } from './lib/lottery'
import { calculateBundleHash, PROVIDER } from './lib/helpers'
import { sendBundle, simulateBundle } from './lib/flashbots'

const sendRevertingBundle = async (blockNum: number) => {
    console.log(`[BLOCK ${blockNum}]`)
    const simBlock = blockNum - 1
    const targetBlock = blockNum + 2
    const tx = await createNonLandingTx(2000000000)
    const bundle = tx ? [tx] : []
    if (!tx) {
        console.warn("fake tx is undefined")
        return
    }
    const bundleHash = calculateBundleHash(bundle)
    console.log("bundleHash (pre-calculated)", bundleHash)
    
    // simulate disabled for now...
    // console.log('simulating bundle...')
    // const simResult = simulateBundle(bundle, simBlock)
    // console.log("simResult", await simResult)
    
    // send
    console.log(`sending bundle, targeting block ${targetBlock}...`)
    const sendResult = sendBundle(bundle, targetBlock)
    console.log(await sendResult)
}

PROVIDER.on('block', async (blockNum: number) => {
    await sendRevertingBundle(blockNum)
})
