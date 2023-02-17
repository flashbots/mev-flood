import { Contract, providers } from 'ethers';
import { constants as fsConstants } from 'fs';
import fs from "fs/promises"
import contracts from './contracts';

import { TransactionRequest } from './helpers'

export type ContractDeployment = {
    contractAddress: string,
    deployTx: TransactionRequest,
    signedDeployTx: string,
}

export interface ILiquidDeployment {
    dai: ContractDeployment[],            // erc20
    weth: ContractDeployment,             // erc20
    uniV2FactoryA: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    uniV2FactoryB: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    atomicSwap: ContractDeployment,       // custom univ2 interface
    daiWethA?: ContractDeployment[],      // univ2 pair on Uni_A
    daiWethB?: ContractDeployment[],      // univ2 pair on Uni_B
}

export type ILiquidDeploymentOptional = {
    dai?: ContractDeployment[],
    weth?: ContractDeployment,
    uniV2FactoryA?: ContractDeployment,
    uniV2FactoryB?: ContractDeployment,
    atomicSwap?: ContractDeployment,
    daiWethA?: ContractDeployment[],
    daiWethB?: ContractDeployment[],
}

export type LiquidContracts = {
    dai: Contract[]
    weth: Contract
    uniV2FactoryA: Contract
    uniV2FactoryB: Contract
    atomicSwap: Contract
    daiWethA?: Contract[]
    daiWethB?: Contract[]
}

export class LiquidDeployment implements ILiquidDeployment {
    public dai: ContractDeployment[]
    public weth: ContractDeployment
    public uniV2FactoryA: ContractDeployment
    public uniV2FactoryB: ContractDeployment
    public atomicSwap: ContractDeployment
    public daiWethA?: ContractDeployment[]
    public daiWethB?: ContractDeployment[]
    public signedTxs?: string[]

    constructor(deployment: ILiquidDeployment, allSignedTxs?: string[]) {
        this.dai = deployment.dai
        this.weth = deployment.weth
        this.uniV2FactoryA = deployment.uniV2FactoryA
        this.uniV2FactoryB = deployment.uniV2FactoryB
        this.atomicSwap = deployment.atomicSwap
        this.daiWethA = deployment.daiWethA
        this.daiWethB = deployment.daiWethB
        this.signedTxs = allSignedTxs
    }

    public inner() {
        return this as ILiquidDeployment
    }

    /**
     * Overwrite only the defined params.
     * @param deployment Deployment interface; undefined entries make no changes.
     */
    public update(deployment: ILiquidDeploymentOptional) {
        // this.atomicSwap = deployment.atomicSwap || this.atomicSwap
        this.dai = deployment.dai || this.dai
        this.weth = deployment.weth || this.weth
        this.uniV2FactoryA = deployment.uniV2FactoryA || this.uniV2FactoryA
        this.uniV2FactoryB = deployment.uniV2FactoryB || this.uniV2FactoryB
        this.atomicSwap = deployment.atomicSwap || this.atomicSwap
        this.daiWethA = deployment.daiWethA || this.daiWethA
        this.daiWethB = deployment.daiWethB || this.daiWethB
    }

    public getDeployedContracts(provider?: providers.JsonRpcProvider) {
        return {
            dai: this.dai.map(d => new Contract(d.contractAddress, contracts.DAI.abi, provider)),
            weth: new Contract(this.weth.contractAddress, contracts.WETH.abi, provider),
            uniV2FactoryA: new Contract(this.uniV2FactoryA.contractAddress, contracts.UniV2Factory.abi, provider),
            uniV2FactoryB: new Contract(this.uniV2FactoryB.contractAddress, contracts.UniV2Factory.abi, provider),
            atomicSwap: new Contract(this.atomicSwap.contractAddress, contracts.AtomicSwap.abi, provider),
            daiWethA: this.daiWethA?.map(d => new Contract(d.contractAddress, contracts.UniV2Pair.abi, provider)),
            daiWethB: this.daiWethB?.map(d => new Contract(d.contractAddress, contracts.UniV2Pair.abi, provider)),
        } as LiquidContracts
    }

    public getDeploymentTransactions(): string[] {
        let daiWethDeployA = this.daiWethA ? this.daiWethA.map(d => d.signedDeployTx) : []
        let daiWethDeployB = this.daiWethB ? this.daiWethB.map(d => d.signedDeployTx) : []
        let txs = [
        ...this.dai.map(d => d.signedDeployTx),
        this.weth.signedDeployTx,
        this.uniV2FactoryA.signedDeployTx,
        this.uniV2FactoryB.signedDeployTx,
        this.atomicSwap.signedDeployTx,
        ].concat(...daiWethDeployA).concat(...daiWethDeployB)
        return txs
    }
}

export type DeploymentsFile = {
    deployment: LiquidDeployment,
    allSignedTxs: string[],
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
 * Loads a deployment from disk.
 * @param options Specifies how to load the file.
 * @param options.filename Load file directly from a file path.
 * @param options.deploymentNumber If process.env.CHAIN_NAME exists, load from *'src/output/{env.CHAIN_NAME}/'*. Otherwise load from *'./deployments/'*.
 * }
 * @returns deployment specified in options, or newest existing deployment if no option was specified.
 */
export const loadDeployment = async (options: {deploymentNumber?: number, filename?: string}): Promise<LiquidDeployment> => {
    const filename = options.filename || await getExistingDeploymentFilename(options.deploymentNumber || undefined)
    const json = JSON.parse(await fs.readFile(filename, {encoding: "utf-8"})) as DeploymentsFile
    const deployment = json.deployment
    const txs = json.allSignedTxs
    return new LiquidDeployment(deployment, txs)
}
