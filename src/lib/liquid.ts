import { constants as fsConstants } from 'fs';
import fs from "fs/promises"

import { TransactionRequest } from './helpers'

export type ContractDeployment = {
    contractAddress: string,
    deployTx: TransactionRequest,
    signedDeployTx: string,
}

export type Deployment = {
    dai: ContractDeployment,           // erc20
    weth: ContractDeployment,           // erc20
    uniV2Factory_A: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    uniV2Factory_B: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    atomicSwap: ContractDeployment,
    dai_weth_A?: ContractDeployment,      // univ2 pair on Uni_A
    dai_weth_B?: ContractDeployment,      // univ2 pair on Uni_B
}

export type DeploymentsFile = {
    deployments: Deployment,
    allSignedTxs: string[],
}

export const dir = async () => {
    const dirname = process.env.CHAIN_NAME ? `src/output/${process.env.CHAIN_NAME}` : 'deployments'
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
export const getDeployment = async (options: {deploymentNumber?: number, filename?: string}): Promise<DeploymentsFile> => {
    const filename = options.filename || await getExistingDeploymentFilename(options.deploymentNumber || undefined)
    return JSON.parse(await fs.readFile(filename, {encoding: "utf-8"}))
}
