import { Contract, providers, Wallet } from 'ethers'
import contracts from '../contracts'
import { LiquidDeployment } from '../liquid'
import { createRandomSwap, signSwap } from '../swap'

export type SwapParams = {
    maxUSD?: number,
    minUSD?: number,
    // TODO: add more
}

export const sendSwaps = async (options: SwapParams, provider: providers.JsonRpcProvider, userWallets: Wallet[], deployments: LiquidDeployment) => {
    let signedSwaps = []
    for (const wallet of userWallets) {
        const nonce = await wallet.connect(provider).getTransactionCount()
        const atomicSwapContract = new Contract(deployments.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
        const swap = createRandomSwap(
            deployments.uniV2FactoryA.contractAddress, 
            deployments.uniV2FactoryB.contractAddress, 
            deployments.dai.map(c => c.contractAddress),
            deployments.weth.contractAddress, 
            options.minUSD, 
            options.maxUSD
        )
        const signedSwap = await signSwap(atomicSwapContract, swap.uniFactory, wallet, swap.amountIn, swap.path, nonce, provider.network.chainId)
        signedSwaps.push(signedSwap)
    }
    const swapPromises = signedSwaps.map(tx => provider.sendTransaction(tx))
    const swapResults = await Promise.all(swapPromises)
    console.log(`swapped with ${swapResults.length} wallets`)
}
