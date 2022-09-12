import { BigNumber, providers, utils } from "ethers"
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'

import env from "./env"
import { getAdminWallet } from './wallets'

export const GWEI = BigNumber.from(1e9)
export const ETH = GWEI.mul(GWEI)
export const PROVIDER = new providers.JsonRpcProvider(env.RPC_URL, {chainId: env.CHAIN_ID, name: env.CHAIN_NAME})
export const FB_PROVIDER = FlashbotsBundleProvider.create(PROVIDER, getAdminWallet(), env.MEV_GETH_HTTP_URL)
export const now = () => Math.round(Date.now() / 1000)
export const calculateBundleHash = (signedTxs: string[]) => {
    return utils.keccak256(signedTxs
        .map(tx => utils.keccak256(tx))
        .reduce((prv, cur) => BigNumber.from(prv).add(cur), BigNumber.from(0)).toHexString()
    )
}
