import Matchmaker, {IPendingTransaction} from '@flashbots/matchmaker-ts'
import { BigNumber, Contract, Wallet, providers, utils } from 'ethers'
import { LogParams } from 'ethersV6'
import { calculatePostTradeReserves } from './arbitrage'
import contracts from './contracts'
import { coinToss, ETH, extract4Byte, GWEI, MAX_U256, populateTxFully, randInRange, h256ToAddress, GasFeeOptions, computeUniV2PairAddress, sortTokens } from './helpers'
import { numify } from './math'
import { PROVIDER } from './providers'

/**
 * Options for generating a new swap.
 */
export type SwapOptions = {
    minUSD?: number,
    maxUSD?: number,
    swapOnA?: boolean,
    daiIndex?: number,
    swapWethForDai?: boolean,
    gasFees?: GasFeeOptions,
}

/**
 * Contract-specific parameters of a generated swap.
 */
export type SwapParams = {
    amountIn: BigNumber,
    path: string[],
    tokenInName: string,
    tokenOutName: string,
    uniFactoryAddress: string,
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

type UniV2SwapLog = {
    recipientAddress: string,
    amount0In: BigNumber,
    amount1In: BigNumber,
    amount0Out: BigNumber,
    amount1Out: BigNumber,
    routerAddress: string,
    pairAddress: string,
}

enum SwapException {
    InvalidLogs = "Swap logs were detected, but could not be parsed",
    NoSwapLogs = "No swap logs detected",
    UnknownFunctionSignature = "Unknown function signature",
}

class SwapError extends Error {
    public message: string
    constructor(public exceptionId: SwapException, message?: string) {
        super(`${exceptionId}${message && ": " + message}`)
        this.message = message || exceptionId
    }
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
     * @param swapDecoder optional override for decoding calldata
     * @returns 
     */
    static fromCalldata(calldata: string, decodeCalldata?: (calldata: string) => IPendingSwap) {
        const params = decodeCalldata ? decodeCalldata(calldata) : decodeSwapCalldata(calldata)
        const { path, amountIn, factory, recipient, fromThis } = params
        return new PendingSwap(path, amountIn, factory, recipient, fromThis)
    }

    /**
     * Create a PendingSwap from a PendingShareTransaction; tries calldata, then logs if calldata fails.
     * @param pendingTx pending share transaction
     * @param provider ethers provider
     * @param decodeCalldata optional override for decoding calldata
     * @param decodeLogs optional override for decoding logs
     * @returns PendingSwap or undefined if no swap detected
     */
    static async fromShareTx(
        pendingTx: IPendingTransaction,
        provider: providers.JsonRpcProvider,
        decodeCalldata?: (calldata: string) => IPendingSwap,
        decodeLogs?: (logs: LogParams[]) => UniV2SwapLog,
    ) {
        if (pendingTx.callData) {
            try {
                return PendingSwap.fromCalldata(pendingTx.callData, decodeCalldata)
            } catch (e) {
                // ignore unknown function signature error, throw all others
                if (!(e as Error).message.includes(SwapException.UnknownFunctionSignature)) {
                    throw e
                }
            }
        }
        if (pendingTx.logs) {
            const logData = decodeLogs ? decodeLogs(pendingTx.logs) : decodeSwapLogs(pendingTx.logs)
            const zeroToOne = logData.amount0In.gt(0) && logData.amount1In.eq(0)
            const pair = new Contract(logData.pairAddress, contracts.UniV2Pair.abi, provider)
            const token0 = await pair.callStatic.token0()
            const token1 = await pair.callStatic.token1()
            const path = zeroToOne ? [token0, token1] : [token1, token0]
            const amountIn = zeroToOne ? logData.amount0In : logData.amount1In
            const factory = await pair.callStatic.factory()
            return new PendingSwap(path, amountIn, factory, logData.recipientAddress, false)
        } else {
            return undefined
        }
    }
}

/**
 * Calldata decoder for swaps sent to the AtomicSwap router (see contracts/atomicSwap.sol).
 * @param calldata calldata from tx
 * @returns pending swap struct
 */
const decodeSwapCalldata = (calldata: string): IPendingSwap => {
    const fnSignature = extract4Byte(calldata)
    // we're expecting a call to `swap` on atomicSwap
    if (fnSignature === "0cc73263") {
        // swap detected
        const params = utils.defaultAbiCoder.decode([
            "address[] path",
            "uint256 amountIn",
            "address factory",
            "address recipient",
            "bool fromThis",
        ], `0x${calldata.substring(10)}`)
        const path = params[0]
        const amountIn = params[1]
        const factory = params[2]
        const recipient = params[3]
        const fromThis = params[4]
        return { path, amountIn, factory, recipient, fromThis }
    } else {
        throw new SwapError(SwapException.UnknownFunctionSignature, fnSignature)
    }
}

/**
 * Logs decoder for Uniswap V2 swaps.
 * @param logs logs from transaction
 * @returns decoded log struct
 */
const decodeSwapLogs = (logs: LogParams[]): UniV2SwapLog => {
    /*
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    */
   const swapTopic = utils.id("Swap(address,uint256,uint256,uint256,uint256,address)")

    // parse swap logs
    const swapLogs = logs.filter(log => log.topics[0] === swapTopic)
    if (swapLogs.length > 0) {
        try {
            const swapLog = swapLogs[0]
            const decodedLog = utils.defaultAbiCoder.decode([
                "uint amount0In",
                "uint amount1In",
                "uint amount0Out",
                "uint amount1Out",
            ], swapLog.data)
            const amount0In = decodedLog[0]
            const amount1In = decodedLog[1]
            const amount0Out = decodedLog[2]
            const amount1Out = decodedLog[3]
            const to = h256ToAddress(swapLog.topics[1])
            const sender = h256ToAddress(swapLog.topics[2])
            const pairAddress = swapLog.address
            const logData = {
                recipientAddress: sender,
                amount0In,
                amount1In,
                amount0Out,
                amount1Out,
                routerAddress: to,
                pairAddress
            }
            console.log("logData", logData)
            return logData
        } catch (e) {
            throw new SwapError(SwapException.InvalidLogs, (e as Error).message)
        }
    } else {
        throw new SwapError(SwapException.NoSwapLogs)
    }
}

/**
 * Gets DAI/ETH price from Uniswap V2.
 */
const getDaiPrice = async (provider: providers.JsonRpcProvider, daiAddress: string, wethAddress: string, factoryAddress: string): Promise<{price: number, reserves: {weth: BigNumber, dai: BigNumber, core: BigNumber[]}}> => {
    const pair = new Contract(await computeUniV2PairAddress(factoryAddress, wethAddress, daiAddress), contracts.UniV2Pair.abi, provider)
    const reserves: BigNumber[] = await pair.callStatic.getReserves()
    const daiIsToken0 = sortTokens(wethAddress, daiAddress).token0 === daiAddress
    return {
        price: ((daiIsToken0 ?
            reserves[0].div(reserves[1]) :
            reserves[1].div(reserves[0]))
            // .div(ETH)
            ).toNumber(),
        reserves: {
            weth: daiIsToken0 ? reserves[1] : reserves[0],
            dai: daiIsToken0 ? reserves[0] : reserves[1],
            core: reserves,
        }
    }
}

const getPostTradeDaiPrice = async (
    provider: providers.JsonRpcProvider,
    contracts: {daiAddress: string, wethAddress: string, uniFactoryAddress: string},
    path: string[],
    amountInUSD: BigNumber
) => {
    const basePrice = await getDaiPrice(provider, contracts.daiAddress, contracts.wethAddress, contracts.uniFactoryAddress)
    const x = basePrice.reserves.core[0]
    const y = basePrice.reserves.core[1]

    const daiIsToken0 = basePrice.reserves.core[0].eq(basePrice.reserves.dai)
    const token0 = daiIsToken0 ? contracts.daiAddress : contracts.wethAddress

    console.log("basePrice", basePrice.price.toFixed(0))
    const postTradeReserves = calculatePostTradeReserves(
        numify(x),
        numify(y),
        numify(x.mul(y)),
        numify(path[0] === contracts.wethAddress ? amountInUSD.div(basePrice.price) : amountInUSD),
        path[0] === token0)
    return (daiIsToken0 ?
        postTradeReserves.reserves0.div(postTradeReserves.reserves1) :
        postTradeReserves.reserves1.div(postTradeReserves.reserves0)
    ).toNumber()
}

export const createRandomSwapParams = async (
    providerOrDaiPrice: providers.JsonRpcProvider | number,
    uniFactoryAddress_A: string,
    uniFactoryAddress_B: string,
    daiAddresses: string[],
    wethAddress: string,
    overrides: SwapOptions,
): Promise<SwapParams> => {
    
    // pick random uni factory
    const uniFactoryAddress = overrides.swapOnA !== undefined ? overrides.swapOnA ? uniFactoryAddress_A : uniFactoryAddress_B : coinToss() ? uniFactoryAddress_A : uniFactoryAddress_B
    // pick random DAI contract
    const daiAddress = daiAddresses[overrides.daiIndex || randInRange(0, daiAddresses.length)]
    // pick random path
    const wethDaiPath = [wethAddress, daiAddress]
    const daiWethPath = [daiAddress, wethAddress]
    const path = overrides.swapWethForDai !== undefined ? 
        overrides.swapWethForDai ? wethDaiPath : daiWethPath
        : coinToss() ? wethDaiPath : daiWethPath
    // pick random amountIn: [500..10000] USD
    const amountInUSD = ETH.mul(randInRange(overrides.minUSD || 100, overrides.maxUSD || 5000))
    // if weth out (path_0 == weth) then amount should be (1 ETH / (DAI/ETH price) DAI) * amountIn; e.g. number(1300)
    const daiPrice = typeof providerOrDaiPrice === "number" ?
        providerOrDaiPrice :
        await getPostTradeDaiPrice(PROVIDER, {daiAddress, wethAddress, uniFactoryAddress}, path, amountInUSD)
    console.log("daiPrice", daiPrice)
    // calculatePostTradeReserves()
    const amountIn = path[0] == wethAddress ?
        amountInUSD.div(Math.floor(daiPrice)) :
        amountInUSD
    const tokenInName = path[0] === wethAddress ? "WETH" : "DAI"
    const tokenOutName = path[1] === wethAddress ? "WETH" : "DAI"
    return {
        amountIn,
        path,
        tokenInName,
        tokenOutName,
        uniFactoryAddress,
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
    gasFees?: GasFeeOptions,
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
            maxFeePerGas: (gasFees?.maxFeePerGas || GWEI.mul(80)).add(gasFees?.gasTip || 0),
            maxPriorityFeePerGas: (gasFees?.maxPriorityFeePerGas || GWEI.mul(5)).add(gasFees?.gasTip || 0)
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
