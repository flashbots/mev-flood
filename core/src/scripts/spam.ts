import MevFlood from '..'
import { getExistingDeploymentFilename } from '../lib/liquid'
import { PROVIDER } from '../lib/providers'
import { getAdminWallet } from '../lib/wallets'
import { getSpamArgs } from '../lib/cliArgs'
import { spamLoop } from '../lib/scripts/spam'

const {wallet, bundlesPerSecond, txsPerBundle, sendRoute, overdrive} = getSpamArgs()

async function main() {
    const mevFlood = await (
        await new MevFlood(wallet, PROVIDER)
        .withDeploymentFile(await getExistingDeploymentFilename())
    ).initFlashbots(getAdminWallet())
    let targetBlockNumber = await PROVIDER.getBlockNumber() + 1
    let virtualNonce = await wallet.connect(PROVIDER).getTransactionCount()

    await spamLoop(mevFlood, PROVIDER, wallet, {targetBlockNumber, virtualNonce, txsPerBundle, sendRoute, bundlesPerSecond})
}

for (let i = 0; i < overdrive; i++) {
    main().then(() => {
        process.exit(0)
    })
}
