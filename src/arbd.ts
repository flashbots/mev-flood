import { handleBackrun } from './lib/backrun'
import { getArbdArgs } from './lib/cliArgs'
import { ETH } from './lib/helpers'
import { loadDeployment } from "./lib/liquid"
import { PROVIDER } from './lib/providers'
import { approveIfNeeded, mintIfNeeded } from './lib/swap'
import { getAdminWallet, getWalletSet } from './lib/wallets'

async function main() {
    // get cli args
    const {walletIdx, minProfit, maxProfit} = getArbdArgs()
    // TODO: impl minProfit!
    // TODO: impl maxProfit!

    const walletSet = getWalletSet(walletIdx, walletIdx + 1)
    const deployment = await loadDeployment({})
    const contracts = deployment.getDeployedContracts(PROVIDER)

    // check token balances for each wallet, mint more if needed
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let adminNonce = await adminWallet.getTransactionCount()
    console.log("using wallets", walletSet.map(w => w.address))

    // check wallet balance for each token, mint if needed
    await mintIfNeeded(PROVIDER, adminWallet, adminNonce, walletSet, contracts, ETH.mul(20))

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    await approveIfNeeded(PROVIDER, walletSet, contracts)

    PROVIDER.on('pending', async (pendingTx: any) => {
        for (const wallet of walletSet) {
            await handleBackrun(PROVIDER, deployment, wallet, pendingTx)
        }
    })
}

main()
