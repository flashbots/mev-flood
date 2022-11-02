import axios from "axios"
import { formatEther, id as ethersId, parseTransaction } from "ethers/lib/utils"
import { Wallet } from 'ethers'

import env from './env'
import { PROVIDER } from './helpers'
import { getAdminWallet } from './wallets'

const authSigner = getAdminWallet()

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

export const cancelBundle = async (uuid: string) => {
    const params = [
        {
	        replacementUuid: uuid,
        }
    ]
    console.log('params', params)

    const { headers, body } = await getRpcRequest(params, "eth_cancelBundle", authSigner)

    return await axios.post(env.MEV_GETH_HTTP_URL, body, {
        headers,
    })
}

export const sendBundle = async (signedTransactions: string[], targetBlock: number, uuid: string) => {
    const params = [
        {
            txs: signedTransactions,
            blockNumber: `0x${targetBlock.toString(16)}`,
            replacementUuid: uuid,
        }
    ]
    console.log('params', params)

    const { headers, body } = await getRpcRequest(params, "eth_sendBundle", authSigner)
    return (await axios.post(env.MEV_GETH_HTTP_URL, body, {
        headers,
    })).data
}

export const simulateBundle = async (signedTransactions: string[], simulationBlock: number) => {
    const block = await PROVIDER.getBlock(simulationBlock)
    
    signedTransactions.forEach((rawTx) => {
        const tx = parseTransaction(rawTx)
        console.log('tx.from', tx.from)
        console.log('tx.to', tx.to)
    })

    const params = [
        {
        txs: signedTransactions,
        blockNumber: `0x${simulationBlock.toString(16)}`,
        stateBlockNumber: `0x${(simulationBlock).toString(16)}`,
        coinbase: block.miner,
        timestamp: block.timestamp,
        gasLimit: block.gasLimit.toNumber(),
        difficulty: block.difficulty
        }
    ]

    let totalGasUsed = 0
    const { body, headers } = await getRpcRequest(params, "eth_callBundle", authSigner)
    const res: any = await axios.post(env.MEV_GETH_HTTP_URL, body, {headers})
    
    if (res.error || res.data.error) {
        let e = res.error ? res.error : res.data.error
        console.log('[flashbots.simulateBundle] error', e)
    }
    
    const simResult = res.data.result
    if (!simResult || !simResult.results) {
        console.error("sim results empty")
        return undefined
    }
    simResult.results.forEach((element: any) => {
        totalGasUsed += element.gasUsed
    })
    const coinbaseDiff = formatEther(simResult.coinbaseDiff)

    console.log(
        `block_number=${simulationBlock},coinbase_diff=${coinbaseDiff},eth_sent_to_coinbase=${formatEther(simResult.ethSentToCoinbase)},totalGasUsed=${totalGasUsed},gasPrice=${simResult.coinbaseDiff / totalGasUsed / 1e9}`
    )
    return simResult
}

export interface GetBundleStatsResponseSuccess {
    isSimulated: boolean
    isSentToMiners: boolean
    isHighPriority: boolean
    simulatedAt: string
    submittedAt: string
    sentToMinersAt: string
}

export interface RelayResponseError {
    error: {
      message: string
      code: number
    }
}

export type GetBundleStatsResponse = GetBundleStatsResponseSuccess | RelayResponseError

export const getBundleStats = async (bundleHash: string, blockNumber: string) => {
    const evmBlockNumber = blockNumber.startsWith("0x") ? blockNumber : `0x${parseInt(blockNumber).toString(16)}`

    const params = [{ bundleHash, blockNumber: evmBlockNumber }]
    const { body, headers } = await getRpcRequest(params, "flashbots_getBundleStats", authSigner)
    const res: any = await axios.post(env.MEV_GETH_HTTP_URL, body, {headers})

    if (res.error !== undefined && res.error !== null) {
      return {
        error: {
          message: res.error.message,
          code: res.error.code
        }
      }
    }

    return res.data
}

export const getBundleStatsV2 = async (bundleHash: string, blockNumber: string) => {
    const evmBlockNumber = blockNumber.startsWith("0x") ? blockNumber : `0x${parseInt(blockNumber).toString(16)}`

    const params = [{ bundleHash, blockNumber: evmBlockNumber }]
    const { body, headers } = await getRpcRequest(params, "flashbots_getBundleStats_v2", authSigner)
    const res: any = await axios.post(env.MEV_GETH_HTTP_URL, body, {headers})

    if (res.error !== undefined && res.error !== null) {
      return {
        error: {
          message: res.error.message,
          code: res.error.code
        }
      }
    }

    return res.data
}
