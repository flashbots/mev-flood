import { FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle'
import { Wallet } from 'ethers'
import MevFlood from '.'
import { generateBackrun } from './lib/backrun'
import { getArbdArgs } from './lib/cliArgs'
import { ETH } from './lib/helpers'
import { loadDeployment } from "./lib/liquid"
import { PROVIDER } from './lib/providers'
import { approveIfNeeded, mintIfNeeded } from './lib/swap'
import { getAdminWallet, getWalletSet } from './lib/wallets'

async function main() {
    // get cli args
    const {walletIdx, minProfit, maxProfit, sendToFlashbots, mintWethAmount} = getArbdArgs()
    // TODO: impl minProfit!
    // TODO: impl maxProfit!

    const walletSet = getWalletSet(walletIdx, walletIdx + 1)
    const deployment = await loadDeployment({})
    const contracts = deployment.getDeployedContracts(PROVIDER)

    // check token balances for each wallet, mint more if needed
    const flashbotsSigner = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") // hh[0]
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let adminNonce = await adminWallet.getTransactionCount()
    console.log("using wallets", walletSet.map(w => w.address))

    const flood = async (admin: Wallet) => await new MevFlood(admin, PROVIDER, deployment).initFlashbots(flashbotsSigner)

    // check wallet balance for each token, mint if needed
    await mintIfNeeded(PROVIDER, adminWallet, adminNonce, walletSet, contracts, mintWethAmount)

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    await approveIfNeeded(PROVIDER, walletSet, contracts)

    PROVIDER.on('pending', async (pendingTx: any) => {
        for (const wallet of walletSet) {
            // const backrun = await generateBackrun(PROVIDER, deployment, wallet, pendingTx)
            const backrun = await (await flood(wallet)).backrun(pendingTx)
            if (backrun) {
                if (sendToFlashbots) {
                    const res = await backrun.sendToFlashbots()
                    if (res) {
                        if ("error" in res) {
                            console.error("error sending to flashbots", res.error)
                        } else {
                            const bundleRes = await res.wait()
                            if (bundleRes == FlashbotsBundleResolution.BundleIncluded) {
                                console.log("backrun included!")
                            } else if (bundleRes == FlashbotsBundleResolution.AccountNonceTooHigh) {
                                console.log("nonce too high")
                            } else if (bundleRes == FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
                                console.log("bundle didn't land")
                            }
                        }
                    }
                } else {
                    const res = await backrun.sendToMempool()
                    if (res) {
                        console.log("backrun sent to mempool")
                    }
                }
            }
        }
    })
}

main()
