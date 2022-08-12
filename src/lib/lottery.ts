import { BigNumber, ContractFactory, Wallet } from "ethers"

import env from './env'
import { GWEI, ETH, PROVIDER } from './helpers'
import contracts, { getContract } from './contracts'
import { simulateBundle } from './flashbots'
import { getAdminWallet } from './wallets'

const MEDIUM_BID_VALUE = ETH.div(100)
const LARGE_BID_VALUE = ETH.div(10)
const lotteryContract = getContract(contracts.LotteryMEV)
const adminWallet = getAdminWallet().connect(PROVIDER)

/** return a bunch of bundles that compete for the same opportunity */
export const createDumbLotteryBundles = async (walletSet: Wallet[]) => {
    const bidTx = await lotteryContract.populateTransaction.bid()
    const claimTx = await lotteryContract.populateTransaction.claim()
    const nonces = await Promise.all(walletSet.map(wallet => wallet.connect(PROVIDER).getTransactionCount()))
    const feeData = await PROVIDER.getFeeData()
    const baseFee = feeData.gasPrice?.div(GWEI)
    console.log("baseFee", baseFee?.toString())
    
    // sign a lottery bid with every wallet in the set
    const signedTxPromises = walletSet.map(async (wallet, idx) => {
        const bidReq = {
            ...bidTx,
            from: wallet.address,
            value: MEDIUM_BID_VALUE.add(GWEI.mul(idx)),
            gasLimit: 100000,
            gasPrice: GWEI.mul(13),
            chainId: env.CHAIN_ID,
            nonce: nonces[idx],
        }
        const claimReq = {
            ...claimTx,
            from: wallet.address,
            gasLimit: 100000,
            gasPrice: GWEI.mul(1),
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

export const createSmartLotteryTxs = async (walletSet: Wallet[]) => {
    const nonces = Promise.all(walletSet.map(wallet => wallet.connect(PROVIDER).getTransactionCount()))
    console.log(`lottery: ${contracts.LotteryMEV.address}`)

    const pot = await PROVIDER.getBalance(lotteryContract.address)
    console.log("pot", pot)
    const gasLimit = 200000
    const gasPrice = GWEI.mul(10)
    if (pot.lte(gasPrice.mul(gasLimit))) {
        return []
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

export const createNonConflictingBundles = (blockNum: number) => {
    console.log("return a bunch of bundles that do not interfere with each other")
    // return a bunch of bundles that do not interfere with each other
    const weth = getContract(contracts.WETH)
}
