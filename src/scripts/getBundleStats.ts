import { getBundleStats, getBundleStatsV2 } from '../lib/flashbots';

const USAGE = `usage:
    yarn script.getBundleStats $bundleHash $blockNumber
`

async function main() {
    process.argv.length < 3 && console.error("missing bundleHash")
    process.argv.length < 4 && (() => {
        console.error("missing blockNumber")
        console.warn(USAGE)
        process.exit(1)
    })()
    if (process.env["BSV2"]) {
        const res = await getBundleStatsV2(process.argv[2], process.argv[3])
        console.log("bundleStats", res)
    } else {
        const res = await getBundleStats(process.argv[2], process.argv[3])
        console.log("bundleStats", JSON.stringify(res, null, 2))
    }
}

main().then(() => {
    process.exit(0)
})
