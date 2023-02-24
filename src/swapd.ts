import { getSwapdArgs } from './lib/cliArgs'
import { loadDeployment } from "./lib/liquid"
import { PROVIDER } from './lib/providers'
import { sendSwaps } from './lib/scripts/swap'
import { approveIfNeeded, mintIfNeeded } from './lib/swap'
import { getAdminWallet, getWalletSet } from './lib/wallets'

async function main() {
    // get cli args
    const {startIdx, endIdx, numSwaps, numPairs, minUsd, maxUsd, daiIndex, swapWethForDai, exchange, mintWethAmount} = getSwapdArgs()
    // TODO: impl numPairs!
    // TODO: impl numSwaps!

    const walletSet = getWalletSet(startIdx, endIdx)
    const deployment = await loadDeployment({})
    const contracts = deployment.getDeployedContracts(PROVIDER)

    // check token balances for each wallet, mint more if needed
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let adminNonce = await adminWallet.getTransactionCount()
    console.log("using wallets", walletSet.map(w => w.address))

    // check wallet balance for each token, mint if needed
    await mintIfNeeded(PROVIDER, adminWallet, adminNonce, walletSet, contracts, mintWethAmount)

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    await approveIfNeeded(PROVIDER, walletSet, contracts)

    PROVIDER.on('block', async blockNum => {
        console.log(`[BLOCK ${blockNum}]`)
        try {
            await sendSwaps({
                minUSD: minUsd,
                maxUSD: maxUsd,
                swapOnA: exchange !== undefined ? exchange === "A" : undefined,
                swapWethForDai,
                daiIndex,
            },
                PROVIDER, walletSet, deployment)
        } catch (_) {/* ignore errors, just spam it */}
    })
}

main()
