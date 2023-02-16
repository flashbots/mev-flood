import { getFlashbotsProvider } from "../lib/providers"
import { getAdminWallet } from '../lib/wallets'

async function main() {
    const wallet = getAdminWallet()
    const fbProvider = await getFlashbotsProvider(wallet)
    const res = await fbProvider.getUserStats()
    console.log(`userStats (${wallet.address})`, res)
}

main().then(() => {
    process.exit(0)
})
