import { BigNumber, Contract, utils } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { getSwapdArgs } from './lib/cliArgs'
import contracts from './lib/contracts'
import env from './lib/env'
import { ETH, MAX_U256, populateTxFully, coinToss, randInRange } from './lib/helpers'
import { PROVIDER } from './lib/providers'

import { getDeployment, getExistingDeploymentFilename } from "./lib/liquid"
import { getAdminWallet, getWalletSet } from './lib/wallets'
import { approveIfNeeded, createRandomSwap, mintIfNeeded, signSwap } from './lib/swap'
import { sendSwaps } from './lib/scripts/swap'

async function main() {
    // get cli args
    const {startIdx, endIdx, actionsPerBlock, numPairs, program, modes} = getSwapdArgs()
    const isArbd = program === modes.arbd
    // TODO: impl numPairs!
    // TODO: impl actionsPerBlock

    const walletSet = getWalletSet(startIdx, endIdx)

    // get deployment params (// TODO: specify deployment via cli params)
    const filename = await getExistingDeploymentFilename()
    console.log("filename", filename)
    const deployment = (await getDeployment({})).deployment
    
    const atomicSwapContract = new Contract(deployment.atomicSwap.contractAddress, contracts.AtomicSwap.abi, PROVIDER)
    const uniFactoryA = new Contract(deployment.uniV2FactoryA.contractAddress, contracts.UniV2Factory.abi, PROVIDER)
    const uniFactoryB = new Contract(deployment.uniV2FactoryB.contractAddress, contracts.UniV2Factory.abi, PROVIDER)
    const wethContract = new Contract(deployment.weth.contractAddress, contracts.WETH.abi, PROVIDER)
    const daiContracts = deployment.dai.map(d => new Contract(d.contractAddress, contracts.DAI.abi, PROVIDER))

    // check token balances for each wallet, mint more if needed
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let adminNonce = await adminWallet.getTransactionCount()

    console.log("using wallets", walletSet.map(w => w.address))

    // check wallet balance for each token, mint if needed
    await mintIfNeeded(PROVIDER, adminWallet, adminNonce, walletSet, wethContract, daiContracts)

    // check atomicSwap allowance for each wallet, approve max_uint if needed
    await approveIfNeeded(PROVIDER, walletSet, {
        atomicSwapContract,
        wethContract,
        daiContracts,
    })

    PROVIDER.on('block', async blockNum => {
        console.log(`[BLOCK ${blockNum}]`)
        // send random swaps
        sendSwaps({}, PROVIDER, walletSet, deployment)
    })
}

main()
