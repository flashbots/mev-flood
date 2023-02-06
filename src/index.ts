/** module exports for using mev-flood as a library */
import { Wallet, providers } from 'ethers'

// lib
import scripts from './lib/scripts'

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
            (await this.provider.getNetwork()).chainId
        )
    }
}

export = MevFlood
