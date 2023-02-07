import { BigNumber, Contract, providers, Wallet } from 'ethers'
import { coinToss, ETH, MAX_U256, populateTxFully, randInRange } from './helpers'

export const createRandomSwap = (uniFactoryAddress_A: string, uniFactoryAddress_B: string, daiAddresses: string[], wethAddress: string, minEth?: number, maxEth?: number) => {
    // pick random uni factory
    const uniFactory = coinToss() ? uniFactoryAddress_A : uniFactoryAddress_B
    // pick random DAI contract
    const daiContractAddress = daiAddresses[randInRange(0, daiAddresses.length)]
    // pick random path
    const path = coinToss() ? [wethAddress, daiContractAddress] : [daiContractAddress, wethAddress]
    // pick random amountIn: [500..10000] USD
    const amountInUSD = ETH.mul(randInRange(minEth || 500, maxEth || 10000))
    // if weth out (path_0 == weth) then amount should be (1 ETH / 1300 DAI) * amountIn
    const amountIn = path[0] == wethAddress ? amountInUSD.div(1300) : amountInUSD
    const tokenInName = path[0] === wethAddress ? "WETH" : "DAI"
    const tokenOutName = path[1] === wethAddress ? "WETH" : "DAI"
    return {
        amountIn,
        path,
        tokenInName,
        tokenOutName,
        uniFactory,
    }
}

export const signSwap = async (atomicSwapContract: Contract, uniFactoryAddress: string, sender: Wallet, amountIn: BigNumber, path: string[], nonce: number, chainId: number): Promise<string> => {
    // use custom router to swap
    return await sender.signTransaction(
        populateTxFully(
            await atomicSwapContract.populateTransaction.swap(
                path,
                amountIn,
                uniFactoryAddress,
                sender.address,
                false
            ),
            nonce,
            {from: sender.address, gasLimit: 150000, chainId},
        )
    )
}

export const approveIfNeeded = async (
    provider: providers.JsonRpcProvider,
    walletSet: Wallet[],
    contracts: {
        atomicSwapContract: Contract,
        wethContract: Contract,
        daiContracts: Contract[],
    }) => {
    let signedApprovals: string[] = []
    const chainId = provider.network.chainId
    for (const wallet of walletSet) {
        let nonce = await provider.getTransactionCount(wallet.address)
        const allowanceWeth: BigNumber = await contracts.wethContract.callStatic.allowance(wallet.address, contracts.atomicSwapContract.address)
        if (allowanceWeth.lte(ETH.mul(50))) {
            const approveTx = populateTxFully(
                await contracts.wethContract.populateTransaction.approve(contracts.atomicSwapContract.address, MAX_U256), 
                nonce, 
                {
                    from: wallet.address,
                    gasLimit: 50000,
                    chainId,
                })
                const signedTx = await wallet.signTransaction(approveTx)
                signedApprovals.push(signedTx)
                nonce += 1
        }
        for (const daiContract of contracts.daiContracts) {
            const allowanceDai: BigNumber = await daiContract.callStatic.allowance(wallet.address, contracts.atomicSwapContract.address)
            if (allowanceDai.lte(ETH.mul(100000))) {
                const approveTx = populateTxFully(
                    await daiContract.populateTransaction.approve(contracts.atomicSwapContract.address, MAX_U256),
                    nonce, 
                    {
                        from: wallet.address,
                        gasLimit: 50000,
                        chainId,
                    })
                const signedTx = await wallet.signTransaction(approveTx)
                signedApprovals.push(signedTx)
                nonce += 1
            }
        }
    }
    const approvalPromises = signedApprovals.map(tx => {
        return provider.sendTransaction(tx)
    })
    if (approvalPromises.length > 0) {
        const approvalResults = await Promise.all(approvalPromises)
        console.log(
            "finished approvals for the following addresses", 
            approvalResults
                .map(txRes => txRes.from)
                .filter((val, idx, arr) => 
                    arr.indexOf(val) === idx
                ))
            await approvalResults[approvalResults.length - 1].wait(1) // wait for last tx to be included before proceeding
    } else {
        console.log("no approvals required")
    }
}
