import { Wallet, providers } from "ethers"
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'

import env from "./env"
import { getAdminWallet } from './wallets'

export const PROVIDER = new providers.JsonRpcProvider(env.RPC_URL, {chainId: env.CHAIN_ID, name: env.CHAIN_NAME})
export const getFlashbotsProvider = async (wallet?: Wallet) => FlashbotsBundleProvider.create(PROVIDER, wallet || getAdminWallet(), env.MEV_GETH_HTTP_URL)
