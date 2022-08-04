import { Wallet } from "ethers"
import readline from "readline-sync"

import { createConflictingBundles } from './lib/bundles'
import minionWallets from "./output/wallets.json"
import { PROVIDER } from './scripts/helpers'

const helpMessage = `Dumb-search on multiple wallets (defined in \`output/wallets.json\`)

Usage:
    <yarn dev | yarn start> <first_wallet_index> <last_wallet_index>

Example:
    # search with 25 wallets
    yarn dev 0 24
`

// read args
if (process.argv.length > 2) {
    if (process.argv[2].includes("help")) {
        console.log(helpMessage)
        process.exit(0)
    }
} else {
    console.error("both wallet indices are required")
    console.log(helpMessage)
    process.exit(1)
}

const [startIdx, endIdx] = process.argv.slice(2)
const walletSet = minionWallets.slice(parseInt(startIdx), parseInt(endIdx)+1).map(wallet => {
    return new Wallet(wallet.privateKey)
})

// run a block monitor to send bundles on every block
PROVIDER.on('block', async blockNum => {
    console.log(`[BLOCK ${blockNum}]`)
    const conflictingBundles = await createConflictingBundles(walletSet)
    console.log(conflictingBundles)

    // uncomment for debug
    // const shouldSend = readline.question("Bundles are ready. Send to the mempool? [y|N] ")
    // if (shouldSend.toLowerCase() !== 'y') {
    //     return
    // }

    const sentBundles = await Promise.all(conflictingBundles.map(async bundle => (
        {
            bidTx: await PROVIDER.sendTransaction(bundle.bidTx),
            claimTx: await PROVIDER.sendTransaction(bundle.claimTx),
        }
    )))
    console.log("sent bundles", sentBundles)
    console.warn("aborting for debug")
    process.exit(0)
})
