/** module exports for using mev-flood as a library */
import { Wallet, providers } from 'ethers'
import fs from "fs/promises"

// lib
import { textColors } from './lib/helpers'
import { Deployments, getDeployment } from './lib/liquid'
import scripts, { LiquidOptions, SwapOptions } from './lib/scripts'

class MevFlood {
    private adminWallet: Wallet
    private provider: providers.JsonRpcProvider

    constructor(adminWallet: Wallet, provider: providers.JsonRpcProvider) {
        this.adminWallet = adminWallet
        this.provider = provider
    }

    /**
     * Sends ETH to recipients from `this.adminWallet`.
     * @param recipients addresses of accounts to receive ETH
     * @param ethAmount amount of ETH to send each account
     * @returns array of pending transactions
     */
    async fundWallets(recipients: string[], ethAmount: number) {
        return scripts.fundWallets(
            this.provider,
            recipients,
            this.adminWallet,
            ethAmount,
        )
    }

    async liquid(options: LiquidOptions, userWallet: Wallet, deployments?: Deployments) {
        return await scripts.liquid(
            options,
            this.provider,
            this.adminWallet,
            userWallet,
            deployments || "deployment.json"
        )
    }

    async sendSwaps(options: SwapOptions, fromWallets: Wallet[], deployments: Deployments) {
        return await scripts.sendSwaps(options, this.provider, fromWallets, deployments)
    }

    static async loadDeployment(filename: string): Promise<Deployments> {
        return (await getDeployment({filename})).deployments
    }

    static async saveDeployments(filename: string, deployments: Deployments, allSignedTxs: string[]) {
        await fs.writeFile(filename, JSON.stringify({deployments, allSignedTxs}), {encoding: "utf8"})
        console.log(`Setup complete. Check output at ${textColors.Bright}${filename}${textColors.Reset}`)
    }
}

export = MevFlood
