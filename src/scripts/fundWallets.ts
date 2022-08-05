import { Wallet, utils } from "ethers"
import rl from "readline-sync"

import env from '../lib/env'
import { GWEI, PROVIDER } from '../lib/helpers'
import minionWallets from "../output/wallets.json"

const FUND_AMOUNT = utils.parseEther("0.1")

async function main() {
    // read wallets from file, send them each some ether
    const adminWallet = new Wallet(env.ADMIN_PRIVATE_KEY, PROVIDER)
    console.log("admin wallet", adminWallet.address)
    const nonce = await adminWallet.getTransactionCount()

    const txs = minionWallets.map((wallet, i) => {
        const tx = {
            chainId: env.CHAIN_ID,
            value: FUND_AMOUNT,
            from: adminWallet.address,
            to: wallet.address,
            nonce: nonce + i,
            gasPrice: GWEI.mul(15),
            gasLimit: 21000,
        }
        return tx
    })
    console.log(txs)

    const signedTxPromises = txs.map(tx => {
        return adminWallet.signTransaction(tx)
    })
    const signedTxs = await Promise.all(signedTxPromises)
    console.log(signedTxs)

    const shouldSend = rl.question("Transactions are signed. Ready to send them? [y|N] ")
    if (shouldSend.toLowerCase() !== "y") {
        console.log("aborted")
        return
    }

    const sentTxPromises = signedTxs.map(tx => (
        PROVIDER.sendTransaction(tx)
    ))

    const results = await Promise.all(sentTxPromises)
    console.log(`Sent txs (${results.length})`)
}

main().then(() => {
    process.exit(0)
})