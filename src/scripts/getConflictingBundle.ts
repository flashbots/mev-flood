import { getFlashbotsProvider, getRpcRequest } from '../lib/helpers';
import { getAdminWallet } from '../lib/wallets';

async function main() {
    const fbProvider = await getFlashbotsProvider(getAdminWallet())
    const bundle = JSON.parse(process.argv[2])
    const blockNum = parseInt(process.argv[3])
    const res = await fbProvider.getConflictingBundle(bundle, blockNum)
    console.log(res)
}

main().then(() => {
    process.exit(0)
})
