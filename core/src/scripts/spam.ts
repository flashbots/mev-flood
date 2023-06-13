import MevFlood from '..'
import { getExistingDeploymentFilename } from '../lib/liquid'
import { PROVIDER } from '../lib/providers'
import { getAdminWallet } from '../lib/wallets'
import { getSpamArgs } from '../lib/cliArgs'
import { spamLoop } from '../lib/scripts/spam'

const {wallet, bundlesPerSecond, txsPerBundle, sendRoute, overdrive} = getSpamArgs()

async function main() {
    const connectedWallet = wallet.connect(PROVIDER)
    const mevFlood = await (
        await new MevFlood(connectedWallet, PROVIDER)
        .withDeploymentFile(await getExistingDeploymentFilename())
    ).initFlashbots(getAdminWallet())

    await spamLoop(mevFlood, connectedWallet, {txsPerBundle, sendRoute, bundlesPerSecond})
}

for (let i = 0; i < overdrive; i++) {
    main().then(() => {
        process.exit(0)
    })
}
