import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';
import env from '../lib/env';
import { PROVIDER } from '../lib/helpers';
import { getAdminWallet } from '../lib/wallets';

async function main() {
    const adminWallet = getAdminWallet()
    const flashbotsProvider = await FlashbotsBundleProvider.create(PROVIDER, adminWallet, env.MEV_GETH_HTTP_URL, env.CHAIN_NAME)
    
    const txHash = process.argv[2]
    const res = await flashbotsProvider.cancelPrivateTransaction(txHash)
    !!res ? console.log(`tx ${txHash} cancelled`) : console.log("cancellation failed")
}

main().then(() => {
    process.exit(0)
})
