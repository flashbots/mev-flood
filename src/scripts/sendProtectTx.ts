import { providers } from 'ethers'
import { getSendProtectTxArgs } from '../lib/cliArgs'
import env from '../lib/env'
import { createRevertingUniTx, getSampleLotteryTx } from '../lib/lottery'
import { getAdminWallet } from '../lib/wallets'

async function main() {
    const args = getSendProtectTxArgs()
    if (!args) {
        return
    }
    const provider = new providers.JsonRpcProvider(env.PROTECT_URL)
    const adminWallet = getAdminWallet().connect(provider)

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
