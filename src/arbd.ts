import Matchmaker from '@flashbots/matchmaker-ts'
import { Mutex } from 'async-mutex'
import { Wallet } from 'ethers'
import { Wallet as WalletV6 } from 'ethersV6'
import MevFlood from '.'
import { getArbdArgs, SendRoute } from './lib/cliArgs'
import { logSendBundleResponse } from './lib/flashbots'
import { loadDeployment } from "./lib/liquid"
import { PROVIDER } from './lib/providers'
import { approveIfNeeded, mintIfNeeded } from './lib/swap'
import { getAdminWallet, getTestWallet, getWalletSet } from './lib/wallets'

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
    const {walletIdx, minProfit, maxProfit, sendRoute, mintWethAmount} = getArbdArgs()
    const wallet = getTestWallet(walletIdx)
    const deployment = await loadDeployment({})
    const contracts = deployment.getDeployedContracts(PROVIDER)

    // check token balances for each wallet, mint more if needed
    const flashbotsSigner = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") // hh[0]
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let adminNonce = await adminWallet.getTransactionCount()
    console.log("using wallet", wallet.address)

    const mevFlood = await new MevFlood(adminWallet, PROVIDER, deployment).initFlashbots(flashbotsSigner)

    // check wallet balance for each token, mint if needed
    await mintIfNeeded(PROVIDER, adminWallet, adminNonce, [wallet], contracts, mintWethAmount)

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    await approveIfNeeded(PROVIDER, [wallet], contracts)

    if (sendRoute === SendRoute.MevShare) {
        const matchmaker = new Matchmaker(new WalletV6(flashbotsSigner.privateKey), PROVIDER.network)
        matchmaker.onShareTransaction(async pendingTx => {
            const blockNum = await PROVIDER.getBlockNumber()
            const backrun = await mevFlood.backrunShareTransaction(pendingTx, {
                minProfit,
                maxProfit,
                nonce: await getNonce(wallet.address),
            })
            if (backrun) {
                try {
                    console.log("sending backrun to flashbots")
                    for (let i = 1; i < 5; i++) { // target next 4 blocks
                        const res = await backrun.sendShareBundle(blockNum + i)
                        if (!res) {
                            resetNonce(wallet.address)
                        }
                    }
                } catch (e) {
                    if ((e as Error).message.includes("nonce too low")) {
                        console.warn("nonce too low, resetting nonce")
                        resetNonce(wallet.address)
                    }
                }
            }
        })
    } else {
        PROVIDER.on('pending', async (pendingTx: any) => {
            // TODO: batch multiple txs to backrun instead of backrunning each one individually
            const backrun = await mevFlood.backrun(pendingTx, {
                minProfit,
                maxProfit,
                nonce: await getNonce(wallet.address),
            })
            if (backrun) {
                if (sendRoute === SendRoute.Flashbots) {
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
                } else if (sendRoute === SendRoute.Mempool) {
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
        })
    }
}

main()
