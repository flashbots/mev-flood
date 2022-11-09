import { TransactionRequest } from '@ethersproject/abstract-provider';
import { ContractFactory, Contract, utils, providers } from "ethers"

import contracts, { ContractSpec } from "../lib/contracts"
import env from '../lib/env';
import { GWEI, PROVIDER } from '../lib/helpers';
import { getAdminWallet } from '../lib/wallets';

const adminWallet = getAdminWallet()

type ContractDeployment = {
    contractAddress: string,
    deployTx: TransactionRequest,
    signedDeployTx: string,
}

const populateTxFully = (txRequest: TransactionRequest, nonce: number): TransactionRequest => {
    return {
        ...txRequest,
        gasPrice: GWEI.mul(420), // high gas bc idk what you're deploying on
        gasLimit: 3000000,
        from: adminWallet.address,
        nonce,
    }
}

/**
 * Get signed tx to deploy a generic contract clone, as well as the address it will be deployed at.
 */
const getCloneDeployment = async (contract: ContractSpec, nonce: number, args?: any[]): Promise<ContractDeployment> => {
    if (!contract.abi || !contract.bytecode) {
        console.error(`failed to build contract\nabi: ${contract.abi}\nbytecode: ${contract.bytecode}`)
        process.exit(1)
    }
    const factory = new ContractFactory(contract.abi, contract.bytecode)
    const txReq = populateTxFully(args ? factory.getDeployTransaction(...args) : factory.getDeployTransaction(), nonce)
    return {
        contractAddress: utils.getContractAddress({from: txReq.from || "", nonce}),
        deployTx: txReq,
        signedDeployTx: await adminWallet.signTransaction(txReq),
    }
}

const getPairDeployment = async (factoryAddress: string, token1Address: string, token2Address: string, nonce: number, testProvider: providers.JsonRpcProvider): Promise<ContractDeployment> => {
    const factoryContract = await new Contract(factoryAddress, contracts.UniV2Factory.abi)
    const txReq = populateTxFully(await factoryContract.populateTransaction.createPair(token1Address, token2Address), nonce)
    const signedTx = await adminWallet.signTransaction(txReq)
    const contractAddress = await factoryContract.connect(testProvider).callStatic.createPair(token1Address, token2Address)

    return {
        contractAddress,
        deployTx: txReq,
        signedDeployTx: signedTx,
    }
}


/** Prints txs:
 * build a set of contracts to deploy,
 * create univ2 pools,
 * bootstrap w/ liquidity
 * 
 * all txs are signed with the account specified by ADMIN_PRIVATE_KEY in .env
*/
const main = async () => {
    const testProvider = new providers.JsonRpcProvider("http://localhost:1313", 31337)
    try {
        await testProvider.getBlockNumber()
    } catch (e) {
        console.error("no devnet running on port 1313. Please run:")
        console.error(`anvil -p 1313 --chain-id ${env.CHAIN_ID}`)
        process.exit(1)
    }
    
    const adminWallet = getAdminWallet().connect(testProvider)
    let nonce = await adminWallet.getTransactionCount()
    console.log(`SIGNER ADDRESS: ${adminWallet.address} (nonce=${nonce})`)

    // get token deployments
    const dai1 = await getCloneDeployment(contracts.DAI, nonce, [env.CHAIN_ID])
    const dai2 = await getCloneDeployment(contracts.DAI, nonce + 1, [env.CHAIN_ID])
    const dai3 = await getCloneDeployment(contracts.DAI, nonce + 2, [env.CHAIN_ID])
    const weth = await getCloneDeployment(contracts.WETH, nonce + 3) // weth has no constructor args
    // get uniswapv2 factory deployment
    const uniV2Factory = await getCloneDeployment(contracts.UniV2Factory, nonce + 4, [adminWallet.address])

    const indyDeployments = [
        dai1, dai2, dai3, weth, uniV2Factory
    ]

    // deploy on local devnet
    indyDeployments.forEach(async cd => {
        (await testProvider.sendTransaction(cd.signedDeployTx)).wait(1)
    })

    // deploy liq pairs
    const dai1_weth = await getPairDeployment(uniV2Factory.contractAddress, dai1.contractAddress, weth.contractAddress, nonce + 5, testProvider)
    const dai2_weth = await getPairDeployment(uniV2Factory.contractAddress, dai2.contractAddress, weth.contractAddress, nonce + 6, testProvider)
    const dai3_weth = await getPairDeployment(uniV2Factory.contractAddress, dai3.contractAddress, weth.contractAddress, nonce + 7, testProvider)
    const dai1_dai2 = await getPairDeployment(uniV2Factory.contractAddress, dai1.contractAddress, dai2.contractAddress, nonce + 8, testProvider)
    const dai1_dai3 = await getPairDeployment(uniV2Factory.contractAddress, dai1.contractAddress, dai3.contractAddress, nonce + 9, testProvider)

    const pairDeployments = [
        dai1_weth,
        dai2_weth,
        dai3_weth,
        dai1_dai2,
        dai1_dai3,
    ]
    pairDeployments.forEach(async cd => {
        await (await testProvider.sendTransaction(cd.signedDeployTx)).wait(1)
    })
    
    
    // bootstrap liquidity
    // ... // TODO

    // console.log("contracts:")
    const output = {
        dai1,
        dai2,
        dai3,
        weth,
        uniV2Factory,
        dai1_weth,
        dai2_weth,
        dai3_weth,
        dai1_dai2,
        dai1_dai3,
    }
    console.log(output)
}

main()
