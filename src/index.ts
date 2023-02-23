/** module exports for using mev-flood as a library */
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import { Wallet, providers, Transaction } from 'ethers'
import fs from "fs/promises"
import { handleBackrun } from './lib/backrun'

// lib
import { textColors } from './lib/helpers'
import { ILiquidDeployment, LiquidDeployment, loadDeployment, loadDeployment as loadDeploymentLib } from './lib/liquid'
import scripts, { LiquidParams } from './lib/scripts'
import { approveIfNeeded, SwapOptions } from './lib/swap'

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
    public deployment?: LiquidDeployment

    constructor(adminWallet: Wallet, provider: providers.JsonRpcProvider, deployment?: LiquidDeployment) {
        this.adminWallet = adminWallet
        this.provider = provider
        this.deployment = deployment
    }

    /**
     * Initializes this instance's deployment by loading the given deployment file.
     * @param deploymentFilename 
     * @returns 
     */
    public async init(deploymentFilename?: string) {
        try {
            this.deployment = await loadDeployment({filename: deploymentFilename})
        } catch (e) {
            throw new Error(`deployment "${deploymentFilename}" does not exist, or is not formatted correctly`)
        }
        return this
    }

    public async initFlashbots(flashbotsSigner: Wallet) {
        this.flashbotsProvider = await FlashbotsBundleProvider.create(
            this.provider,
            flashbotsSigner,
            getFlashbotsUrl(this.provider.network.chainId),
            this.provider.network
        )
        return this
    }

    /**
     * Override deployment to use in instance methods.
     * @param deployment 
     * @returns 
     */
    public withLiquid(deployment: LiquidDeployment) {
        return new MevFlood(this.adminWallet, this.provider, deployment)
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
     * @param liquidParams flags to modify the behavior of the function. // TODO: split these out into atomic functions
     * @param userWallet Optional wallet to receive tokens.
     * @param deployment LiquidDeployment object containing contract information. See `MevFlood.loadDeployment` and `MevFlood.saveDeployment`.
     */
    async liquid(liquidParams: LiquidParams, userWallet?: Wallet) {
        // TODO: break liquid into atomic functions; params are confusing
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
                return this.deployToMempool(deployment.signedTxs)
            } else {
                throw new Error("failed to deploy to mempool. No signedTxs in deployment.")
            }
        }

        const deployToFlashbots = async () => {
            if (deployment.signedTxs){
                return this.deployToFlashbots(deployment.signedTxs)
            } else {
                throw new Error("failed to deploy to flashbots. No signedTxs in deployment.")
            }
        }

        return {
            deployment,
            deployToMempool,
            deployToFlashbots,
        }
    }

    private async deployToMempool(allSignedTxs: string[]) {
        let pendingTxs = []
        for (const tx of allSignedTxs) {
            pendingTxs.push(await this.provider.sendTransaction(tx))
        }
        return pendingTxs
    }

    private async deployToFlashbots(allSignedTxs: string[]) {
        if (this.flashbotsProvider) {
            const targetBlock = await this.provider.getBlockNumber() + 1
            return await this.flashbotsProvider.sendRawBundle(allSignedTxs, targetBlock)
        } else {
            throw new Error("must call initFlashbots on MevFlood instance to deploy to flashbots")
        }
    }

    /**
     * Sends a random swap from many wallets.
     * @param swapParams Parameters to adjust the size of the swap. // TODO: add direction
     * @param fromWallets Array of wallets that will send the swaps.
     * @param deployment LiquidDeployment object containing contract information. See `MevFlood.loadDeployment` and `MevFlood.saveDeployment`.
     */
    async sendSwaps(swapParams: SwapOptions, fromWallets: Wallet[]) {
        if (this.deployment)
            return await scripts.sendSwaps(swapParams, this.provider, fromWallets, this.deployment)
        else {
            throw new Error("must initialize MevFlood with a deployment to send swaps")
        }
    }

    /**
     * Attempt to execute a backrun given a pending transaction.
     * @param pendingTx 
     */
    async backrun(pendingTx: Transaction) {
        if (this.deployment)
            return await handleBackrun(this.provider, this.deployment, this.adminWallet, pendingTx)
        else {
            throw new Error("backrun failed")
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
            throw new Error("deployment required for approvals")
        }
    }

    /**
     * Save liquid deployment to file.
     * @param filename File path relative to project root, or absolute path.
     */
    public async saveDeployment(filename: string) {
        if (this.deployment)
            MevFlood.saveDeployment(filename, this.deployment.inner(), this.deployment.signedTxs)
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
}

export = MevFlood
