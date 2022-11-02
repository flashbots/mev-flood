import { BigNumber, Wallet, providers, utils } from "ethers"
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import { id as ethersId, UnsignedTransaction } from "ethers/lib/utils"


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

export const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

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
    const nonce = sender.getTransactionCount()
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
        nonce: await nonce,
    }
}

/**
 * Creates a bundle of unsigned txs which wrap & unwrap 420gwei in WETH.
 * @param sender wallet with at least 420 + (baseFee * 50000) gwei
 * @param nonceOverride nonce override for first transaction; second tx is always nonceOverride + 1
 * @returns array of signed txs
 */
export const getWethDepositBundle = async (sender: Wallet, nonceOverride?: number, gasPriceOverride?: BigNumber): Promise<string[] | undefined> => {
    const weth = getContract(contracts.WETH)
    if (!weth) {
        console.warn("WETH contract is undefined")
        return
    }
    const baseFee = gasPriceOverride || PROVIDER.getGasPrice()
    const nonce = nonceOverride || sender.connect(PROVIDER).getTransactionCount()
    const existingWethBalance = await weth.connect(PROVIDER).balanceOf(sender.address)
    const bundle = [
        {
            ...await weth.populateTransaction.deposit(),
            to: weth.address,
            value: GWEI.mul(420),
            maxFeePerGas: await baseFee,
            maxPriorityFeePerGas: GWEI.mul(2),
            gasLimit: BigNumber.from(50000),
            chainId: env.CHAIN_ID,
            nonce: await nonce,
            type: 2,
        },
        {
            ...await weth.populateTransaction.withdraw(GWEI.mul(420).add(existingWethBalance)),
            to: weth.address,
            value: 0,
            maxFeePerGas: await baseFee,
            maxPriorityFeePerGas: GWEI.mul(2),
            gasLimit: BigNumber.from(50000),
            chainId: env.CHAIN_ID,
            nonce: (await nonce) + 1,
            type: 2,
        }
    ]
    console.log("bundle", bundle)
    return await Promise.all(bundle.map(tx => sender.signTransaction(tx)))
}
