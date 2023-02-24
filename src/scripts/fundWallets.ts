import { Wallet } from "ethers"
import MevFlood from '..'
import { getFundWalletsArgs } from '../lib/cliArgs'

import env from '../lib/env'
import { PROVIDER } from '../lib/providers'
import minionWallets from "../output/wallets.json"

async function main() {
    const args = getFundWalletsArgs()
    // read wallets from file, send them each some ether
    const adminWallet = new Wallet(env.ADMIN_PRIVATE_KEY, PROVIDER)
    console.log("admin wallet", adminWallet.address)

    const mevFlood = new MevFlood(adminWallet, PROVIDER)
    await mevFlood.fundWallets(minionWallets.map(wallet => wallet.address), args.eth)
    console.log("Sent txs")
}

main().then(() => {
    process.exit(0)
})
