/** module exports for using mev-flood as a library */
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import { Wallet, providers, Transaction, BigNumber } from 'ethers'
import fs from "fs/promises"
import { BackrunOptions, generateBackrunTx } from './lib/backrun'
import Matchmaker, { PendingShareTransaction, ShareBundleParams, ShareTransactionOptions } from "@flashbots/matchmaker-ts"

// lib
import { populateTxFully, serializePendingTx, textColors } from './lib/helpers'
import { ILiquidDeployment, LiquidDeployment, loadDeployment as loadDeploymentLib } from './lib/liquid'
import scripts, { LiquidParams } from './lib/scripts'
import { approveIfNeeded, SwapOptions, PendingSwap } from './lib/swap'

// TODO: remove this once flashbots/ethers-provider-bundle & mev-flood are updated to use ethers v6 throughout
const ethersV6 = require('ethersV6')

const flashbotsUrls = {
    1: "https://relay.flashbots.net",
    5: "https://relay-goerli.flashbots.net",
    11155111: "https://relay-sepolia.flashbots.net"
} // TODO: make a PR to flashbots/ethers-provider-bundle to integrate network detection; users shouldn't need to do this

const getFlashbotsUrl = (chainId: number): string => {
    const url = Object.keys(flashbotsUrls).includes(chainId.toString()) ?
        Object.entries(flashbotsUrls).find(([k,]) => k === chainId.toString())?.[1] :
        undefined
    if (!url) {
        throw new Error(`Flashbots is not supported on network ${chainId}`)
    }
    return url
}

class MevFlood {
    private adminWallet: Wallet
    private provider: providers.JsonRpcProvider
    private flashbotsProvider?: FlashbotsBundleProvider
    private matchmaker?: Matchmaker
    public deployment?: LiquidDeployment

    constructor(adminWallet: Wallet, provider: providers.JsonRpcProvider, deployment?: LiquidDeployment) {
        this.adminWallet = adminWallet
        this.provider = provider
        this.deployment = deployment
    }

    public async initFlashbots(flashbotsSigner: Wallet) {
        this.flashbotsProvider = await FlashbotsBundleProvider.create(
            this.provider,
            flashbotsSigner,
            getFlashbotsUrl(this.provider.network.chainId),
            this.provider.network
        )
        this.matchmaker = new Matchmaker(new ethersV6.Wallet(flashbotsSigner.privateKey), this.provider.network)
        return this
    }

    /**
     * Initializes this instance's deployment by loading the given deployment file.
     * @param deploymentFilename 
     * @returns 
     */
    public async withDeploymentFile(deploymentFilename: string) {
        try {
            this.deployment = await MevFlood.loadDeployment(deploymentFilename)
        } catch (e) {
            console.warn(`deployment "${deploymentFilename}" does not exist, or is not formatted correctly`)
        }
        return this
    }

    /**
     * Override deployment to use in instance methods.
     * @param deployment 
     * @returns 
     */
    public withDeployment(deployment: LiquidDeployment) {
        return new MevFlood(this.adminWallet, this.provider, deployment)
    }

    /**
     * Save liquid deployment to file.
     * @param filename File path relative to project root, or absolute path.
     */
    public async saveDeployment(filename: string) {
        if (this.deployment)
            await MevFlood.saveDeployment(filename, this.deployment.inner(), this.deployment.signedTxs)
        else {
            throw new Error("save deployment failed")
        }
        return this
    }

    /**
     * Loads deployment from the given deployment file.
     * @param filename Filename relative to the project root. JSON file. Ex: "deployment.json"
     * @returns LiquidDeployment object.
     */
    static async loadDeployment(filename: string): Promise<LiquidDeployment> {
        return await loadDeploymentLib({filename})
    }

    /**
     * Saves deployment object to a JSON file.
     * @param filename Filename relative to the project root. Ex: "deployment.json"
     * @param deployment LiquidDeployment object.
     * @param allSignedTxs Array of signed transactions that execute the deployment.
     */
    static async saveDeployment(filename: string, deployment: ILiquidDeployment, allSignedTxs?: string[]) {
        await fs.writeFile(filename, JSON.stringify({deployment: deployment, allSignedTxs}), {encoding: "utf8"})
        console.log(`Saved deployment: ${textColors.Bright}${filename}${textColors.Reset}`)
    }

    /**
     * Sends array of transactions to the mempool.
     * @param signedTxs Array of raw signed transactions.
     * @returns Pending transactions.
     */
    private async sendToMempool(signedTxs: string[]) {
        let pendingTxs = []
        for (const tx of signedTxs) {
            pendingTxs.push(await this.provider.sendTransaction(tx))
        }
        return pendingTxs
    }

    /**
     * Sends a bundle of transactions to Flashbots.
     * @param signedTxs Array of raw signed transactions.
     * @returns Pending bundle response.
     */
    private async sendBundle(signedTxs: string[], targetBlock?: number) {
        if (this.flashbotsProvider) {
            const targetBlockNum = targetBlock || await this.provider.getBlockNumber() + 1
            return await this.flashbotsProvider.sendRawBundle(signedTxs, targetBlockNum)
        } else {
            throw new Error("must call initFlashbots on MevFlood instance to deploy to flashbots")
        }
    }

    private async sendToMevShare(signedTxs: string[], options: ShareTransactionOptions) {
        if (this.matchmaker) {
            return await Promise.all(
                signedTxs.map(tx =>
                    this.matchmaker!
                    .sendShareTransaction(tx, options)
                    .catch(e => console.error("sendShareTransaction failed:", e))
                    // TODO: bubble errors up so sendToMevShare caller can handle it
                )
            )
        } else {
            throw new Error("must call initFlashbots on MevFlood instance to send to mev-share")
        }
    }

    private async sendMevShareBundle(bundleParams: ShareBundleParams) {
        if (this.matchmaker) {
            return await this.matchmaker.sendShareBundle(bundleParams)
        } else {
            throw new Error("must call initFlashbots on MevFlood instance to send to mev-share")
        }
    }

    /**
     * Sends ETH to recipients from `this.adminWallet`.
     * @param recipients Addresses of accounts to receive ETH.
     * @param ethAmount Amount of ETH to send each account (1 == 1 ETH, not 1 wei).
     * @returns Array of pending transactions.
     */
    async fundWallets(recipients: string[], ethAmount: number) {
        return await scripts.fundWallets(
            this.provider,
            recipients,
            this.adminWallet,
            ethAmount,
        )
    }

    /**
     * Deploys & bootstraps a functional Uniswap V2 environment.
     * @param liquidParams flags to modify the behavior of the function.
     * @param userWallet Optional wallet to receive tokens.
     * @param deployment LiquidDeployment object containing contract information. See `MevFlood.loadDeployment` and `MevFlood.saveDeployment`.
     */
    async liquid(liquidParams: LiquidParams, userWallet?: Wallet) {
        // TODO: break liquid's atomic functions out; params are kinda confusing
        const deployment = await scripts.liquid(
            liquidParams,
            this.provider,
            this.adminWallet,
            userWallet || new Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"), // hardhat/anvil[1]
            this.deployment || "deployment.json"
        )
        this.deployment = deployment

        const deployToMempool = async () => {
            if (deployment.signedTxs){
                return this.sendToMempool(deployment.signedTxs)
            } else {
                throw new Error("failed to deploy to mempool. No signedTxs in deployment.")
            }
        }

        const deployToFlashbots = async (targetBlock?: number) => {
            if (deployment.signedTxs){
                return this.sendBundle(deployment.signedTxs, targetBlock)
            } else {
                throw new Error("failed to deploy to flashbots. No signedTxs in deployment.")
            }
        }

        return {
            deployment,
            /** Send deployment transactions as a bundle to Flashbots. */
            deployToFlashbots,
            /** Send deployment transactions to mempool. */
            deployToMempool,
        }
    }

    /**
     * Sends a random swap from many wallets.
     * @param swapParams Parameters to adjust the size of the swap.
     * @param fromWallets Array of wallets that will send the swaps.
     * @param deployment LiquidDeployment object containing contract information. See `MevFlood.loadDeployment` and `MevFlood.saveDeployment`.
     * @returns Swap params w/ signed transactions, callbacks to send to mempool/flashbots/mev-share.
     */
    async generateSwaps(swapParams: SwapOptions, fromWallets: Wallet[], nonceOffset?: number) {
        if (this.deployment) {
            const swaps = await scripts.createSwaps(swapParams, this.provider, fromWallets, this.deployment, nonceOffset)

            // simulate each tx
            for (const swap of swaps.signedSwaps) {
                const simResult = await this.provider.call(swap.tx)
                if (simResult !== "0x") {
                    throw new Error(`Simulated swap failed: ${simResult}`)
                }
            }

            return {
                swaps,
                /** Send swaps as a bundle to Flashbots. */
                sendToFlashbots: async (targetBlock?: number) => this.sendBundle(swaps.signedSwaps.map(swap => swap.signedTx), targetBlock),
                /** Send all swaps to mempool. */
                sendToMempool: async () => this.sendToMempool(swaps.signedSwaps.map(swap => swap.signedTx)),
                /** Send all swaps to mev-share. */
                sendToMevShare: async (shareOptions: ShareTransactionOptions) => this.sendToMevShare(swaps.signedSwaps.map(swap => swap.signedTx), shareOptions),
            }
        } else {
            throw new Error("Must initialize MevFlood with a liquid deployment to send swaps")
        }
    }

    /**
     * Builds a backrun given a pending transaction.
     * @param pendingTx 
     * @returns Backrun with callbacks to send it.
     */
    async backrun(pendingTx: Transaction, sender: Wallet, opts?: BackrunOptions, gasTip?: BigNumber) {
        if (this.deployment) {
            if (pendingTx.to !== this.deployment.atomicSwap.contractAddress) {
                console.warn(`backrun: tx ${pendingTx.hash} is not a swap. Skipping.`)
                return undefined
            }
            // decode tx to get pair and amount
            try {
                const userSwap = PendingSwap.fromCalldata(pendingTx.data)
                const feeData = await this.provider.getFeeData()
                const backrunTx = await generateBackrunTx(this.provider, this.deployment, userSwap, opts, {
                    maxFeePerGas: feeData.maxFeePerGas || undefined,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
                    gasTip,
                })
                if (!backrunTx) {
                    return undefined
                }
                const userTx = serializePendingTx(pendingTx)
                const signedArb = await sender.signTransaction(
                    populateTxFully(
                        backrunTx,
                        opts?.nonce || await this.provider.getTransactionCount(sender.address),
                        {
                            from: sender.address,
                            chainId: this.provider.network.chainId,
                            maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.add(gasTip || 0) : undefined,
                            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.add(gasTip || 0) : undefined,
                        }
                ))
                const bundle = [userTx, signedArb]

                const sendToFlashbots = async (targetBlock?: number) => {
                    return await this.sendBundle(bundle, targetBlock)
                }
                const sendToMempool = async () => {
                    return (await this.sendToMempool([bundle[1]]))[0]
                }
                return {
                    bundle,
                    /** Sends bundle containing original tx we're backrunning and the arb tx. */
                    sendToFlashbots,
                    /** Only sends the arb tx to the mempool, not the tx we're backrunning. */
                    sendToMempool,
                }
            } catch (e) {
                console.warn((e as Error).message)
                return undefined
            }
        }
        else {
            throw new Error("Must initialize MevFlood with a liquid deployment to generate backruns.")
        }
    }

    /**
     * Backrun a pending transaction from mev-share.
     * @param pendingTx Pending mev-share transaction.
     * @param opts Options to modify the behavior of the backrun.
     * @returns Backrun with callbacks to send it.
     */
    async backrunShareTransaction(pendingTx: PendingShareTransaction, sender: Wallet, opts?: BackrunOptions, gasTip?: BigNumber) {
        if (this.deployment) {
            const pendingSwap = await PendingSwap.fromShareTx(pendingTx, this.provider)
            if (!pendingSwap) {
                return undefined
            }
            const feeData = await this.provider.getFeeData()
            const backrun = await generateBackrunTx(this.provider, this.deployment, pendingSwap, opts, {
                maxFeePerGas: feeData.maxFeePerGas || undefined,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
                gasTip,
            })
            if (!backrun) {
                return undefined
            }

            const fullTx = populateTxFully(
                backrun,
                opts?.nonce || await this.provider.getTransactionCount(sender.address),
                {
                    from: sender.address,
                    chainId: this.provider.network.chainId,
                    maxFeePerGas: feeData.maxFeePerGas?.add(gasTip || 0),
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.add(gasTip || 0),
                }
            )

            // simulate backrun tx on its own against latest block
            try {
                const backrunResult = await this.provider.call(fullTx)
                console.log("backrun sim", backrunResult)
            } catch (e) {
                console.warn("backrun sim failed", e)
                console.warn("backrun tx", backrun)
                return undefined
            }

            const signedBackrun = await sender.signTransaction(fullTx)

            const sendShareBundle = async (targetBlock: number) => {
                const bundleParams: ShareBundleParams = {
                    shareTxs: [pendingTx.txHash],
                    backrun: [signedBackrun],
                    targetBlock,
                }
                return await this.sendMevShareBundle(bundleParams)
            }
            return {
                backrun,
                sendShareBundle,
            }
        }
    }

    /**
     * Approves the max spend amount for every token from each wallet in `wallets`.
     * @param wallets Wallets to sign approvals.
     */
    async approveRouter(wallets: Wallet[]) {
        const contracts = this.deployment?.getDeployedContracts(this.provider)
        if (contracts){
            return await approveIfNeeded(this.provider, wallets, contracts)
        } else {
            throw new Error("Must initialize MevFlood with a liquid deployment to send approvals.")
        }
    }
}

export = MevFlood
