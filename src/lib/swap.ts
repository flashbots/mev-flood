import { PendingShareTransaction } from '@flashbots/matchmaker-ts'
import { BigNumber, Contract, PopulatedTransaction, Wallet, providers, utils } from 'ethers'
import { LogParams } from 'ethersV6'
import { coinToss, ETH, extract4Byte, GWEI, MAX_U256, populateTxFully, randInRange } from './helpers'

/**
 * Options for generating a new swap.
 */
export type SwapOptions = {
    minUSD?: number,
    maxUSD?: number,
    swapOnA?: boolean,
    daiIndex?: number,
    swapWethForDai?: boolean,
}

/**
 * Contract-specific parameters of a generated swap.
 */
export type SwapParams = {
    amountIn: BigNumber,
    path: string[],
    tokenInName: string,
    tokenOutName: string,
    uniFactory: string,
}

/**
 * Pending swap from the mempool or mev-share.
 */
export interface IPendingSwap {
    // address[] memory path,
    path: string[]
    // uint256 amountIn,
    amountIn: BigNumber
    // address factory,
    factory: string
    // address recipient,
    recipient: string
    // bool fromThis
    fromThis: boolean
}

/**
 * Class to decode swap params from pending transactions. The common interface for calling `generateBackrunTx`.
 * 
 * Instantiate by calling one of the static methods: {@link fromCalldata} or {@link fromShareTx}.
 */
export class PendingSwap implements IPendingSwap {
    constructor (
        public path: string[],
        public amountIn: BigNumber,
        public factory: string,
        public recipient: string,
        public fromThis: boolean,
    ) {
        this.amountIn = amountIn
        this.path = path
        this.factory = factory
        this.recipient = recipient
        this.fromThis = fromThis
    }

    /**
     * Create a PendingSwap from raw calldata.
     * @param calldata raw calldata of transaction
     * @param swapDecoder optional override for decoding calldata; should return an array of params `[path, amountIn, factory, recipient, fromThis]` from ethers.utils.ABI_CODER.decode
     * @returns 
     */
    static fromCalldata(calldata: string, swapDecoder?: (calldata: string) => utils.Result) {
        const params = swapDecoder ? swapDecoder(calldata) : decodeSwapCalldata(calldata)
        const path = params[0]
        const amountIn = params[1]
        const factory = params[2]
        const recipient = params[3]
        const fromThis = params[4]
        return new PendingSwap(path, amountIn, factory, recipient, fromThis)
    }

    static fromShareTx(pendingTx: PendingShareTransaction, swapDecoder?: (calldata: string) => utils.Result) {
        if (pendingTx.callData) {
            try {
                return PendingSwap.fromCalldata(pendingTx.callData, swapDecoder)
            } catch (e) {
                // ignore unknown function signature error, throw all others
                if (!(e as Error).message.includes("Unknown function signature:")) {
                    throw e
                }
            }
        }
        if (pendingTx.logs) {
            const logData = decodeSwapLogs(pendingTx.logs)
            // return new PendingSwap(hints.path, hints.amountIn, hints.factory, hints.recipient, hints.fromThis)
        } else {
            return undefined
        }
    }
}

const decodeSwapCalldata = (calldata: string) => {
    const fnSignature = extract4Byte(calldata)
    // we're expecting a call to `swap` on atomicSwap
    if (fnSignature === "0cc73263") {
        // swap detected
        const decodedTxData = utils.defaultAbiCoder.decode([
            "address[] path",
            "uint256 amountIn",
            "address factory",
            "address recipient",
            "bool fromThis",
        ], `0x${calldata.substring(10)}`)
        return decodedTxData
    } else {
        throw new Error("Unknown function signature: " + fnSignature)
    }
}

export const decodeSwapLogs = (logs: LogParams[]) => {
    console.log("logs", logs)
    // TODO: univ2 logs
    throw new Error("unimplemented")
}

export const createRandomSwapParams = (
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

export const signSwap = async (
    atomicSwapContract: Contract,
    uniFactoryAddress: string,
    sender: Wallet,
    amountIn: BigNumber,
    path: string[],
    nonce: number,
    chainId: number,
    gasTip?: BigNumber,
): Promise<{signedTx: string, tx: providers.TransactionRequest}> => {
    // use custom router to swap
    const tx = populateTxFully(
        await atomicSwapContract.populateTransaction.swap(
            path,
            amountIn,
            uniFactoryAddress,
            sender.address,
            false
        ),
        nonce,
        {
            from: sender.address,
            gasLimit: 150000,
            chainId,
            maxFeePerGas: GWEI.mul(80).add(gasTip || 0),
            maxPriorityFeePerGas: GWEI.mul(5).add(gasTip || 0)
        },
    )
    return {
        signedTx: await sender.signTransaction(tx),
        tx,
    }
}

export const approveIfNeeded = async (
    provider: providers.JsonRpcProvider,
    walletSet: Wallet[],
    contracts: {
        atomicSwap: Contract,
        weth: Contract,
        dai: Contract[],
    },
    gasTip?: BigNumber
) => {
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
                    maxFeePerGas: GWEI.mul(80).add(gasTip || 0),
                    maxPriorityFeePerGas: GWEI.mul(5).add(gasTip || 0),
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
                        maxFeePerGas: GWEI.mul(80).add(gasTip || 0),
                        maxPriorityFeePerGas: GWEI.mul(5).add(gasTip || 0),
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
    gasTip?: BigNumber,
) => {
    let signedDeposits = []
    let signedMints = []

    for (const wallet of walletSet) {
        let wethBalance: BigNumber = await contracts.weth.callStatic.balanceOf(wallet.address)
        if (wethBalance.lt(wethAmount)) {
            let nonce = await wallet.connect(provider).getTransactionCount()
            const tx = populateTxFully(await contracts.weth.populateTransaction.deposit({value: wethAmount}), nonce, {
                gasLimit: 50000,
                from: wallet.address,
                chainId: provider.network.chainId,
                maxFeePerGas: GWEI.mul(80).add(gasTip || 0),
                maxPriorityFeePerGas: GWEI.mul(5).add(gasTip || 0),
            })
            const signedDeposit = await wallet.signTransaction(tx)
            signedDeposits.push(signedDeposit)
        }

        for (const d of contracts.dai) {
            let daiBalance: BigNumber = await d.callStatic.balanceOf(wallet.address)
            if (daiBalance.lt(ETH.mul(50000))) {
                // mint 50k DAI to wallet from admin account (DAI deployer)
                const mintTx = await adminWallet.signTransaction(populateTxFully(await d.populateTransaction.mint(wallet.address, ETH.mul(50000)), adminNonce++, {
                    gasLimit: 60000,
                    from: adminWallet.address,
                    chainId: provider.network.chainId,
                    maxFeePerGas: GWEI.mul(80).add(gasTip || 0),
                    maxPriorityFeePerGas: GWEI.mul(5).add(gasTip || 0),
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
