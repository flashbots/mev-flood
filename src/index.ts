/** module exports for using mev-flood as a library */
import { Wallet, providers } from 'ethers'
import fs from "fs/promises"

// lib
import { textColors } from './lib/helpers'
import { Deployment, getDeployment } from './lib/liquid'
import scripts, { LiquidParams, SwapParams } from './lib/scripts'

class MevFlood {
    private adminWallet: Wallet
    private provider: providers.JsonRpcProvider

    constructor(adminWallet: Wallet, provider: providers.JsonRpcProvider) {
        this.adminWallet = adminWallet
        this.provider = provider
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
     * @param deployment Deployment object containing contract information. See `MevFlood.loadDeployment` and `MevFlood.saveDeployment`.
     */
    async liquid(liquidParams: LiquidParams, userWallet?: Wallet, deployment?: Deployment) {
        return await scripts.liquid(
            liquidParams,
            this.provider,
            this.adminWallet,
            userWallet || new Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"), // hardhat/anvil[1]
            deployment || "deployment.json"
        )
    }

    /**
     * Sends a random swap from many wallets.
     * @param swapParams Parameters to adjust the size of the swap. // TODO: add direction
     * @param fromWallets Array of wallets that will send the swaps.
     * @param deployment Deployment object containing contract information. See `MevFlood.loadDeployment` and `MevFlood.saveDeployment`.
     */
    async sendSwaps(swapParams: SwapParams, fromWallets: Wallet[], deployment: Deployment) {
        return await scripts.sendSwaps(swapParams, this.provider, fromWallets, deployment)
    }

    /**
     * Loads deployment from the given deployment file.
     * @param filename Filename relative to the project root. JSON file. Ex: "deployment.json"
     * @returns Deployment object.
     */
    static async loadDeployment(filename: string): Promise<Deployment> {
        return (await getDeployment({filename})).deployments
    }

    /**
     * Saves deployment object to a JSON file.
     * @param filename Filename relative to the project root. Ex: "deployment.json"
     * @param deployment Deployment object.
     * @param allSignedTxs Array of signed transactions that execute the deployment.
     */
    static async saveDeployment(filename: string, deployment: Deployment, allSignedTxs: string[]) {
        await fs.writeFile(filename, JSON.stringify({deployment, allSignedTxs}), {encoding: "utf8"})
        console.log(`Saved deployment: ${textColors.Bright}${filename}${textColors.Reset}`)
    }
}

export = MevFlood
