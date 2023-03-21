import { BigNumber, Contract, ContractFactory, utils, Wallet } from "ethers"
import { formatEther, formatUnits } from 'ethers/lib/utils'

import contracts, { getContract } from './contracts'
// TODO: remove all env invocations from lib; meant to be used outside of lib module
import env from './env'
import { GWEI, ETH, now, TransactionRequest, populateTxFully } from './helpers'
import { PROVIDER } from './providers'
import { getAdminWallet } from './wallets'

const BID_VALUE = ETH.div(100)
// TODO: clean up; don't instantiate contract here; getContract should never return undefined
let lotteryContract = getContract(contracts.LotteryMEV, env.CHAIN_ID)
const adminWallet = getAdminWallet().connect(PROVIDER)

const deployLotteryContract = async (): Promise<Contract> => {
    const factory = new ContractFactory(JSON.stringify(contracts.LotteryMEV.abi), contracts.LotteryMEV.bytecode)
    let adminNonce = await adminWallet.getTransactionCount()
    const txReq = populateTxFully(factory.getDeployTransaction(), adminNonce, {chainId: env.CHAIN_ID})
    const signedDeployTx = await adminWallet.signTransaction(txReq)
    await PROVIDER.sendTransaction(signedDeployTx)
    const lotteryAddress = utils.getContractAddress({from: txReq.from || adminWallet.address, nonce: adminNonce})
    return new Contract(lotteryAddress, contracts.LotteryMEV.abi)
}

/** return a bunch of bundles that compete for the same opportunity */
export const createDumbLotteryBundles = async (walletSet: Wallet[], bidGasPrice: BigNumber): Promise<{bidTx: string, claimTx: string}[]> => {
    if (!lotteryContract) {
        console.log("lottery contract is undefined, attempting to deploy contract")
        lotteryContract = await deployLotteryContract()
        console.log(`lottery contract deployed at ${lotteryContract.address}`)
    }
    const bidTx = await lotteryContract.populateTransaction.bid()
    const claimTx = await lotteryContract.populateTransaction.claim()
    const nonces = await Promise.all(walletSet.map(wallet => wallet.connect(PROVIDER).getTransactionCount()))
    const feeData = await PROVIDER.getFeeData()
    const baseFee = feeData.gasPrice?.div(GWEI)
    console.log("baseFee", baseFee?.toString())
    const minBidGasPrice = GWEI.mul(Math.max(11, walletSet.length))
    if (bidGasPrice.lt(minBidGasPrice)) {
        console.warn(`bidGasPrice must be at least ${formatUnits(minBidGasPrice, "gwei")} gwei; overriding`)
        bidGasPrice = minBidGasPrice
    }
    
    // sign a lottery bid with every wallet in the set
    const signedTxPromises = walletSet.map(async (wallet, idx) => {
        const bidReq = {
            ...bidTx,
            from: wallet.address,
            value: BID_VALUE.add(GWEI.mul(idx)),
            gasLimit: 100000,
            gasPrice: bidGasPrice.sub(GWEI.mul(idx)), // variate gas price to make txs unique across wallets
            chainId: env.CHAIN_ID,
            nonce: nonces[idx],
        }
        const claimReq: TransactionRequest = {
            ...claimTx,
            from: wallet.address,
            gasLimit: 100000,
            gasPrice: bidGasPrice.sub(GWEI.mul(idx).sub(GWEI.mul(10))), // subtract 10 to encourage builder to place txs in order
            chainId: env.CHAIN_ID,
            nonce: nonces[idx] + 1,
        }
        return {
            bidTx: await wallet.signTransaction(bidReq),
            claimTx: await wallet.signTransaction(claimReq),
        }
    })
    return await Promise.all(signedTxPromises)
}

export const createSmartLotteryTxs = async (walletSet: Wallet[]): Promise<string[]> => {
    if (!lotteryContract) {
        console.log("lottery contract is undefined, attempting to deploy contract")
        lotteryContract = await deployLotteryContract()
        console.log(`lottery contract deployed at ${lotteryContract.address}`)
    }
    const nonces = Promise.all(walletSet.map(wallet => wallet.connect(PROVIDER).getTransactionCount()))
    console.log(`lottery: ${contracts.LotteryMEV.address}`)

    const pot = await PROVIDER.getBalance(lotteryContract.address)
    console.log("pot", pot)
    const gasLimit = 200000
    const gasPrice = GWEI.mul(10)
    const gasCost = gasPrice.mul(gasLimit)
    const profit = pot.sub(gasCost)
    if (pot.lte(gasCost)) {
        console.log("no profit to be had")
        return []
    } else {
        console.log(`✅ Found profit. ${pot.toString()} - ${gasCost.toString()} = ${profit.toString()}\n✅ (${formatEther(profit)} ETH)`)
    }

    return await Promise.all(walletSet.map(async (wallet, idx) => {
        const atomicLotteryDeployTx = new ContractFactory(
            contracts.AtomicLottery.abi, contracts.AtomicLottery.bytecode
        ).getDeployTransaction(
            contracts.LotteryMEV.address, {value: pot.add(13)}
        )
        return await wallet.signTransaction({
            ...atomicLotteryDeployTx,
            chainId: env.CHAIN_ID,
            gasLimit,
            gasPrice: gasPrice.add(GWEI.mul(idx)),
            nonce: (await nonces)[idx],
        })
    }))
}

/** create a transaction that always reverts */
export const createRevertingUniTx = async (deadline?: number): Promise<TransactionRequest | undefined> => {
    // make a swap on uniswap v2 where we don't have the tokens
    const uniContract = getContract(contracts.UniV2Router, env.CHAIN_ID)
    if (!uniContract) {
        console.warn("uniContract is undefined")
        return undefined
    }
    if (!contracts.DAI.address) {
        console.warn(`DAI address is undefined for ${process.env.NODE_ENV}`)
    }
    if (!contracts.WETH.address) {
        console.warn(`WETH address is undefined for ${process.env.NODE_ENV}`)
    }
    const revertingTx = await uniContract.populateTransaction.swapExactTokensForTokens(
        BigNumber.from(420).mul(1e9).mul(1e9),
        BigNumber.from(420).mul(1e9).mul(1e9),
        [contracts.DAI.address, contracts.WETH.address],
        adminWallet.address,
        deadline || now() + 30
    )
    const gasLimit = 200000
    const gasPrice = GWEI.mul(100)
    return {
        ...revertingTx,
        chainId: env.CHAIN_ID,
        gasPrice,
        gasLimit,
        nonce: (await adminWallet.getTransactionCount()),
    }
}

/**
 * Get an unsigned sample lottery tx
 * @param sender Wallet connected to a provider.
 * @returns transaction that interacts with lottery contract
 */
 export const getSampleLotteryTx = async (sender: Wallet): Promise<TransactionRequest | undefined> => {
    const contract = getContract(contracts.LotteryMEV, env.CHAIN_ID)
    if (!contract) {
        console.warn("lottery contract is undefined for this chain.")
        return undefined
    }
    return {
        ...contract.populateTransaction.bid(),
        from: sender.address,
        to: sender.address,
        value: GWEI.mul(1000),
        gasPrice: GWEI.mul(50),
        gasLimit: BigNumber.from(90000),
        chainId: env.CHAIN_ID,
        nonce: await sender.getTransactionCount()
    }
}
