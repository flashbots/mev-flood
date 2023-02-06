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
