import { Contract, providers, Wallet } from 'ethers'
import contracts from '../contracts'
import { Deployment } from '../liquid'
import { createRandomSwap, signSwap } from '../swap'

export type SwapParams = {
    maxUSD: number,
    minUSD: number,
}

export const sendSwaps = async (options: SwapParams, provider: providers.JsonRpcProvider, userWallets: Wallet[], deployments: Deployment) => {
    let signedSwaps = []
    for (const wallet of userWallets) {
        const nonce = wallet.connect(provider).getTransactionCount()
        const atomicSwapContract = new Contract(deployments.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
        const swap = createRandomSwap(
            deployments.uniV2Factory_A.contractAddress, 
            deployments.uniV2Factory_B.contractAddress, 
            [deployments.dai.contractAddress], 
            deployments.weth.contractAddress, 
            options.minUSD, 
            options.maxUSD
        )
        const signedSwap = await signSwap(atomicSwapContract, swap.uniFactory, wallet, swap.amountIn, swap.path, await nonce, provider.network.chainId)
        signedSwaps.push(signedSwap)
    }
    const swapPromises = signedSwaps.map(tx => provider.sendTransaction(tx))
    const swapResults = await Promise.all(swapPromises)
    console.log(`swapped with ${swapResults.length} wallets`)
}
