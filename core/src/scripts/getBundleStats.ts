import { getBundleStats } from '../lib/flashbots';

if (process.argv.length < 4) {
    console.log("Usage: yarn script.getBundleStats <bundleHash> <blockNumber>")
    process.exit(1)
}

async function main() {
    const res = await getBundleStats(process.argv[2], process.argv[3])
    console.log("bundleStats", res)
}

main().then(() => {
    process.exit(0)
})
