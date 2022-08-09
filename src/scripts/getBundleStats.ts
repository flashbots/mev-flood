import { getBundleStats } from '../lib/flashbots';

async function main() {
    const res = await getBundleStats(process.argv[2], process.argv[3])
    console.log("bundleStats", res)
}

main().then(() => {
    process.exit(0)
})
