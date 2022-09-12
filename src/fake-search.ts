import { createNonLandingTx } from './lib/lottery'
import { getWalletSet } from './lib/wallets'
import { calculateBundleHash, PROVIDER } from './lib/helpers'
import { sendBundle, simulateBundle } from './lib/flashbots'
import { useMempool } from './lib/cliArgs'

const doStuff = async (blockNum: number) => {
    console.log(`[BLOCK ${blockNum}]`)
    const tx = await createNonLandingTx(1663017869)
    const bundle = tx ? [tx] : []
    if (!tx) {
        console.warn("fake tx is undefined")
        return
    }
    const bundleHash = calculateBundleHash(bundle)
    console.log("bundleHash (pre-calculated)", bundleHash)
    // simulate
    // console.log('simulating bundle...')
    // const simResult = simulateBundle(bundle, blockNum - 1)
    // console.log("simResult", await simResult)
    // send
    // console.log(tx)
    console.log("sending bundle", bundle)
    const sendResult = sendBundle(bundle, blockNum + 2)
    console.log(sendResult)
    console.log(await sendResult)
}

// PROVIDER.on('block', async (blockNum: number) => {
//     await doStuff(blockNum)
// })

const singleTest = async () => {
    const blockNum = await PROVIDER.getBlockNumber()
    await doStuff(blockNum)
}

singleTest()
