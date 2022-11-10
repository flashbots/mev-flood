import { TransactionRequest } from '@ethersproject/abstract-provider';
import { ContractFactory, Contract, utils, providers } from "ethers"
import fs from "fs/promises"
import readline from "readline-sync"
import { getDeployUniswapV2Args } from '../lib/cliArgs';

import contracts, { ContractSpec } from "../lib/contracts"
import env from '../lib/env';
import { ETH, GWEI, now, PROVIDER, textColors } from '../lib/helpers';
import { getAdminWallet } from '../lib/wallets';

/** Used for signing only, NOT connected to a provider. */
const adminWallet = getAdminWallet()

type ContractDeployment = {
    contractAddress: string,
    deployTx: TransactionRequest,
    signedDeployTx: string,
}

type Deployments = {
    dai1: ContractDeployment,           // erc20
    dai2: ContractDeployment,           // erc20
    dai3: ContractDeployment,           // erc20
    weth: ContractDeployment,           // erc20
    uniV2Factory: ContractDeployment,   // univ2 factory (creates univ2 pairs)
    uniV2Router: ContractDeployment,    // univ2 router (handles trades; interacts w/ pairs & does safety checks)
    // dai1_weth: ContractDeployment,      // univ2 pair
    // dai2_weth: ContractDeployment,      // univ2 pair
    // dai3_weth: ContractDeployment,      // univ2 pair
    // dai1_dai2: ContractDeployment,      // univ2 pair
    // dai1_dai3: ContractDeployment,      // univ2 pair
}

type DeploymentsFile = {
    deployments: Deployments,
    allSignedTxs: string[],
}

const populateTxFully = (txRequest: TransactionRequest, nonce: number): TransactionRequest => {
    return {
        ...txRequest,
        maxFeePerGas: GWEI.mul(42),
        maxPriorityFeePerGas: GWEI.mul(3),
        gasLimit: 7000000,
        from: adminWallet.address,
        nonce,
        type: 2,
        chainId: env.CHAIN_ID,
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
    const factory = new ContractFactory(JSON.stringify(contract.abi), contract.bytecode)
    const txReq = populateTxFully(args ? factory.getDeployTransaction(...args) : factory.getDeployTransaction(), nonce)
    return {
        contractAddress: utils.getContractAddress({from: txReq.from || "", nonce}),
        deployTx: txReq,
        signedDeployTx: await adminWallet.signTransaction(txReq),
    }
}

const getPairDeployment = async (factoryAddress: string, token1Address: string, token2Address: string, nonce: number): Promise<ContractDeployment> => {
    const factoryContract = await new Contract(factoryAddress, contracts.UniV2Factory.abi)
    const txReq = populateTxFully(await factoryContract.populateTransaction.createPair(token1Address, token2Address), nonce)
    const signedTx = await adminWallet.signTransaction(txReq)
    const contractAddress = await factoryContract.connect(PROVIDER).callStatic.createPair(token1Address, token2Address)

    return {
        contractAddress,
        deployTx: txReq,
        signedDeployTx: signedTx,
    }
}

const dir = "src/output"
const getNewDeploymentFilename = async () => {
    const fileNumber = (await fs.readdir(dir)).filter(e => e.includes("uniDeployment")).length
    return `${dir}/uniDeployment${fileNumber}.json`
}
const getNewLiquidityFilename = async () => {
    const fileNumber = (await fs.readdir(dir)).filter(e => e.includes("uniLiquidity")).length
    return `${dir}/uniLiquidity${fileNumber}.json`
}
const getExistingDeploymentFilename = async () => {
    const fileNumber = (await fs.readdir(dir)).filter(e => e.includes("uniDeployment")).length - 1
    return `${dir}/uniDeployment${fileNumber}.json`
}

/** Prints txs:
 * build a set of contracts to deploy,
 * create univ2 pools,
 * bootstrap w/ liquidity
 * 
 * all txs are signed with the account specified by ADMIN_PRIVATE_KEY in .env
*/
const main = async () => {
    const {shouldDeploy, shouldBootstrapLiquidity} = getDeployUniswapV2Args()

    try {
        await PROVIDER.getBlockNumber()
    } catch (e) {
        console.error(`failed to connect to ${env.RPC_URL}.`)
        process.exit(1)
    }
    
    const adminWallet = getAdminWallet().connect(PROVIDER)
    console.log("adminWallet", adminWallet.address)
    const startBalance = await adminWallet.connect(PROVIDER).getBalance()
    console.log(`balance: ${utils.formatEther(startBalance)} ETH`)
    let nonce = await adminWallet.getTransactionCount()
    const getNonce = () => {
        const tempNonce = nonce
        nonce += 1
        return tempNonce
    }
    if (nonce != 0) {
        console.warn(`Your account nonce is currently ${nonce}.`)
        readline.question("press Enter to continue...")
    }

    let addr_dai1: string
    let addr_dai2: string
    let addr_dai3: string
    let addr_weth: string
    let addr_uniV2Factory: string
    let addr_uniV2Router: string
    // arrays to be returned at end
    let deployments: Deployments | undefined = undefined // the contracts we will interact with
    let daiMints = []
    let approvals = []
    let wethDaiDeposits: any = []
    let daiDaiDeposits: any = []
    let signedMintWethTx: string | undefined = undefined

    // deploy on local devnet
    if (shouldDeploy) {
        // ### get contract deployments
        let dai1 = await getCloneDeployment(contracts.DAI, getNonce(), [env.CHAIN_ID])
        let dai2 = await getCloneDeployment(contracts.DAI, getNonce(), [env.CHAIN_ID])
        let dai3 = await getCloneDeployment(contracts.DAI, getNonce(), [env.CHAIN_ID])
        let weth = await getCloneDeployment(contracts.WETH, getNonce()) // weth has no constructor args
        // get uniswapv2 factory deployment
        let uniV2Factory = await getCloneDeployment(contracts.UniV2Factory, getNonce(), [adminWallet.address])
        let uniV2Router = await getCloneDeployment(contracts.UniV2Router, getNonce(), [uniV2Factory.contractAddress, weth.contractAddress])
        console.log("deploying base contracts: 3 DAI tokens, WETH, uniswapV2factory, uniswapv2Router...")
        deployments = {
            dai1,           // erc20
            dai2,           // erc20
            dai3,           // erc20
            weth,           // erc20
            uniV2Factory,   // univ2 factory (creates univ2 pairs)
            uniV2Router,    // univ2 router (handles trades; interacts w/ pairs & does safety checks)
            // dai1_weth,      // univ2 pair
            // dai2_weth,      // univ2 pair
            // dai3_weth,      // univ2 pair
            // dai1_dai2,      // univ2 pair
            // dai1_dai3,      // univ2 pair
        }
        addr_dai1 = dai1.contractAddress
        addr_dai2 = dai2.contractAddress
        addr_dai3 = dai3.contractAddress
        addr_weth = weth.contractAddress
        addr_uniV2Factory = uniV2Factory.contractAddress
        addr_uniV2Router = uniV2Router.contractAddress
        for (const deployment of Object.values(deployments)) {
            await (await PROVIDER.sendTransaction(deployment.signedDeployTx)).wait(1)
            console.log("OK.")
        }
    } else {
        // read contracts from output/
        const uniDeployments: DeploymentsFile = JSON.parse(await fs.readFile(await getExistingDeploymentFilename(), {encoding: "utf-8"}))
        addr_dai1 = uniDeployments.deployments.dai1.contractAddress
        addr_dai2 = uniDeployments.deployments.dai2.contractAddress
        addr_dai3 = uniDeployments.deployments.dai3.contractAddress
        addr_weth = uniDeployments.deployments.weth.contractAddress
        addr_uniV2Factory = uniDeployments.deployments.uniV2Factory.contractAddress
        addr_uniV2Router = uniDeployments.deployments.uniV2Router.contractAddress
    }

    const wethContract = new Contract(addr_weth, contracts.WETH.abi)
    const dai1Contract = new Contract(addr_dai1, contracts.DAI.abi)
    const dai2Contract = new Contract(addr_dai2, contracts.DAI.abi)
    const dai3Contract = new Contract(addr_dai3, contracts.DAI.abi)
    const uniV2RouterContract = new Contract(addr_uniV2Router, contracts.UniV2Router.abi)
    
    // // ### deploy liq pairs
    // const dai1_weth = await getPairDeployment(uniV2Factory.contractAddress, dai1.contractAddress, weth.contractAddress, getNonce())
    // const dai2_weth = await getPairDeployment(uniV2Factory.contractAddress, dai2.contractAddress, weth.contractAddress, getNonce())
    // const dai3_weth = await getPairDeployment(uniV2Factory.contractAddress, dai3.contractAddress, weth.contractAddress, getNonce())
    // const dai1_dai2 = await getPairDeployment(uniV2Factory.contractAddress, dai1.contractAddress, dai2.contractAddress, getNonce())
    // const dai1_dai3 = await getPairDeployment(uniV2Factory.contractAddress, dai1.contractAddress, dai3.contractAddress, getNonce())

    // const pairDeployments = [
    //     dai1_weth,
    //     dai2_weth,
    //     dai3_weth,
    //     dai1_dai2,
    //     dai1_dai3,
    // ]
    // console.log("deploying 5 pairs...")
    // for (const cd of pairDeployments) {
    //     await (await PROVIDER.sendTransaction(cd.signedDeployTx)).wait(1)
    //     console.log("OK.")
    // }
    
    if (shouldBootstrapLiquidity) {
        // ### bootstrap liquidity
        /* Exchange rates: 1500 DAI/WETH; 1 DAI/DAI */
        // mint 25K DAI for each (15K per DAI/WETH pair, 5k per DAI/DAI pair)
        const daiTokenAddrs = [
            addr_dai1, addr_dai2, addr_dai3
        ]
        let idx = 0
        
        for (const addr of daiTokenAddrs) {
            const contract = new Contract(addr, contracts.DAI.abi, adminWallet)
            const txReq = populateTxFully(
                await contract.populateTransaction.mint(
                    adminWallet.address, ETH.mul(25000)
                ),
                getNonce()
            )
            const signedTx = await adminWallet.signTransaction(txReq)
            daiMints.push(signedTx)
            console.log(`minting DAI${idx + 1}...`)
            await (await PROVIDER.sendTransaction(signedTx)).wait(1)
            idx += 1
            console.log(`DAI${idx} balance: ${await contract.balanceOf(adminWallet.address)}`)
        }
        // !! nonce=9
    
        // mint 40 WETH (10 for each (of 3) DAI/WETH pair, 10 for funzies)
        console.log("WETH", addr_weth)
        const mintWethTx = populateTxFully({
            value: ETH.mul(40),
            to: addr_weth,
        }, getNonce())
        signedMintWethTx = await adminWallet.signTransaction(mintWethTx)
        console.log("minting WETH...")
        await (await PROVIDER.sendTransaction(signedMintWethTx)).wait(1)
        console.log(`WETH balance: ${await wethContract.connect(PROVIDER).balanceOf(adminWallet.address)}`)
        // !! nonce=10
    
        // approve univ2 router to spend my tokens
        const signedApproveWeth = await adminWallet.signTransaction(
            populateTxFully(
                await wethContract.populateTransaction.approve(addr_uniV2Router, ETH.mul(1000000)), // allow pair to handle 1M of my eth
                getNonce()
            )
        )
        const signedApproveDai1 = await adminWallet.signTransaction(
            populateTxFully(
                await dai1Contract.populateTransaction.approve(addr_uniV2Router, ETH.mul(100000000)), // allow pair to handle 100M of my DAI1
                getNonce()
            )
        )
        const signedApproveDai2 = await adminWallet.signTransaction(
            populateTxFully(
                await dai2Contract.populateTransaction.approve(addr_uniV2Router, ETH.mul(100000000)), // allow pair to handle 100M of my DAI1
                getNonce()
            )
        )
        const signedApproveDai3 = await adminWallet.signTransaction(
            populateTxFully(
                await dai3Contract.populateTransaction.approve(addr_uniV2Router, ETH.mul(100000000)), // allow pair to handle 100M of my DAI1
                getNonce()
            )
        )
        const approveResWeth = await (await PROVIDER.sendTransaction(signedApproveWeth)).wait(1)
        console.log("approve weth", approveResWeth.transactionHash)
        const approveResDai1 = await (await PROVIDER.sendTransaction(signedApproveDai1)).wait(1)
        console.log("approve dai1", approveResDai1.transactionHash)
        const approveResDai2 = await (await PROVIDER.sendTransaction(signedApproveDai2)).wait(1)
        console.log("approve dai2", approveResDai2.transactionHash)
        const approveResDai3 = await (await PROVIDER.sendTransaction(signedApproveDai3)).wait(1)
        console.log("approve dai3", approveResDai3.transactionHash)
    }

    // deposit (100 WETH / 150000 DAI) in each WETH/DAI pair

    // for (let i = 0; i < 3; i++) {
    //     const daiX = i === 0 ? dai1 : i === 1 ? dai2 : dai3;
    //     const signedTx = await adminWallet.signTransaction(
    //         populateTxFully(
    //             await uniV2RouterContract.populateTransaction.addLiquidity(
    //                 weth.contractAddress,
    //                 daiX.contractAddress,
    //                 ETH.mul(10),
    //                 ETH.mul(50000),
    //                 ETH.mul(9),
    //                 ETH.mul(40000),
    //                 adminWallet.address,
    //                 now() + 1000), 
    //             getNonce() + i
    //         ))
    //     console.log(`adding liquidity for WETH/DAI${i + 1}`)
    //     wethDaiDeposits.push(signedTx)
        
    //     await (await PROVIDER.sendTransaction(signedTx)).wait(1)
    //     console.log("OK.")
    // }
    // !! nonce=18

    // const daiWethPairs = [dai1_weth, dai2_weth, dai3_weth]
    // idx = 0
    // let subIdx = 0
    // let daiWethDeposits = []
    // for (const cd of daiWethPairs) {
    //     const pairContract = new Contract(cd.contractAddress, contracts.UniV2Pair.abi)
    //     const daiContract = new Contract(daiTokenAddrs[subIdx % 3].contractAddress, contracts.DAI.abi)
        
    //     const signedDepositWethTx = await adminWallet.signTransaction(
    //         populateTxFully(
    //             await wethContract.populateTransaction.transfer(cd.contractAddress, ETH.mul(100)),
    //             getNonce() + idx
    //         )
    //     )
    //     const signedDepositDaiTx = await adminWallet.signTransaction(
    //         populateTxFully(
    //             await daiContract.populateTransaction.transfer(cd.contractAddress, ETH.mul(150000)),
    //             getNonce() + idx
    //         )
    //     )
    //     const signedMintLpTokensTx = await adminWallet.signTransaction(
    //         populateTxFully(
    //             await pairContract.populateTransaction.mint(adminWallet.address),
    //             getNonce() + idx
    //         )
    //     )

    //     daiWethDeposits.push(signedDepositWethTx)
    //     daiWethDeposits.push(signedDepositDaiTx)
    //     daiWethDeposits.push(signedMintLpTokensTx)
    //     console.log(`depositing WETH into DAI${subIdx % 3 + 1}/WETH...`)
    //     await (await PROVIDER.sendTransaction(signedDepositWethTx)).wait(1)
    //     console.log("OK.")
    //     console.log(`depositing DAI into DAI${subIdx % 3 + 1}/WETH...`)
    //     await (await PROVIDER.sendTransaction(signedDepositDaiTx)).wait(1)
    //     console.log("OK.")
    //     console.log("minting LP tokens...")
    //     await (await PROVIDER.sendTransaction(signedMintLpTokensTx)).wait(1)
    //     console.log("OK.")
    //     idx += 3
    //     subIdx += 1
    // }
    // // !! nonce=23

    // deposit (50k DAI/DAI) for each DAI/DAI pair
    // const dai1Contract = new Contract(dai1.contractAddress, contracts.DAI.abi)
    // const daiDaiPairs = [dai1_dai2, dai1_dai3]
    // idx = 0
    // let subIdx = 0
    // for (const cd of daiDaiPairs) {
    //     const pairContract = new Contract(cd.contractAddress, contracts.UniV2Pair.abi)
    //     const daiNContract = new Contract(daiTokenAddrs[1 + subIdx].contractAddress, contracts.DAI.abi)
        
    //     const signedDepositDai1Tx = await adminWallet.signTransaction(
    //         populateTxFully(
    //             await dai1Contract.populateTransaction.transfer(cd.contractAddress, ETH.mul(50000)),
    //             getNonce()
    //         )
    //     )
    //     const signedDepositDaiNTx = await adminWallet.signTransaction(
    //         populateTxFully(
    //             await daiNContract.populateTransaction.transfer(cd.contractAddress, ETH.mul(50000)),
    //             getNonce()
    //         )
    //     )
    //     const signedMintLpTokensTx = await adminWallet.signTransaction(
    //         populateTxFully(
    //             await pairContract.populateTransaction.mint(adminWallet.address),
    //             getNonce()
    //         )
    //     )
    //     daiDaiDeposits.push(signedDepositDai1Tx)
    //     daiDaiDeposits.push(signedDepositDaiNTx)
    //     daiDaiDeposits.push(signedMintLpTokensTx)
    //     console.log(`depositing DAI1 into DAI1/DAI${subIdx % 3 + 2}...`)
    //     await (await PROVIDER.sendTransaction(signedDepositDai1Tx)).wait(1)
    //     console.log("OK.")
    //     console.log(`depositing DAI${subIdx % 3 + 2} into DAI1/DAI${subIdx % 3 + 2}...`)
    //     await (await PROVIDER.sendTransaction(signedDepositDaiNTx)).wait(1)
    //     console.log("OK.")
    //     console.log("minting LP tokens...")
    //     await (await PROVIDER.sendTransaction(signedMintLpTokensTx)).wait(1)
    //     console.log("OK.")
    //     subIdx += 1
    // }
    // !! nonce=30

    // const dai1Weth = new Contract(dai1_weth.contractAddress, contracts.UniV2Pair.abi)
    // const token0: string = await dai1Weth.connect(PROVIDER).token0()
    // console.log("token0", token0)
    // const token1: string = await dai1Weth.connect(PROVIDER).token1()
    // console.log("token1", token1)

    // // swap WETH for DAIX
    // const path = token0 === weth.contractAddress ? [token0, token1] : [token1, token0]
    // console.log("PATH", path)
    // const amountIn = ETH.mul(1)
    // const amountOut = ETH.mul(1000) // give myself a bad quote

    // // approve router to spend weth
    // const signedApprove1 = await adminWallet.signTransaction(
    //     populateTxFully(
    //         await wethContract.populateTransaction.approve(dai1_weth.contractAddress, ETH.mul(100000)), // allow pair to handle 1M of my eth
    //         getNonce()
    //     )
    // )
    // const approveRes1 = await (await PROVIDER.sendTransaction(signedApprove1)).wait(1)
    // console.log("approve result", approveRes1.transactionHash)
    // // approve router to spend dai1
    // const signedApprove2 = await adminWallet.signTransaction(
    //     populateTxFully(
    //         await dai1Contract.populateTransaction.approve(dai1_weth.contractAddress, ETH.mul(100000)), // allow pair to handle 1M of my eth
    //         getNonce()
    //     )
    // )
    // const approveRes2 = await (await PROVIDER.sendTransaction(signedApprove2)).wait(1)
    // console.log("approve result", approveRes2.transactionHash)

    // const signedSwap = await adminWallet.signTransaction(
    //     populateTxFully(
    //         await uniV2RouterContract.populateTransaction.swapExactTokensForTokens(amountIn, amountOut, path, adminWallet.address, now() + 2000),
    //         getNonce()
    //     )
    // )
    // const swapRes = await (await PROVIDER.sendTransaction(signedSwap)).wait(1)
    // console.log("swap result", swapRes.transactionHash)
    const endBalance = await adminWallet.connect(PROVIDER).getBalance()
    console.log(`balance: ${utils.formatEther(endBalance)} ETH (spent ${utils.formatEther(startBalance.sub(endBalance))})`)
    
    const deploymentsSignedTxs = deployments ? Object.values(deployments)
        .map(d => d.signedDeployTx) : []
    const signedTxs = deploymentsSignedTxs
        .concat(daiMints)
        .concat(signedMintWethTx || [])
        .concat()
        .concat(wethDaiDeposits)
        .concat(daiDaiDeposits)
    const filename = !shouldDeploy ? await getNewLiquidityFilename() : await getNewDeploymentFilename()
    await fs.writeFile(filename, JSON.stringify({deployments, allSignedTxs: signedTxs}), {encoding: "utf8"})
    console.log(`Done. Check output at ${textColors.Bright}${filename}${textColors.Reset}`)
}

main()
