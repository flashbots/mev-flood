import { Mutex } from 'async-mutex'
import { Wallet } from 'ethers'
import MevFlood from '.'
import { getArbdArgs } from './lib/cliArgs'
import { logSendBundleResponse } from './lib/flashbots'
import { loadDeployment } from "./lib/liquid"
import { PROVIDER } from './lib/providers'
import { approveIfNeeded, mintIfNeeded } from './lib/swap'
import { getAdminWallet, getWalletSet } from './lib/wallets'

async function main() {
    // very primitive nonce management
    const walletNonces = new Map<string, number>()
    const nonceMutex = new Mutex()
    const getNonce = async (walletAddress: string) => {
        const release = await nonceMutex.acquire()
        try {
            const nonce = walletNonces.get(walletAddress) || await PROVIDER.getTransactionCount(walletAddress)
            walletNonces.set(walletAddress, nonce + 1)
            return nonce
        } finally {
            release()
        }
    }
    const resetNonce = async (walletAddress: string) => {
        const release = await nonceMutex.acquire()
        try {
            const nonce = await PROVIDER.getTransactionCount(walletAddress)
            walletNonces.set(walletAddress, nonce)
        } finally {
            release()
        }
    }

    // get cli args
    const {walletIdx, minProfit, maxProfit, sendToFlashbots, mintWethAmount} = getArbdArgs()
    const walletSet = getWalletSet(walletIdx, walletIdx + 1)
    const deployment = await loadDeployment({})
    const contracts = deployment.getDeployedContracts(PROVIDER)

    // check token balances for each wallet, mint more if needed
    const flashbotsSigner = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") // hh[0]
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let adminNonce = await adminWallet.getTransactionCount()
    console.log("using wallets", walletSet.map(w => w.address))

    const getFlood = async (admin: Wallet) => await new MevFlood(admin, PROVIDER, deployment).initFlashbots(flashbotsSigner)

    // check wallet balance for each token, mint if needed
    await mintIfNeeded(PROVIDER, adminWallet, adminNonce, walletSet, contracts, mintWethAmount)

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    await approveIfNeeded(PROVIDER, walletSet, contracts)

    PROVIDER.on('pending', async (pendingTx: any) => {
        // TODO: batch multiple txs to backrun instead of backrunning each one individually
        for (const wallet of walletSet) {
            const backrun = await (await getFlood(wallet)).backrun(pendingTx, {
                minProfit,
                maxProfit,
                nonce: await getNonce(wallet.address),
            })
            if (backrun) {
                if (sendToFlashbots) {
                    try {
                        console.log("sending backrun to flashbots")
                        const res = await backrun.sendToFlashbots()
                        await logSendBundleResponse(res)
                        if (!res) {
                            resetNonce(wallet.address)
                        }
                    } catch (e) {
                        if ((e as Error).message.includes("nonce too low")) {
                            console.warn("nonce too low, resetting nonce")
                            resetNonce(wallet.address)
                        }
                    }
                } else {
                    console.log("sending backrun to mempool")
                    try {
                        const res = await backrun.sendToMempool()
                        if (res) {
                            console.log("backrun sent")
                            const result = await res.wait(1)
                            console.log(`backrun ${result.status === 1 ? "landed" : "failed"}`)
                        } else {
                            resetNonce(wallet.address)
                        }
                    } catch (e) {
                        if ((e as Error).message.includes("nonce too low")) {
                            console.warn("nonce too low, resetting nonce")
                            resetNonce(wallet.address)
                        }
                    }
                }
            } else {
                // TODO: reduce load on provider by only doing this once per block
                resetNonce(wallet.address)
            }
        }
    })
}

main()
