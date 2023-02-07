import { Contract, providers, Wallet } from 'ethers'
import contracts from '../contracts'
import { Deployments } from '../liquid'
import { createRandomSwap, signSwap } from '../swap'

export type SwapOptions = {
    maxEth: number,
    minEth: number,
}

export const sendSwaps = async (options: SwapOptions, provider: providers.JsonRpcProvider, userWallets: Wallet[], deployments: Deployments) => {
    let signedSwaps = []
    for (const wallet of userWallets) {
        const nonce = wallet.connect(provider).getTransactionCount()
        const atomicSwapContract = new Contract(deployments.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
        const swap = createRandomSwap(
            deployments.uniV2Factory_A.contractAddress, 
            deployments.uniV2Factory_B.contractAddress, 
            [deployments.dai.contractAddress], 
            deployments.weth.contractAddress, 
            options.minEth, 
            options.maxEth
        )
        const signedSwap = signSwap(atomicSwapContract, swap.uniFactory, wallet, swap.amountIn, swap.path, await nonce, provider.network.chainId)
        signedSwaps.push(signedSwap)
    }
    const swapPromises = signedSwaps.map(tx => provider.sendTransaction(tx))
    const swapResults = await Promise.all(swapPromises)
    console.log(`swapped with ${swapResults.length} wallets`)
}
