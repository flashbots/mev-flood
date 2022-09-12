import { providers } from 'ethers'
import { getSendProtectTxArgs } from '../lib/cliArgs'
import env from '../lib/env'
import { getSampleLotteryTx, PROVIDER } from '../lib/helpers'
import { createRevertingUniTx } from '../lib/lottery'
import { getAdminWallet } from '../lib/wallets'

async function main() {
    const args = getSendProtectTxArgs()
    if (!args) {
        return
    }
    args.fast && console.log("Using 'fast mode'")
    const provider = args?.fast ? new providers.JsonRpcProvider(`${env.RPC_URL}/fast`) : PROVIDER
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
