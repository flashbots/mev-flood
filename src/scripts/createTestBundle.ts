import { Wallet, utils } from "ethers"
import contracts from '../lib/contracts'
import env from '../lib/env'
import { GWEI } from '../lib/helpers'
import { PROVIDER } from '../lib/providers'

async function main() {
    const testWallet = new Wallet(env.TEST_PRIVATE_KEY, PROVIDER)
    console.log("wallet", testWallet.address)
    const nonce = await testWallet.getTransactionCount()
    const txs = [0, 1, 2].map(i => ({
        chainId: env.CHAIN_ID,
        type: 2,
        to: contracts.WETH.address,
        from: testWallet.address,
        value: utils.parseEther("0.01"),
        nonce: nonce + i,
        gasLimit: 48000,
        maxFeePerGas: GWEI.mul(25),
        maxPriorityFeePerGas: GWEI.mul(2),
        data: "0xd0e30db0" // deposit
    }))
    const signedTxPromises = txs.map(tx => {
        return testWallet.signTransaction(tx)
    })
    const signedTxs = await Promise.all(signedTxPromises)
    console.log(signedTxs)
}

main().then(() => {
    process.exit(0)
})
