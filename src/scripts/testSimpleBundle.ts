import contracts, { getContract } from "../lib/contracts"
import env from '../lib/env'
import { simulateBundle } from '../lib/flashbots'
import { ETH, GWEI, populateTxFully } from '../lib/helpers'
import { PROVIDER } from '../lib/providers'
import { getTestWallet } from '../lib/wallets'

const getArgs = () => {
    const helpMessage = `Simulate a bundle that wraps ETH and transfers your WETH to yourself. Useless but effective for testing.

    Usage:
        yarn script.testSimple <minusBlocks>
    
    Example:
        # run a sim against the current block
        yarn script.testSimple 0

        # run a sim 25 blocks in the past
        yarn script.testSimple 25
`
    if (process.argv.length > 2) {
        return {
            minusBlocks: parseInt(process.argv[2])
        }
    } else {
        console.error(helpMessage)
        process.exit(1)
    }
}

async function main() {
    const args = getArgs()
    const wallet = getTestWallet()
    console.log("from\t\t", wallet.address)
    const weth = getContract(contracts.WETH)
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
        maxPriorityFeePerGas: GWEI.mul(3),
        chainId: env.CHAIN_ID,
    }
    const depositTx = populateTxFully(await weth?.populateTransaction.deposit({value: ETH.div(100)}), nonce, options)
    const transferTx = populateTxFully(await weth?.populateTransaction.deposit({value: ETH.div(100)}), nonce + 1, options)
    const bundle = [
        await wallet.signTransaction(depositTx),
        await wallet.signTransaction(transferTx),
    ]
    console.log(JSON.stringify(bundle))
    const simResult = await simulateBundle(bundle, currentBlock + 1, simBlock)
    console.log("sim result", simResult)
}

main()
