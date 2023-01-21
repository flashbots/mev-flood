import { BigNumber, Contract, Wallet } from 'ethers'
import { constants as fsConstants } from 'fs';
import fs from "fs/promises"

import { populateTxFully, PROVIDER, TransactionRequest } from './helpers'
import env from '../lib/env'

export interface ContractDeployment {
    contractAddress: string,
    deployTx: TransactionRequest,
    signedDeployTx: string,
}

export interface LiquidDeployment {
    dai: ContractDeployment[],           // erc20
    weth: ContractDeployment,           // erc20
    uniV2Factory_A: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    uniV2Factory_B: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    atomicSwap: ContractDeployment,
    dai_weth_A?: ContractDeployment[],      // univ2 pairs on Uni_A
    dai_weth_B?: ContractDeployment[],      // univ2 pairs on Uni_B
}

export const getLiquidDeploymentTransactions = (deployment: LiquidDeployment): string[] => {
    let dai_weth_A_deploy = deployment.dai_weth_A ? deployment.dai_weth_A.map(d => d.signedDeployTx) : []
    let dai_weth_B_deploy = deployment.dai_weth_B ? deployment.dai_weth_B.map(d => d.signedDeployTx) : []
    let txs = [
    ...deployment.dai.map(d => d.signedDeployTx),
    deployment.weth.signedDeployTx,
    deployment.uniV2Factory_A.signedDeployTx,
    deployment.uniV2Factory_B.signedDeployTx,
    deployment.atomicSwap.signedDeployTx,
    ].concat(...dai_weth_A_deploy).concat(...dai_weth_B_deploy)
    return txs
}

export type DeploymentsFile = {
    deployments: LiquidDeployment,
    allSignedTxs: string[],
}

export const signSwap = async (atomicSwapContract: Contract, uniFactoryAddress: string, sender: Wallet, amountIn: BigNumber, path: string[], nonce?: number): Promise<string> => {
    // use custom router to swap
    return await sender.signTransaction(
        populateTxFully(
            await atomicSwapContract.populateTransaction.swap(
                path,
                amountIn,
                uniFactoryAddress,
                sender.address,
                false
            ),
            nonce || await PROVIDER.getTransactionCount(sender.address),
            {from: sender.address, gasLimit: 150000},
        )
    )
}

// /**
//  * Signs a circular arbitrage: given tokens (A, B), each with a pair on exchanges (U, V) swap A -> B on U, B -> A on V
//  * @param atomicSwapContract 
//  * @param tokenAddress 
//  * @returns 
//  */
// export const signArb = async (atomicSwapContract: Contract, tokenA: string, tokenB: string, factoryA: string, factoryB: string) => {
//     await atomicSwapContract.populateTransaction.backrun()
// }

export const dir = async () => {
    const dirname = `src/output/${env.CHAIN_NAME}`
    try {
        await fs.access(dirname, fsConstants.R_OK | fsConstants.W_OK)
    } catch (e) {
        await fs.mkdir(dirname)
    }
    return dirname
}

export const getExistingDeploymentFilename = async (deploymentNumber?: number) => {
    const dirname = await dir()
    const fileNumber = deploymentNumber || (await fs.readdir(dirname)).filter(e => e.includes("uniDeployment")).length - 1
    return `${dirname}/uniDeployment${fileNumber}.json`
}

export const getNewDeploymentFilename = async (): Promise<string> => {
    const dirname = await dir()
    const fileNumber = (await fs.readdir(dirname)).filter(e => e.includes("uniDeployment")).length
    return `${dirname}/uniDeployment${fileNumber}.json`
}

export const getNewLiquidityFilename = async (): Promise<string> => {
    const dirname = await dir()
    const fileNumber = (await fs.readdir(dirname)).filter(e => e.includes("uniLiquidity")).length
    return `${dirname}/uniLiquidity${fileNumber}.json`
}

/**
 * Loads a deployment from `src/output/{env}/`.
 * @param deploymentNumber optional deployment number corresponding to a "uniDeployment{n}" file in src/output/{env}
 * @returns deployment specified by `deploymentNumber`, or newest deployment if no `deploymentNumber` is specified.
 */
export const getDeployment = async (deploymentNumber?: number): Promise<DeploymentsFile> => {
    const filename = await getExistingDeploymentFilename(deploymentNumber)
    return JSON.parse(await fs.readFile(filename, {encoding: "utf-8"}))
}
