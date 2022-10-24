import { BigNumber, ContractFactory, Wallet } from "ethers"

import env from './env'
import { GWEI, ETH, PROVIDER, now } from './helpers'
import contracts, { getContract } from './contracts'
import { simulateBundle } from './flashbots'
import { getAdminWallet } from './wallets'
import { formatEther } from 'ethers/lib/utils'


const MEDIUM_BID_VALUE = ETH.div(100)
const LARGE_BID_VALUE = ETH.div(10)
// TODO: clean up; don't instantiate contract here; getContract should never return undefined
const lotteryContract = getContract(contracts.LotteryMEV)
const adminWallet = getAdminWallet().connect(PROVIDER)

/** return a bunch of bundles that compete for the same opportunity */
export const createDumbLotteryBundles = async (walletSet: Wallet[]) => {
    if (!lotteryContract) {
        console.warn("lottery contract is undefined")
        return []
    }
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
    if (!lotteryContract) {
        console.warn("lottery contract is undefined")
        return []
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
export const createRevertingUniTx = async (deadline?: number) => {
    // make a swap on uniswap v2 where we don't have the tokens
    const uniContract = getContract(contracts.UniV2Router)
    if (!uniContract) {
        console.warn("uniContract is undefined")
        return undefined
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
