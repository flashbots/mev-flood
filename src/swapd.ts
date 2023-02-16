import { BigNumber, Contract, utils } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { getSwapdArgs } from './lib/cliArgs'
import contracts from './lib/contracts'
import env from './lib/env'
import { ETH, MAX_U256, populateTxFully, coinToss, randInRange } from './lib/helpers'
import { PROVIDER } from './lib/providers'

import { getDeployment, getExistingDeploymentFilename } from "./lib/liquid"
import { getAdminWallet, getWalletSet } from './lib/wallets'
import { approveIfNeeded, createRandomSwap, signSwap } from './lib/swap'

async function main() {
    // get cli args
    const {startIdx, endIdx} = getSwapdArgs()
    const walletSet = getWalletSet(startIdx, endIdx)

    // get deployment params (// TODO: specify deployment via cli params)
    const filename = await getExistingDeploymentFilename()
    console.log("filename", filename)
    const {deployments} = await getDeployment({})
    
    const atomicSwapContract = new Contract(deployments.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
    const uniFactoryA = new Contract(deployments.uniV2Factory_A.contractAddress, contracts.UniV2Factory.abi)
    const uniFactoryB = new Contract(deployments.uniV2Factory_B.contractAddress, contracts.UniV2Factory.abi)
    const wethContract = new Contract(deployments.weth.contractAddress, contracts.WETH.abi, PROVIDER)
    const daiContract = new Contract(deployments.dai.contractAddress, contracts.DAI.abi, PROVIDER)

    // check token balances for each wallet, mint more if needed
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let signedMints: string[] = []
    let adminNonce = await adminWallet.getTransactionCount()
    for (const wallet of walletSet) {
        let wethBalance: BigNumber = await wethContract.callStatic.balanceOf(wallet.address)
        if (wethBalance.lte(ETH.mul(20))) {
            let nonce = await wallet.connect(PROVIDER).getTransactionCount()
            // mint 20 ETH
            const tx = populateTxFully(await wethContract.populateTransaction.deposit({value: ETH.mul(20)}), nonce, {
                gasLimit: 50000,
                from: wallet.address,
                chainId: env.CHAIN_ID,
            })
            const signedMint = await wallet.signTransaction(tx)
            signedMints.push(signedMint)
        }
        let daiBalance: BigNumber = await daiContract.callStatic.balanceOf(wallet.address)
        if (daiBalance.lte(50000)) {
            // mint 50k DAI to wallet from admin account (DAI deployer)
            const mintTx = await adminWallet.signTransaction(populateTxFully(await daiContract.populateTransaction.mint(wallet.address, ETH.mul(50000)), adminNonce, {
                gasLimit: 60000,
                from: adminWallet.address,
                chainId: env.CHAIN_ID,
            }))
            adminNonce += 1
            signedMints.push(mintTx)
        }
    }
    const mintPromises = signedMints.map(tx => PROVIDER.sendTransaction(tx))
    if (mintPromises.length > 0) {
        const mintResults = await Promise.all(mintPromises)
        console.log(`minted for ${mintResults.length} accounts`)
        await mintResults[mintResults.length - 1].wait(1) // wait for last tx to be included before proceeding
    } else {
        console.log("no mints required")
    }

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    approveIfNeeded(PROVIDER, walletSet, {
        atomicSwapContract,
        wethContract,
        daiContracts: [daiContract]
    })

    PROVIDER.on('block', async blockNum => {
        console.log(`[BLOCK ${blockNum}]`)
        // generate swaps
        let swaps: string[] = []
        for (const wallet of walletSet) {
            const nonce = wallet.connect(PROVIDER).getTransactionCount()
            const {amountIn, tokenInName, tokenOutName, uniFactory, path} = createRandomSwap(uniFactoryA.address, uniFactoryB.address, [daiContract.address], wethContract.address)
            console.log(`${wallet.address} trades ${formatEther(amountIn).padEnd(6, "0")} ${tokenInName.padEnd(4, " ")} for ${tokenOutName}`)
            swaps.push(await signSwap(atomicSwapContract, uniFactory, wallet, amountIn, path, await nonce, env.CHAIN_ID))
        }
        
        const swapPromises = swaps.map(tx => PROVIDER.sendTransaction(tx))
        const swapResults = await Promise.all(swapPromises)
        console.log(`swapped with ${swapResults.length} wallets`)
    })
}

main()
