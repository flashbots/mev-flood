import { BigNumber, Wallet, providers, utils } from "ethers"
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import { id as ethersId } from "ethers/lib/utils"

import env from "./env"
import { getAdminWallet } from './wallets'

export type TransactionRequest = providers.TransactionRequest
export const GWEI = BigNumber.from(1e9)
export const ETH = GWEI.mul(GWEI)
export const PROVIDER = new providers.JsonRpcProvider(env.RPC_URL, {chainId: env.CHAIN_ID, name: env.CHAIN_NAME})

const adminWallet = getAdminWallet()
export const getFlashbotsProvider = async (wallet?: Wallet) => FlashbotsBundleProvider.create(PROVIDER, wallet || adminWallet, env.MEV_GETH_HTTP_URL)

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
 * Standardized RPC request for talking to Bundle API (mev-geth) directly.
 * @param params 
 * @param method 
 * @param authSigner 
 * @returns 
 */
export const getRpcRequest = async (params: any, method: string, authSigner: Wallet) => {
    const body = {
        params,
        method,
        id: '1337',
        jsonrpc: "2.0"
    }
    const signature = `${await authSigner.getAddress()}:${await authSigner.signMessage(ethersId(JSON.stringify(body)))}`
    const headers = {
        'Content-Type': 'application/json',
        'X-Flashbots-Signature': signature,
    }
    return {
        headers,
        signature,
        body,
    }
}

export const textColors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
    
    Black: "\x1b[30m",
    Red: "\x1b[31m",
    Green: "\x1b[32m",
    Yellow: "\x1b[33m",
    Blue: "\x1b[34m",
    Magenta: "\x1b[35m",
    Cyan: "\x1b[36m",
    White: "\x1b[37m",
    
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
}

/**
 * Fills in runtime data for a tx.
 * @param txRequest 
 * @param nonce 
 * @param fromOverride (default: `adminWallet.address`)
 */
 export const populateTxFully = (txRequest: TransactionRequest, nonce: number, fromOverride?: string): TransactionRequest => {
    const from = fromOverride ? fromOverride : adminWallet.address
    return {
        ...txRequest,
        maxFeePerGas: GWEI.mul(42),
        maxPriorityFeePerGas: GWEI.mul(3),
        gasLimit: 9000000,
        from,
        nonce,
        type: 2,
        chainId: env.CHAIN_ID,
    }
}
