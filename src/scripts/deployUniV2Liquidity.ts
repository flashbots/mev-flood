import { TransactionRequest } from '@ethersproject/abstract-provider';
import { ContractFactory, Contract, utils, providers } from "ethers"

import contracts, { ContractSpec } from "../lib/contracts"
import env from '../lib/env';
import { GWEI, PROVIDER } from '../lib/helpers';
import { getAdminWallet } from '../lib/wallets';

const adminWallet = getAdminWallet()

type ContractDeployment = {
    deployAddress: string,
    deployTx: TransactionRequest,
    signedDeployTx: string,
}

const populateTxFully = (txRequest: TransactionRequest, nonce: number): TransactionRequest => {
    return {
        ...txRequest,
        gasPrice: GWEI.mul(420), // high gas bc idk what you're deploying on
        gasLimit: 500000,
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
        deployAddress: utils.getContractAddress({from: txReq.from || "", nonce}),
        deployTx: txReq,
        signedDeployTx: await adminWallet.signTransaction(txReq),
    }
}

const getPairDeployment = async (factoryAddress: string, token1Address: string, token2Address: string, nonce: number): Promise<ContractDeployment | undefined> => {
    const factoryContract = new Contract(factoryAddress, contracts.UniV2Factory.abi)
    const txReq = populateTxFully(await factoryContract.populateTransaction.createPair(token1Address, token2Address), nonce)
    const signedTx = await adminWallet.signTransaction(txReq)
    return {
        deployAddress: "// TODO: simulate this tx to get the pair address",
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
    // const provider = new providers.JsonRpcProvider("http://localhost:1313", env.CHAIN_ID)
    // try {
    //     await provider.getBlockNumber()
    // } catch (e) {
    //     console.error("no devnet running on port 1313. Please run:")
    //     console.error(`anvil -p 1313 --chain-id ${env.CHAIN_ID}`)
    //     process.exit(1)
    // }
    
    const adminWallet = getAdminWallet().connect(PROVIDER)
    let nonce = await adminWallet.getTransactionCount()
    console.log(`SIGNER ADDRESS: ${adminWallet.address} (nonce=${nonce})`)
    // deploy tokens
    const dai1 = await getCloneDeployment(contracts.DAI, nonce, [env.CHAIN_ID])
    const dai2 = await getCloneDeployment(contracts.DAI, nonce + 1, [env.CHAIN_ID])
    const dai3 = await getCloneDeployment(contracts.DAI, nonce + 2, [env.CHAIN_ID])
    const weth = await getCloneDeployment(contracts.WETH, nonce + 3) // weth has no constructor args
    // deploy uniswapv2 factory
    const uniV2Factory = await getCloneDeployment(contracts.UniV2Factory, nonce + 4, [adminWallet.address])
    // deploy liq pairs
    const dai1_weth = await getPairDeployment(uniV2Factory.deployAddress, dai1.deployAddress, weth.deployAddress, nonce + 5)
    const dai2_weth = await getPairDeployment(uniV2Factory.deployAddress, dai2.deployAddress, weth.deployAddress, nonce + 6)
    const dai3_weth = await getPairDeployment(uniV2Factory.deployAddress, dai3.deployAddress, weth.deployAddress, nonce + 7)
    const dai1_dai2 = await getPairDeployment(uniV2Factory.deployAddress, dai1.deployAddress, dai2.deployAddress, nonce + 8)
    const dai1_dai3 = await getPairDeployment(uniV2Factory.deployAddress, dai1.deployAddress, dai3.deployAddress, nonce + 9)
    
    // bootstrap liquidity
    // ... // TODO

    console.log("contracts:")
    console.log({
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
    })
}

main()
