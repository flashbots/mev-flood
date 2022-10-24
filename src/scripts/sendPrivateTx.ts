import { FlashbotsBundleProvider, FlashbotsPrivateTransactionResponse, RelayResponseError } from '@flashbots/ethers-provider-bundle';
import { getSendPrivateTxArgs } from '../lib/cliArgs';
import env from '../lib/env';
import { getSampleLotteryTx, PROVIDER } from '../lib/helpers';
import { createRevertingUniTx } from '../lib/lottery';
import { getAdminWallet } from '../lib/wallets';

async function main() {
    const args = getSendPrivateTxArgs()
    if (!args) {
        return
    }
    const adminWallet = getAdminWallet().connect(PROVIDER)
    // create custom flashbots provider w/ RPC_URL instead of MEV_GETH_URL (pre-merge infra is not fully integrated w/ one URL)
    const flashbotsProvider = await FlashbotsBundleProvider.create(PROVIDER, adminWallet, env.RPC_URL, env.CHAIN_NAME)

    const tx = args.dummy ? await createRevertingUniTx() : await getSampleLotteryTx(adminWallet)
    if (!tx) {
        console.warn("private tx is undefined")
        return
    }

    const privateTx = {
        transaction: tx,
        signer: adminWallet,
    }
    console.log("privateTx", privateTx)

    const res: FlashbotsPrivateTransactionResponse | RelayResponseError = await flashbotsProvider.sendPrivateTransaction(privateTx)
    if ('wait' in res) {
        console.log("private tx res", res)
        const simRes = await res.simulate()
        console.log("sim result", simRes)
    } else {
        console.error("[privateTx] error", res)
    }
}

main().then(() => {
    process.exit(0)
})
