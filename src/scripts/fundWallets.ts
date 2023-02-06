import { Wallet } from "ethers"
import MevFlood from '..'

import env from '../lib/env'
import { PROVIDER } from '../lib/providers'
import minionWallets from "../output/wallets.json"

async function main() {
    // read wallets from file, send them each some ether
    const adminWallet = new Wallet(env.ADMIN_PRIVATE_KEY, PROVIDER)
    console.log("admin wallet", adminWallet.address)

    const mevFlood = new MevFlood(adminWallet, PROVIDER)
    const fundedWallets = await mevFlood.fundWallets(minionWallets.map(wallet => wallet.address), 50)
    console.log(`Sent txs (${fundedWallets.length})`)
}

main().then(() => {
    process.exit(0)
})
