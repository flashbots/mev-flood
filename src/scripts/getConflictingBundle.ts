import { getFlashbotsProvider } from '../lib/providers';
import { getAdminWallet } from '../lib/wallets';

async function main() {
    if (process.argv.reduce((acc, arg) => acc + arg).includes("help") || process.argv.length < 4) {
        console.log(`Usage:
        yarn script.getConflictingBundle <bundle> <blockNum>
        `)
        process.exit(1)
    }
    const fbProvider = await getFlashbotsProvider(getAdminWallet())
    const bundle = JSON.parse(process.argv[2])
    const blockNum = parseInt(process.argv[3])
    const res = await fbProvider.getConflictingBundle(bundle, blockNum)
    console.log(res)
}

main().then(() => {
    process.exit(0)
})
