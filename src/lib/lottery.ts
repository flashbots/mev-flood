import { ContractFactory, Wallet } from "ethers"

import env from './env'
import { GWEI, PROVIDER } from './helpers'
import contracts, { getContract } from './contracts'

/** return a bunch of bundles that compete for the same opportunity */
export const createDumbLotteryBundles = async (walletSet: Wallet[]) => {
    const lotteryContract = getContract(contracts.LotteryMEV)
    const bidTx = await lotteryContract.populateTransaction.bid()
    const claimTx = await lotteryContract.populateTransaction.claim()
    const nonces = await Promise.all(walletSet.map(wallet => wallet.connect(PROVIDER).getTransactionCount()))
    
    // sign a lottery bid with every wallet in the set
    const signedTxPromises = walletSet.map(async (wallet, idx) => {
        const bidReq = {
            ...bidTx,
            from: wallet.address,
            value: GWEI.mul(2),
            gasLimit: 300000,
            gasPrice: GWEI.mul(13),
            chainId: env.CHAIN_ID,
            nonce: nonces[idx],
        }
        const claimReq = {
            ...claimTx,
            from: wallet.address,
            gasLimit: 300000,
            gasPrice: GWEI.mul(13),
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
    const bid = GWEI.mul(3000)
    // const bid = GWEI.div(10)
    const nonces = await Promise.all(walletSet.map(wallet => wallet.connect(PROVIDER).getTransactionCount()))
    return await Promise.all(walletSet.map(async (wallet, idx) => {
        const atomicLotteryDeployTx = new ContractFactory(
            contracts.AtomicLottery.abi, contracts.AtomicLottery.bytecode
        ).getDeployTransaction(
            contracts.LotteryMEV.address, {value: bid.add(GWEI.mul(idx))}
        )
        return await wallet.signTransaction({
            ...atomicLotteryDeployTx,
            chainId: env.CHAIN_ID,
            gasLimit: 300000,
            gasPrice: GWEI.mul(12), // lower gas than dumb search txs to eat up more bids
            nonce: nonces[idx],
        })
    }))
}

export const createNonConflictingBundles = (blockNum: number) => {
    console.log("return a bunch of bundles that do not interfere with each other")
    // return a bunch of bundles that do not interfere with each other
    const weth = getContract(contracts.WETH)
}
