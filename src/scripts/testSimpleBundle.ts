import { v4 as uuid } from 'uuid'

import contracts, { getContract } from "../lib/contracts"
import env from '../lib/env'
import { sendBundle, simulateBundle } from '../lib/flashbots'
import { ETH, GWEI, populateTxFully } from '../lib/helpers'
import { PROVIDER } from '../lib/providers'
import { getTestWallet } from '../lib/wallets'

const getArgs = () => {
    const helpMessage = `Simulate & optionally send a bundle that wraps ETH and transfers your WETH to yourself.
Useless but effective for testing.

    Usage:
        yarn script.testSimple [minusBlocks] [OPTIONS]

    Options:
        --send: send the bundle to flashbots, targeting the next 10 blocks
    
    Example:
        # run a sim against the current block
        yarn script.testSimpleBundle

        # send a bundle targeting the next block
        yarn script.testSimpleBundle --send

        # run a sim 25 blocks in the past
        yarn script.testSimpleBundle 25
`
    let send = false
    let minusBlocks = 0

    if (process.argv.length > 2) {
        if (process.argv.slice(2).includes("--send")) {
            send = true
        }
        minusBlocks = parseInt(process.argv[2])
        if (Number.isNaN(minusBlocks)) {
            minusBlocks = 0
        }
    }
    return {
        minusBlocks,
        send,
    }
}

async function main() {
    const args = getArgs()
    const wallet = getTestWallet()
    console.log("from\t\t", wallet.address)
    const weth = getContract(contracts.WETH, env.CHAIN_ID)
    if (!weth) {
        console.error("invalid WETH contract")
        process.exit(1)
    }
    const currentBlock = await PROVIDER.getBlockNumber() 
    console.log("currentBlock\t", currentBlock)
    const simBlock = currentBlock - args.minusBlocks
    console.log("simBlock\t", simBlock)
    const nonce = await wallet.connect(PROVIDER).getTransactionCount(simBlock)
    console.log("nonce\t\t", nonce)
    const options = {
        from: wallet.address,
        gasLimit: 55000,
        maxFeePerGas: GWEI.mul(42),
        maxPriorityFeePerGas: GWEI.mul(13),
        chainId: env.CHAIN_ID,
    }
    const depositTx = populateTxFully(await weth?.populateTransaction.deposit({value: ETH.div(1000000)}), nonce, options)
    const transferTx = populateTxFully(await weth?.populateTransaction.deposit({value: ETH.div(1000000)}), nonce + 1, options)
    const bundle = [
        await wallet.signTransaction(depositTx),
        await wallet.signTransaction(transferTx),
    ]
    console.log(`'${JSON.stringify(bundle)}'`)
    const simResult = await simulateBundle(bundle, currentBlock + 1, simBlock)
    console.log("sim result", simResult)
    const bundleId = uuid()
    if (args.send) {
        let sendResults = []
        for (let i = 1; i < 11; i++) {
            sendResults.push(sendBundle(bundle, currentBlock + i, bundleId))
        }
        const results = await Promise.all(sendResults)
        console.log("send results", results)
    }
}

main()
