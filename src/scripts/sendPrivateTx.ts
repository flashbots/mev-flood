import { FlashbotsBundleProvider, FlashbotsPrivateTransactionResponse, RelayResponseError } from '@flashbots/ethers-provider-bundle';
import { BigNumber } from 'ethers';
import env from '../lib/env';
import { GWEI, PROVIDER } from '../lib/helpers';
import { getAdminWallet } from '../lib/wallets';

async function main() {
    const adminWallet = getAdminWallet()
    const flashbotsProvider = await FlashbotsBundleProvider.create(PROVIDER, adminWallet, env.MEV_GETH_HTTP_URL, env.CHAIN_NAME)
    const tx = {
        from: adminWallet.address,
        to: adminWallet.address,
        value: "0x42",
        gasPrice: GWEI.mul(10),
        gasLimit: BigNumber.from(21000),
        chainId: env.CHAIN_ID,
    }
    const privateTx = {
        transaction: tx,
        signer: adminWallet,
    }

    const res: FlashbotsPrivateTransactionResponse | RelayResponseError = await flashbotsProvider.sendPrivateTransaction(privateTx)
    if ('wait' in res) {
        console.log("private tx res", res)
    } else {
        console.error("[privateTx] error", res)
    }
}

main().then(() => {
    process.exit(0)
})
