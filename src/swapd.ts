import { ShareTransactionOptions } from '@flashbots/matchmaker-ts'
import { Wallet } from 'ethers'

// lib
import MevFlood from '.'
import { getSwapdArgs, SendRoute } from './lib/cliArgs'
import { logSendBundleResponse } from './lib/flashbots'
import { loadDeployment } from "./lib/liquid"
import { PROVIDER } from './lib/providers'
import { approveIfNeeded, mintIfNeeded } from './lib/swap'
import { getAdminWallet, getWalletSet } from './lib/wallets'

async function main() {
    // get cli args
    const {startIdx, endIdx, numSwaps, numPairs, minUsd, maxUsd, daiIndex, swapWethForDai, exchange, mintWethAmount, sendRoute} = getSwapdArgs()
    console.log("sendRoute", sendRoute)

    const walletSet = getWalletSet(startIdx, endIdx)
    const deployment = await loadDeployment({})
    const contracts = deployment.getDeployedContracts(PROVIDER)

    if (numPairs > contracts.dai.length) {
        throw new Error(`numPairs ${numPairs} is higher than the number of dai contracts ${contracts.dai.length}`)
    }

    // check token balances for each wallet, mint more if needed
    const flashbotsSigner = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") // hh[0]
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let adminNonce = await adminWallet.getTransactionCount()
    console.log("using wallets", walletSet.map(w => w.address))

    const flood = await new MevFlood(adminWallet, PROVIDER, deployment).initFlashbots(flashbotsSigner)

    // check wallet balance for each token, mint if needed
    console.log("maybe minting...")
    await mintIfNeeded(PROVIDER, adminWallet, adminNonce, walletSet, contracts, mintWethAmount)

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    console.log("maybe approving...")
    await approveIfNeeded(PROVIDER, walletSet, contracts)

    console.log("watching blocks...")
    PROVIDER.on('block', async blockNum => {
        console.log(`[BLOCK ${blockNum}]`)
        let allSwaps = []
        try {
            for (let i = 0; i < numSwaps; i++) {
                for (let j = 0; j < numPairs; j++) {
                    const swaps = await flood.generateSwaps({
                        minUSD: minUsd,
                        maxUSD: maxUsd,
                        swapOnA: exchange !== undefined ? exchange === "A" : undefined,
                        swapWethForDai,
                        daiIndex: numPairs > 1 ? j : daiIndex,
                    }, walletSet, i)
                    allSwaps.push(swaps)
                }
            }
            if (sendRoute === SendRoute.Flashbots) {
                const res = await allSwaps.map(swaps => swaps.sendToFlashbots())
                const flashbotsResponses = await Promise.all(res)
                flashbotsResponses.forEach(async res => {
                    await logSendBundleResponse(res)
                })
            } else if (sendRoute === SendRoute.Mempool) {
                const swapPromises = allSwaps.map(swaps => swaps.swaps.signedSwaps.map(tx => PROVIDER.sendTransaction(tx)))
                await Promise.all(swapPromises)
            } else {
                const shareOptions: ShareTransactionOptions = {
                    hints: {
                        calldata: true,
                        contractAddress: true,
                        functionSelector: true,
                        logs: true,
                    }
                }
                allSwaps.map(swaps => swaps.sendToMevShare(shareOptions))
            }
        } catch (_) {/* ignore errors, just spam it */}
    })
}

main()
