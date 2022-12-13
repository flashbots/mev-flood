import { Contract } from 'ethers'
import { getSwapdArgs } from './lib/cliArgs'
import contracts from './lib/contracts'
import { PROVIDER } from './lib/helpers'

import { getDeployment, getExistingDeploymentFilename, signSwap } from "./lib/liquid"
import { getWalletSet } from './lib/wallets'

async function main() {
    // get cli args
    const {startIdx, endIdx} = getSwapdArgs()
    const walletSet = getWalletSet(startIdx, endIdx)

    // get deployment params (// TODO: specify deployment via cli params)
    const filename = await getExistingDeploymentFilename()
    console.log("filename", filename)
    const {deployments} = await getDeployment()
    
    const atomicSwapContract = new Contract(deployments.atomicSwap.contractAddress, contracts.AtomicSwap.abi)
    const uniFactoryA = new Contract(deployments.uniV2Factory_A.contractAddress, contracts.UniV2Factory.abi)
    const uniFactoryB = new Contract(deployments.uniV2Factory_B.contractAddress, contracts.UniV2Factory.abi)
    const wethContract = new Contract(deployments.weth.contractAddress, contracts.WETH.abi)

    // lazy mode: approve max_uint for all wallets

    console.log("OK!")
}

main()
