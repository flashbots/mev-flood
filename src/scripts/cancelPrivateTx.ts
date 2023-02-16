import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import { getCancelPrivateTxArgs } from '../lib/cliArgs'
import env from '../lib/env'
import { PROVIDER } from '../lib/providers'
import { getAdminWallet } from '../lib/wallets'

async function main() {
    const adminWallet = getAdminWallet()
    // create custom flashbots provider w/ RPC_URL instead of MEV_GETH_URL (pre-merge infra is not fully integrated w/ one URL)
    const flashbotsProvider = await FlashbotsBundleProvider.create(PROVIDER, adminWallet, env.RPC_URL, env.CHAIN_NAME)

    const txHash = getCancelPrivateTxArgs()
    if (!txHash) {
        console.warn("tx hash must be provided. Run `yarn script.cancelPrivateTx help` for usage.")
        return
    }
    const res = await flashbotsProvider.cancelPrivateTransaction(txHash)
    !!res ? console.log(`tx ${txHash} cancelled`) : console.log("cancellation failed")
}

main().then(() => {
    process.exit(0)
})
