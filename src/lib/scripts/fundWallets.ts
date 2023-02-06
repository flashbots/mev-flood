import { Wallet, utils, providers } from "ethers"

import { GWEI } from '../helpers'

/**
 * Sends `amount` ether from `adminWallet` to each of `recipients`.
 * 
 * *Example:*
 * ```
 * // instantiate adminWallet as hardhat/anvil[0] account
 * const adminWallet = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
 * // create 10 wallets
 * const wallets = [...Array(10)].map(i => ethers.Wallet.createRandom().address)
 * // send 10 ETH to each wallet on goerli
 * fundWallets(wallets, adminWallet, 10, 5)
 * ```
 * @param recipients array of Ethereum addresses
 * @param adminWallet wallet from which to send ETH
 * @param amount amount of ETH to send (1 := 1 ETH or 1e18 wei)
 * @param chainId chainId of target blockchain
*/
const fundWallets = async (provider: providers.JsonRpcProvider, recipients: string[], adminWallet: Wallet, ethAmount: number) => {
    const nonce = await adminWallet.connect(provider).getTransactionCount()
    const amount = utils.parseEther(ethAmount.toString())
    const chainId = provider.network.chainId
    const txs = recipients.map((recipient, i) => {
        const tx = {
            chainId: chainId,
            value: amount,
            from: adminWallet.address,
            to: recipient,
            nonce: nonce + i,
            gasPrice: GWEI.mul(15),
            gasLimit: 21000,
        }
        return tx
    })
    console.log(txs)
    const signedTxPromises = txs.map(tx => {
        return adminWallet.signTransaction(tx)
    })
    const signedTxs = await Promise.all(signedTxPromises)
    console.log(signedTxs)
    const sentTxPromises = signedTxs.map(tx => (
        provider.sendTransaction(tx)
    ))

    return await Promise.all(sentTxPromises)
}

export default fundWallets
