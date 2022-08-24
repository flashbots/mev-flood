import { FlashbotsBundleProvider, FlashbotsPrivateTransactionResponse, RelayResponseError } from '@flashbots/ethers-provider-bundle';
import { BigNumber } from 'ethers';
import contracts, { getContract } from '../lib/contracts';
import env from '../lib/env';
import { GWEI, PROVIDER } from '../lib/helpers';
import { getAdminWallet } from '../lib/wallets';

async function main() {
    const adminWallet = getAdminWallet().connect(PROVIDER)
    const flashbotsProvider = await FlashbotsBundleProvider.create(PROVIDER, adminWallet, env.MEV_GETH_HTTP_URL, env.CHAIN_NAME)
    const contract = getContract(contracts.LotteryMEV)
    const tx = {
        ...contract.populateTransaction.bid(),
        from: adminWallet.address,
        to: adminWallet.address,
        value: GWEI.mul(1000),
        gasPrice: GWEI.mul(50),
        gasLimit: BigNumber.from(90000),
        chainId: env.CHAIN_ID,
        nonce: await adminWallet.getTransactionCount()
    }
    const privateTx = {
        transaction: tx,
        signer: adminWallet,
    }

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
