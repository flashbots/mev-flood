import { getSendProtectTxArgs } from '../lib/cliArgs'
import { getSampleLotteryTx, PROVIDER } from '../lib/helpers'
import { createRevertingUniTx } from '../lib/lottery'
import { getAdminWallet } from '../lib/wallets'

async function main() {
    const args = getSendProtectTxArgs()
    const adminWallet = getAdminWallet().connect(PROVIDER)

    const tx = args.dummy ? await createRevertingUniTx() : await getSampleLotteryTx(adminWallet)
    if (!tx) {
        console.warn("protect tx is undefined")
        return
    }

    const sendRes = await adminWallet.sendTransaction(tx)
    console.log(sendRes)
}

main().then(() => {
    process.exit(0)
})
