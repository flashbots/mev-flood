import { getFlashbotsProvider } from '../lib/helpers';
import { getAdminWallet } from '../lib/wallets';

async function main() {
    // const res = await getBundleStats(process.argv[2], process.argv[3])
    // console.log("bundleStats", res)
    const fbProvider = await getFlashbotsProvider(getAdminWallet())
    const res = await fbProvider.getConflictingBundle(JSON.parse(process.argv[2]), parseInt(process.argv[3]))
    console.log(res)
}

main().then(() => {
    process.exit(0)
})
