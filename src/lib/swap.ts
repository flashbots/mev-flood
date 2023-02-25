import { BigNumber, Contract, providers, Wallet } from 'ethers'
import { coinToss, ETH, MAX_U256, populateTxFully, randInRange } from './helpers'

export type SwapOptions = {
    minUSD?: number,
    maxUSD?: number,
    swapOnA?: boolean,
    daiIndex?: number,
    swapWethForDai?: boolean,
}

export type SwapParams = {
    amountIn: BigNumber,
    path: string[],
    tokenInName: string,
    tokenOutName: string,
    uniFactory: string,
}

export const createRandomSwap = (
    uniFactoryAddress_A: string,
    uniFactoryAddress_B: string,
    daiAddresses: string[],
    wethAddress: string,
    overrides: SwapOptions): SwapParams => {
    
    // pick random uni factory
    const uniFactory = overrides.swapOnA !== undefined ? overrides.swapOnA ? uniFactoryAddress_A : uniFactoryAddress_B : coinToss() ? uniFactoryAddress_A : uniFactoryAddress_B
    // pick random DAI contract
    const daiContractAddress = daiAddresses[overrides.daiIndex || randInRange(0, daiAddresses.length)]
    // pick random path
    const wethDaiPath = [wethAddress, daiContractAddress]
    const daiWethPath = [daiContractAddress, wethAddress]
    const path = overrides.swapWethForDai !== undefined ? 
        overrides.swapWethForDai ? wethDaiPath : daiWethPath
        : coinToss() ? wethDaiPath : daiWethPath
    // pick random amountIn: [500..10000] USD
    const amountInUSD = ETH.mul(randInRange(overrides.minUSD || 100, overrides.maxUSD || 5000))
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
        atomicSwap: Contract,
        weth: Contract,
        dai: Contract[],
    }) => {
    let signedApprovals: string[] = []
    const chainId = provider.network.chainId
    for (const wallet of walletSet) {
        let nonce = await provider.getTransactionCount(wallet.address)
        const allowanceWeth: BigNumber = await contracts.weth.callStatic.allowance(wallet.address, contracts.atomicSwap.address)
        if (allowanceWeth.lte(ETH.mul(50))) {
            const approveTx = populateTxFully(
                await contracts.weth.populateTransaction.approve(contracts.atomicSwap.address, MAX_U256), 
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
        for (const daiContract of contracts.dai) {
            const allowanceDai: BigNumber = await daiContract.callStatic.allowance(wallet.address, contracts.atomicSwap.address)
            if (allowanceDai.lte(ETH.mul(100000))) {
                const approveTx = populateTxFully(
                    await daiContract.populateTransaction.approve(contracts.atomicSwap.address, MAX_U256),
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

export const mintIfNeeded = async (
    provider: providers.JsonRpcProvider,
    adminWallet: Wallet,
    adminNonce: number,
    walletSet: Wallet[],
    contracts: {weth: Contract, dai: Contract[]},
    wethAmount: BigNumber,
) => {
    let signedDeposits = []
    let signedMints = []

    for (const wallet of walletSet) {
        let wethBalance: BigNumber = await contracts.weth.callStatic.balanceOf(wallet.address)
        if (wethBalance.lte(wethAmount)) {
            let nonce = await wallet.connect(provider).getTransactionCount()
            const tx = populateTxFully(await contracts.weth.populateTransaction.deposit({value: wethAmount}), nonce, {
                gasLimit: 50000,
                from: wallet.address,
                chainId: provider.network.chainId,
            })
            const signedDeposit = await wallet.signTransaction(tx)
            signedDeposits.push(signedDeposit)
        }

        for (const d of contracts.dai) {
            let daiBalance: BigNumber = await d.callStatic.balanceOf(wallet.address)
            if (daiBalance.lte(ETH.mul(50000))) {
                // mint 50k DAI to wallet from admin account (DAI deployer)
                const mintTx = await adminWallet.signTransaction(populateTxFully(await d.populateTransaction.mint(wallet.address, ETH.mul(50000)), adminNonce++, {
                    gasLimit: 60000,
                    from: adminWallet.address,
                    chainId: provider.network.chainId
                }))
                signedMints.push(mintTx)
            }
        }
    }

    const depositPromises = signedDeposits.map(tx => provider.sendTransaction(tx))
    const mintPromises = signedMints.map(tx => provider.sendTransaction(tx))
    if (depositPromises.length > 0) {
        const depositResults = await Promise.all(depositPromises)
        console.log(`deposited for ${depositResults.length} accounts`)
        await depositResults[depositResults.length - 1].wait(1) // wait for last tx to be included before proceeding
    } else {
        console.log("no deposits required")
    }
    if (mintPromises.length > 0) {
        const mintResults = await Promise.all(mintPromises)
        console.log(`minted for ${mintResults.length} accounts`)
        await mintResults[mintResults.length - 1].wait(1) // wait for last tx to be included before proceeding
    } else {
        console.log("no mints required")
    }
}
