import { BigNumber, Contract, Wallet } from 'ethers'
import { constants as fsConstants } from 'fs';
import fs from "fs/promises"

import { populateTxFully, PROVIDER, TransactionRequest } from './helpers'
import env from '../lib/env'

export type ContractDeployment = {
    contractAddress: string,
    deployTx: TransactionRequest,
    signedDeployTx: string,
}

export type Deployments = {
    dai: ContractDeployment,           // erc20
    weth: ContractDeployment,           // erc20
    uniV2Factory_A: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    uniV2Factory_B: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    atomicSwap: ContractDeployment,
    dai_weth_A?: ContractDeployment,      // univ2 pair on Uni_A
    dai_weth_B?: ContractDeployment,      // univ2 pair on Uni_B
}

export type DeploymentsFile = {
    deployments: Deployments,
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
