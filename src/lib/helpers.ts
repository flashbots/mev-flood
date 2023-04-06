import { BigNumber, Wallet, providers, utils, Transaction } from "ethers"
import { getAddress, id as ethersId, keccak256, solidityPack, UnsignedTransaction } from "ethers/lib/utils"

import UniswapV2PairLocal from '../contractsBuild/UniswapV2Pair.sol/UniswapV2Pair.json'

// convenience
export const GWEI = BigNumber.from(1e9)
export const ETH = GWEI.mul(GWEI)
export const MAX_U256 = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")

// convenient here, but confusing if exported
type TransactionRequest = providers.TransactionRequest

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

export const coinToss = (): boolean => {
    return Math.floor(Math.random() * 2) % 2 == 0
}

export const randInRange = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min) + min)
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
        id: 1337,
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

/**
 * Locally calculates the ordering of tokens in a pair, as it would be done by the Uniswap V2 Factory.
 */
export const sortTokens = (tokenA: string, tokenB: string) => {
    let tokenANum = BigNumber.from(tokenA)
    let tokenBNum = BigNumber.from(tokenB)
    let [token0, token1] = tokenANum.lt(tokenBNum) ? [tokenA, tokenB] : [tokenB, tokenA]
    return {
        token0,
        token1,
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
 * // TODO: make this an internal method in MevFlood so it has access to a provider to get base fee
 */
 export const populateTxFully = (txRequest: TransactionRequest, nonce: number, overrides?: TransactionRequest): TransactionRequest => {
    return {
        ...txRequest,
        maxFeePerGas: overrides?.maxFeePerGas || GWEI.mul(42),
        maxPriorityFeePerGas: overrides?.maxPriorityFeePerGas || GWEI.mul(3),
        gasLimit: overrides?.gasLimit || 1000000,
        from: overrides?.from,
        nonce,
        type: 2,
        chainId: overrides?.chainId || 31337,
    }
}

/**
 * Extracts 4-byte function signature from calldata.
 * @param calldata raw calldata (`tx.data`) from tx.
 */
export const extract4Byte = (calldata: string) => {
    return calldata.substring(2, 10)
}

/**
 * Copied from @uniswap/v2-core.
 * @param factoryAddress Contract address of UniswapV2Factory.
 * @param tokens Pair of tokens to compute address for.
 * @param bytecode Bytecode of compiled UniswapV2Pair contract.
 * @returns Pair address.
 */
function getCreate2PairAddress(
    factoryAddress: string,
    [tokenA, tokenB]: [string, string],
    bytecode: string
  ): string {
    const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
    const create2Inputs = [
      '0xff',
      factoryAddress,
      keccak256(solidityPack(['address', 'address'], [token0, token1])),
      keccak256(bytecode)
    ]
    const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
    return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`)
}

/**
 * Computes the address of a UniswapV2Pair contract.
 * @param factoryAddress Contract address of UniswapV2Factory.
 * @param tokenA Address of token A.
 * @param tokenB Address of token B.
 * @returns Pair address.
 */
export const computeUniV2PairAddress = async (factoryAddress: string, tokenA: string, tokenB: string) => {
    return getCreate2PairAddress(factoryAddress, [tokenA, tokenB], UniswapV2PairLocal.bytecode.object)
}

export const serializePendingTx = (pendingTx: Transaction): string => {
    if (pendingTx.type === 2) {
        delete pendingTx.gasPrice
    }
    return utils.serializeTransaction(pendingTx as UnsignedTransaction, {r: pendingTx.r || "0x", s: pendingTx.s, v: pendingTx.v})
}

export const h256ToAddress = (u256: string) => {
    // take contents after leading 0x and first 24 bytes
    return `0x${u256.substring(26)}`
}
