import { BigNumber, Wallet, providers, utils } from "ethers"
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import { id as ethersId } from "ethers/lib/utils"


import env from "./env"
import { getAdminWallet } from './wallets'
import contracts, { getContract } from './contracts'

export const GWEI = BigNumber.from(1e9)
export const ETH = GWEI.mul(GWEI)
export const PROVIDER = new providers.JsonRpcProvider(env.RPC_URL, {chainId: env.CHAIN_ID, name: env.CHAIN_NAME})

export const getFlashbotsProvider = async (wallet?: Wallet) => FlashbotsBundleProvider.create(PROVIDER, wallet || getAdminWallet(), env.MEV_GETH_HTTP_URL)

/**
 * Now in seconds (UTC).
 */
export const now = () => Math.round(Date.now() / 1000)

/**
 * Pre-calculate a bundle hash.
 * @param signedTxs signed bundle txs
 * @returns bundleHash
 */
export const calculateBundleHash = (signedTxs: string[]) => {
    return utils.keccak256(signedTxs
        .map(tx => utils.keccak256(tx))
        .reduce((prv, cur) => BigNumber.from(prv).add(cur), BigNumber.from(0)).toHexString()
    )
}

/**
 * Get an unsigned sample lottery tx
 * @param sender Wallet connected to a provider.
 * @returns transaction that interacts with lottery contract
 */
export const getSampleLotteryTx = async (sender: Wallet) => {
    const contract = getContract(contracts.LotteryMEV)
    if (!contract) {
        console.warn("lottery contract is undefined for this chain.")
        return
    }
    return {
        ...contract.populateTransaction.bid(),
        from: sender.address,
        to: sender.address,
        value: GWEI.mul(1000),
        gasPrice: GWEI.mul(50),
        gasLimit: BigNumber.from(90000),
        chainId: env.CHAIN_ID,
        nonce: await sender.getTransactionCount()
    }
}