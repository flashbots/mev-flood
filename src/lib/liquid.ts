import { constants as fsConstants } from 'fs';
import fs from "fs/promises"

import { TransactionRequest } from './helpers'

export type ContractDeployment = {
    contractAddress: string,
    deployTx: TransactionRequest,
    signedDeployTx: string,
}

export type LiquidDeployment = {
    dai: ContractDeployment[],            // erc20
    weth: ContractDeployment,             // erc20
    uniV2FactoryA: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    uniV2FactoryB: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    atomicSwap: ContractDeployment,       // custom univ2 interface
    daiWethA?: ContractDeployment[],      // univ2 pair on Uni_A
    daiWethB?: ContractDeployment[],      // univ2 pair on Uni_B
}

export type DeploymentsFile = {
    deployment: LiquidDeployment,
    allSignedTxs: string[],
}

export const getLiquidDeploymentTransactions = (deployment: LiquidDeployment): string[] => {
    let daiWethDeployA = deployment.daiWethA ? deployment.daiWethA.map(d => d.signedDeployTx) : []
    let daiWethDeployB = deployment.daiWethB ? deployment.daiWethB.map(d => d.signedDeployTx) : []
    let txs = [
    ...deployment.dai.map(d => d.signedDeployTx),
    deployment.weth.signedDeployTx,
    deployment.uniV2FactoryA.signedDeployTx,
    deployment.uniV2FactoryB.signedDeployTx,
    deployment.atomicSwap.signedDeployTx,
    ].concat(...daiWethDeployA).concat(...daiWethDeployB)
    return txs
}

const dir = async () => {
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
 * Loads a deployment file.
 * @param options Specifies how to load the file.
 * @param options.filename Load file directly from a file path.
 * @param options.deploymentNumber If process.env.CHAIN_NAME exists, load from *'src/output/{env.CHAIN_NAME}/'*. Otherwise load from *'./deployments/'*.
 * }
 * @returns deployment specified in options, or newest existing deployment if no option was specified.
 */
export const getDeployment = async (options: {deploymentNumber?: number, filename?: string}): Promise<DeploymentsFile> => {
    const filename = options.filename || await getExistingDeploymentFilename(options.deploymentNumber || undefined)
    return JSON.parse(await fs.readFile(filename, {encoding: "utf-8"}))
}
