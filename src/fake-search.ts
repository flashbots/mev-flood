import { createNonLandingTx } from './lib/lottery'
import { getWalletSet } from './lib/wallets'
import { PROVIDER } from './lib/helpers'
import { sendBundle, simulateBundle } from './lib/flashbots'
import { useMempool } from './lib/cliArgs'

const doStuff = async (blockNum: number) => {
    console.log(`[BLOCK ${blockNum}]`)
    const tx = await createNonLandingTx()
    if (!tx) {
        console.warn("fake tx is undefined")
        return
    }
    // simulate
    console.log('simulating bundle...')
    const simResult = simulateBundle([tx], blockNum)
    console.log("simResultPromise", simResult)
    console.log("simResult", await simResult)
    // send
}

// PROVIDER.on('block', async (blockNum: number) => {
//     await doStuff(blockNum)
// })

const singleTest = async () => {
    const blockNum = await PROVIDER.getBlockNumber()
    await doStuff(blockNum)
}

singleTest()
