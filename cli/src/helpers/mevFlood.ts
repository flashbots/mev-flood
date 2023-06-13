import { Wallet, providers } from 'ethers'
import MevFlood from '../../../core/build'

export const getFlood = (flags: {rpcUrl: string, userKey: string, ownerKey: string}) => {
    const provider = new providers.JsonRpcProvider(flags.rpcUrl)
    const userWallet = new Wallet(flags.userKey, provider)
    const ownerWallet = new Wallet(flags.ownerKey, provider)

    const flood = new MevFlood(ownerWallet, provider)
    return {
        provider,
        userWallet,
        ownerWallet,
        flood,
    }
}
