import { Contract, providers, Wallet } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import contracts from '../contracts'
import { LiquidDeployment } from '../liquid'
import { createRandomSwap, signSwap, SwapOptions } from '../swap'

export const createSwaps = async (options: SwapOptions, provider: providers.JsonRpcProvider, userWallets: Wallet[], deployment: LiquidDeployment) => {
    let signedSwaps = []
    let swapParams = []
    for (const wallet of userWallets) {
        const nonce = await wallet.connect(provider).getTransactionCount()
        const atomicSwapContract = new Contract(deployment.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
        const swap = createRandomSwap(
            deployment.uniV2FactoryA.contractAddress,
            deployment.uniV2FactoryB.contractAddress,
            deployment.dai.map(c => c.contractAddress),
            deployment.weth.contractAddress,
            options
        )
        swapParams.push(swap)
        const wethForDai = swap.path[0].toLowerCase() === deployment.weth.contractAddress.toLowerCase()
        console.log(`swapping ${formatEther(swap.amountIn)} ${wethForDai ? "WETH" : "DAI"} for ${wethForDai ? "DAI" : "WETH"}`)
        const signedSwap = await signSwap(atomicSwapContract, swap.uniFactory, wallet, swap.amountIn, swap.path, nonce, provider.network.chainId)
        signedSwaps.push(signedSwap)
    }
    console.log(`created swaps from ${signedSwaps.length} wallets`)
    return {signedSwaps, swapParams}
}
