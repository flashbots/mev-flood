import axios from "axios"
import { formatEther, id as ethersId, parseTransaction } from "ethers/lib/utils"

import env from './env'
import { PROVIDER } from './helpers'
import { getAdminWallet } from './wallets'

export const sendBundle = async (signedTransactions: string[], targetBlock: number) => {
    const authSigner = getAdminWallet()
    const params = [
        {
        txs: signedTransactions,
        blockNumber: `0x${targetBlock.toString(16)}`,
        }
    ]
    console.log('params', params)

    const body = {
        params,
        method: 'eth_sendBundle',
        id: '1337',
        jsonrpc: "2.0"
    }

    return await axios.post(env.MEV_GETH_HTTP_URL, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Flashbots-Signature': (await authSigner.getAddress()) + ':' + (await authSigner.signMessage(ethersId(JSON.stringify(body))))
        }
      })
}

export const simulateBundle = async (signedTransactions: string[], simulationBlock: number) => {
    const authSigner = getAdminWallet()
    const block = await PROVIDER.getBlock(simulationBlock)
    console.log("block", block)
    
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
    console.log('params', params)

    let totalGasUsed = 0
    const body = {
        params,
        method: 'eth_callBundle',
        id: '1337',
        jsonrpc: "2.0"
    }
    const res: any = await axios.post(env.MEV_GETH_HTTP_URL, body, {
        headers: {
        'Content-Type': 'application/json',
        'X-Flashbots-Signature': (await authSigner.getAddress()) + ':' + (await authSigner.signMessage(ethersId(JSON.stringify(body))))
        }
    })
    
    if (res.error || res.data.error) {
        let e = res.error ? res.error : res.data.error
        console.log('error', e)
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
