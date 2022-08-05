import { Wallet } from "ethers"

import env from '../env'
import { GWEI, PROVIDER } from '../scripts/helpers'
import contracts, { getContract } from './contracts'

/** return a bunch of bundles that compete for the same opportunity */
export const createConflictingBundles = async (walletSet: Wallet[]) => {
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

export const createNonConflictingBundles = (blockNum: number) => {
    console.log("return a bunch of bundles that do not interfere with each other")
    // return a bunch of bundles that do not interfere with each other
    const weth = getContract(contracts.WETH)
}
