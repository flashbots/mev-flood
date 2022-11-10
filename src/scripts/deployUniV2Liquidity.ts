import { TransactionRequest } from '@ethersproject/abstract-provider';
import { ContractFactory, Contract, utils, BigNumber, constants } from "ethers"
import { constants as fsConstants } from 'fs';
import fs from "fs/promises"
import readline from "readline-sync"
import { getDeployUniswapV2Args } from '../lib/cliArgs';

import contracts, { ContractSpec } from "../lib/contracts"
import env from '../lib/env';
import { ETH, GWEI, PROVIDER, textColors } from '../lib/helpers';
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
    dai1_weth?: ContractDeployment,      // univ2 pair
    dai2_weth?: ContractDeployment,      // univ2 pair
    dai3_weth?: ContractDeployment,      // univ2 pair
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
        gasLimit: 9000000,
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
        contractAddress: utils.getContractAddress({from: txReq.from || adminWallet.address, nonce}),
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

const dir = async () => {
    const dirname = `src/output/${env.CHAIN_NAME}`
    try {
        await fs.access(dirname, fsConstants.R_OK | fsConstants.W_OK)
    } catch (e) {
        await fs.mkdir(dirname)
    }
    return dirname
}

const getNewDeploymentFilename = async () => {
    const dirname = await dir()
    const fileNumber = (await fs.readdir(dirname)).filter(e => e.includes("uniDeployment")).length
    return `${dirname}/uniDeployment${fileNumber}.json`
}
const getNewLiquidityFilename = async () => {
    const dirname = await dir()
    const fileNumber = (await fs.readdir(dirname)).filter(e => e.includes("uniLiquidity")).length
    return `${dirname}/uniLiquidity${fileNumber}.json`
}
const getExistingDeploymentFilename = async () => {
    const dirname = await dir()
    const fileNumber = (await fs.readdir(dirname)).filter(e => e.includes("uniDeployment")).length - 1
    return `${dirname}/uniDeployment${fileNumber}.json`
}

/** Prints txs:
 * build a set of contracts to deploy,
 * create univ2 pools,
 * bootstrap w/ liquidity
 * 
 * all txs are signed with the account specified by ADMIN_PRIVATE_KEY in .env
*/
const main = async () => {
    const {
        autoAccept,
        shouldApproveTokens,
        shouldDeploy,
        shouldBootstrapLiquidity,
        shouldMintTokens,
        shouldTestSwap,
    } = getDeployUniswapV2Args()

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
    if (nonce != 0 && !autoAccept) {
        console.warn(`Your account nonce is currently ${nonce}.`)
        readline.question("press Enter to continue...")
    }

    let addr_dai1: string
    let addr_dai2: string
    let addr_dai3: string
    let addr_weth: string
    let addr_uniV2Factory: string
    let addr_dai1_weth: string
    let addr_dai2_weth: string
    let addr_dai3_weth: string
    // arrays to be returned at end
    let deployments: Deployments | undefined = undefined // the contracts we will interact with
    let daiMints: string[] = []
    let approvals: string[] = []
    let wethDaiDeposits: string[] = []
    let daiDaiDeposits: string[] = []
    let signedMintWethTx: string | undefined = undefined
    let setFeeToTx: string | undefined = undefined

    let getBalances: () => Promise<any>

    // deploy on local devnet
    if (shouldDeploy) {
        // ### get contract deployments
        let dai1 = await getCloneDeployment(contracts.DAI, getNonce(), [env.CHAIN_ID])
        let dai2 = await getCloneDeployment(contracts.DAI, getNonce(), [env.CHAIN_ID])
        let dai3 = await getCloneDeployment(contracts.DAI, getNonce(), [env.CHAIN_ID])
        let weth = await getCloneDeployment(contracts.WETH, getNonce()) // weth has no constructor args
        // get uniswapv2 factory deployment
        let uniV2Factory = await getCloneDeployment(contracts.UniV2Factory, getNonce(), [adminWallet.address])
        console.log("deploying base contracts: 3 DAI tokens, WETH, uniswapV2factory...")
        deployments = {
            dai1,           // erc20
            dai2,           // erc20
            dai3,           // erc20
            weth,           // erc20
            uniV2Factory,   // univ2 factory (creates univ2 pairs)
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

        for (const deployment of Object.values(deployments)) {
            await (await PROVIDER.sendTransaction(deployment.signedDeployTx)).wait(1)
            console.log("OK.")
        }
        
        // ### deploy liq pairs
        const dai1_weth = await getPairDeployment(addr_uniV2Factory, addr_dai1, addr_weth, getNonce())
        const dai2_weth = await getPairDeployment(addr_uniV2Factory, addr_dai2, addr_weth, getNonce())
        const dai3_weth = await getPairDeployment(addr_uniV2Factory, addr_dai3, addr_weth, getNonce())
        addr_dai1_weth = dai1_weth.contractAddress
        addr_dai2_weth = dai2_weth.contractAddress
        addr_dai3_weth = dai3_weth.contractAddress
        // const dai1_dai2 = await getPairDeployment(uniV2Factory.contractAddress, dai1.contractAddress, dai2.contractAddress, getNonce())
        // const dai1_dai3 = await getPairDeployment(uniV2Factory.contractAddress, dai1.contractAddress, dai3.contractAddress, getNonce())

        const pairDeployments = [
            dai1_weth,
            dai2_weth,
            dai3_weth,
        //     dai1_dai2,
        //     dai1_dai3,
        ]
        for (const cd of pairDeployments) {
            console.log("deploying pair...")
            await (await PROVIDER.sendTransaction(cd.signedDeployTx)).wait(1)
            console.log("OK.")
        }
        deployments = {
            ...deployments,
            dai1_weth,
            dai2_weth,
            dai3_weth,
        }
    } else {
        // read contracts from output/
        const filename = await getExistingDeploymentFilename()
        console.log(`reading config from ${filename}`)
        const uniDeployments: DeploymentsFile = JSON.parse(await fs.readFile(filename, {encoding: "utf-8"}))
        addr_dai1 = uniDeployments.deployments.dai1.contractAddress
        addr_dai2 = uniDeployments.deployments.dai2.contractAddress
        addr_dai3 = uniDeployments.deployments.dai3.contractAddress
        addr_weth = uniDeployments.deployments.weth.contractAddress
        addr_dai1_weth = uniDeployments.deployments.dai1_weth?.contractAddress || ''
        addr_dai2_weth = uniDeployments.deployments.dai2_weth?.contractAddress || ''
        addr_dai3_weth = uniDeployments.deployments.dai3_weth?.contractAddress || ''
        addr_uniV2Factory = uniDeployments.deployments.uniV2Factory.contractAddress
        console.log("weth addr", uniDeployments.deployments.weth.contractAddress)
    }

    const wethContract = new Contract(addr_weth, contracts.WETH.abi)
    const dai1Contract = new Contract(addr_dai1, contracts.DAI.abi)
    const dai2Contract = new Contract(addr_dai2, contracts.DAI.abi)
    const dai3Contract = new Contract(addr_dai3, contracts.DAI.abi)
    const uniV2FactoryContract = new Contract(addr_uniV2Factory, contracts.UniV2Factory.abi)

    getBalances = async () => {
        return {
            wethBalance: await wethContract.connect(PROVIDER).balanceOf(adminWallet.address),
            dai1Balance: await dai1Contract.connect(PROVIDER).balanceOf(adminWallet.address),
            dai2Balance: await dai2Contract.connect(PROVIDER).balanceOf(adminWallet.address),
            dai3Balance: await dai3Contract.connect(PROVIDER).balanceOf(adminWallet.address),
        }
    }
    
    if (shouldMintTokens) {
        // ### bootstrap liquidity
        /* Exchange rates: 1500 DAI/WETH; maybe add pairs to have 1 DAI1/DAI2|DAI3 */
        // mint 25K DAI for each (15K per DAI/WETH pair, 5k per DAI/DAI pair)
        const daiTokenAddrs = [
            addr_dai1, addr_dai2, addr_dai3
        ]
        console.log("daiTokens", daiTokenAddrs)
        let idx = 0

        for (const addr of daiTokenAddrs) {
            const contract = new Contract(addr, contracts.DAI.abi, adminWallet)
            const txReq = populateTxFully(
                await contract.populateTransaction.mint(
                    adminWallet.address, ETH.mul(25).mul(1e9) // mint 25B DAI
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

        // mint tons of weth
        console.log("WETH", addr_weth)
        const mintWethTx = populateTxFully({
            value: ETH.mul(9001),
            to: addr_weth,
            data: "0xd0e30db0" // deposit
        }, getNonce())
        signedMintWethTx = await adminWallet.signTransaction(mintWethTx)
        console.log("minting WETH...")
        await (await PROVIDER.sendTransaction(signedMintWethTx)).wait(1)
        console.log(`WETH balance: ${await wethContract.connect(PROVIDER).balanceOf(adminWallet.address)}`)

        console.log("balances", await getBalances())
    }

    if (shouldApproveTokens) {
        // approve pools to spend my tokens
        const signedApproveDai1WethPool = await adminWallet.signTransaction(
            populateTxFully(
                await dai1Contract.populateTransaction.approve(addr_dai1_weth, constants.MaxUint256), // allow pair to handle all the DAI1
                getNonce()
            )
        )
        const signedApproveWethDai1Pool = await adminWallet.signTransaction(
            populateTxFully(
                await wethContract.populateTransaction.approve(addr_dai1_weth, constants.MaxUint256), // allow pair to handle all the eth
                getNonce()
            )
        )
        const signedApproveDAI2WethPool = await adminWallet.signTransaction(
            populateTxFully(
                await dai2Contract.populateTransaction.approve(addr_dai2_weth, constants.MaxUint256), // allow pair to handle all the DAI2
                getNonce()
            )
        )
        const signedApproveWethDAI2Pool = await adminWallet.signTransaction(
            populateTxFully(
                await wethContract.populateTransaction.approve(addr_dai2_weth, constants.MaxUint256), // allow pair to handle all the eth
                getNonce()
            )
        )
        const signedApproveDAI3WethPool = await adminWallet.signTransaction(
            populateTxFully(
                await dai3Contract.populateTransaction.approve(addr_dai3_weth, constants.MaxUint256), // allow pair to handle all the DAI3
                getNonce()
            )
        )
        const signedApproveWethDAI3Pool = await adminWallet.signTransaction(
            populateTxFully(
                await wethContract.populateTransaction.approve(addr_dai3_weth, constants.MaxUint256), // allow pair to handle all the eth
                getNonce()
            )
        )

        const approveResDai1WethPool = await (await PROVIDER.sendTransaction(signedApproveDai1WethPool)).wait(1)
        console.log("approved weth", approveResDai1WethPool.transactionHash)
        const approveResWethDai1Pool = await (await PROVIDER.sendTransaction(signedApproveWethDai1Pool)).wait(1)
        console.log("approved weth dai1 pool", approveResWethDai1Pool.transactionHash)
        const approveSignedApproveDAI2WethPool = await (await PROVIDER.sendTransaction(signedApproveDAI2WethPool)).wait(1)
        console.log("approved XXX", approveSignedApproveDAI2WethPool.transactionHash)
        const approveSignedApproveWethDAI2Pool = await (await PROVIDER.sendTransaction(signedApproveWethDAI2Pool)).wait(1)
        console.log("approved XXX", approveSignedApproveWethDAI2Pool.transactionHash)
        const approveSignedApproveDAI3WethPool = await (await PROVIDER.sendTransaction(signedApproveDAI3WethPool)).wait(1)
        console.log("approved XXX", approveSignedApproveDAI3WethPool.transactionHash)
        const approveSignedApproveWethDAI3Pool = await (await PROVIDER.sendTransaction(signedApproveWethDAI3Pool)).wait(1)
        console.log("approved XXX", approveSignedApproveWethDAI3Pool.transactionHash)
        approvals.push(signedApproveDai1WethPool)
        approvals.push(signedApproveWethDai1Pool)
        approvals.push(signedApproveDAI2WethPool)
        approvals.push(signedApproveWethDAI2Pool)
        approvals.push(signedApproveDAI3WethPool)
        approvals.push(signedApproveWethDAI3Pool)
    }

    if (shouldBootstrapLiquidity) {
        const factoryPairsLength = await uniV2FactoryContract.connect(PROVIDER).allPairsLength()
        console.log("factory num pairs", factoryPairsLength)
        const factoryFeeTo = await uniV2FactoryContract.connect(PROVIDER).feeTo()

        const addr_dai1_weth: string = await uniV2FactoryContract.connect(PROVIDER).getPair(addr_weth, addr_dai1)
        console.log("addr_dai1_weth", addr_dai1_weth)
        const addr_dai2_weth: string = await uniV2FactoryContract.connect(PROVIDER).getPair(addr_weth, addr_dai2)
        console.log("addr_dai2_weth", addr_dai2_weth)
        const addr_dai3_weth: string = await uniV2FactoryContract.connect(PROVIDER).getPair(addr_weth, addr_dai3)
        console.log("addr_dai3_weth", addr_dai3_weth)

        // set feeTo in univ2 factory
        if (factoryFeeTo === "0x0000000000000000000000000000000000000000") {
            setFeeToTx = await adminWallet.signTransaction(populateTxFully(
                await uniV2FactoryContract.populateTransaction.setFeeTo(adminWallet.address),
                getNonce()
            ))
            console.log("setting feeTo in univ2 factory...")
            await (await PROVIDER.sendTransaction(setFeeToTx)).wait(1)
            console.log("OK.")
        }

        // deposit liquidity into WETH/DAIX pairs
        const daiTokenAddrs = [addr_dai1, addr_dai2, addr_dai3]
        const daiWethPairAddrs = [addr_dai1_weth, addr_dai2_weth, addr_dai3_weth]
        let idx = 0
        for (const pairAddr of daiWethPairAddrs) {
            const pairContract = new Contract(pairAddr, contracts.UniV2Pair.abi)
            const daiContract = new Contract(daiTokenAddrs[idx], contracts.DAI.abi)
            
            const signedDepositWethTx = await adminWallet.signTransaction(
                populateTxFully(
                    await wethContract.populateTransaction.transfer(pairAddr, ETH.mul(2000)),
                    getNonce()
                )
            )
            const signedDepositDaiTx = await adminWallet.signTransaction(
                populateTxFully(
                    await daiContract.populateTransaction.transfer(pairAddr, ETH.mul(20).mul(1e9)),
                    getNonce()
                )
            )
            const signedMintLpTokensTx = await adminWallet.signTransaction(
                populateTxFully(
                    await pairContract.populateTransaction.mint(adminWallet.address),
                    getNonce()
                )
            )

            wethDaiDeposits.push(signedDepositWethTx)
            wethDaiDeposits.push(signedDepositDaiTx)
            wethDaiDeposits.push(signedMintLpTokensTx)
            console.log(`depositing WETH into DAI${idx % 3 + 1}/WETH...`)
            await (await PROVIDER.sendTransaction(signedDepositWethTx)).wait(1)
            console.log("OK.")
            console.log(`depositing DAI${idx % 3 + 1} into DAI${idx % 3 + 1}/WETH...`)
            await (await PROVIDER.sendTransaction(signedDepositDaiTx)).wait(1)
            console.log("OK.")
            console.log("minting LP tokens...")
            await (await PROVIDER.sendTransaction(signedMintLpTokensTx)).wait(1)
            console.log("OK.")

            idx += 1
        }        

        // deposit (50k DAI/DAI) for each DAI/DAI pair
        // const dai1Contract = new Contract(dai1.contractAddress, contracts.DAI.abi)
        // const daiDaiPairs = [dai1_dai2, dai1_dai3]
        // idx = 0
        // let idx = 0
        // for (const cd of daiDaiPairs) {
        //     const pairContract = new Contract(cd.contractAddress, contracts.UniV2Pair.abi)
        //     const daiNContract = new Contract(daiTokenAddrs[1 + idx].contractAddress, contracts.DAI.abi)
            
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
        //     console.log(`depositing DAI1 into DAI1/DAI${idx % 3 + 2}...`)
        //     await (await PROVIDER.sendTransaction(signedDepositDai1Tx)).wait(1)
        //     console.log("OK.")
        //     console.log(`depositing DAI${idx % 3 + 2} into DAI1/DAI${idx % 3 + 2}...`)
        //     await (await PROVIDER.sendTransaction(signedDepositDaiNTx)).wait(1)
        //     console.log("OK.")
        //     console.log("minting LP tokens...")
        //     await (await PROVIDER.sendTransaction(signedMintLpTokensTx)).wait(1)
        //     console.log("OK.")
        //     idx += 1
        // }
        console.log("balances", await getBalances())
    }
    
    if (shouldTestSwap) {
        try {
            const addr_dai1_weth: string = await uniV2FactoryContract.connect(PROVIDER).getPair(addr_weth, addr_dai1)
            // const addr_dai2_weth: string = await uniV2FactoryContract.connect(PROVIDER).getPair(addr_weth, addr_dai2)
            // const addr_dai3_weth: string = await uniV2FactoryContract.connect(PROVIDER).getPair(addr_weth, addr_dai3)
            const dai1WethPair = new Contract(addr_dai1_weth, contracts.UniV2Pair.abi)
            // const dai2WethPair = new Contract(addr_dai2_weth, contracts.UniV2Pair.abi)
            // const dai3WethPair = new Contract(addr_dai3_weth, contracts.UniV2Pair.abi)

            // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset (copied from Univ2 library)
            const getAmountOut = (
                amountIn: BigNumber,
                reserveIn: BigNumber,
                reserveOut: BigNumber
            ) => {
                if (amountIn.lte(0)) {
                    console.error('UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT')
                }
                if (reserveIn.lte(0) && reserveOut.lte(0)) {
                    console.error('UniswapV2Library: INSUFFICIENT_LIQUIDITY')
                }
                const amountInWithFee = amountIn.mul(997);
                const numerator = amountInWithFee.mul(reserveOut);
                const denominator = reserveIn.mul(1000).add(amountInWithFee);
                return numerator.div(denominator);
            }

            // performs chained getAmountOut calculations on any number of pairs (copied from Univ2 library)
            const getAmountsOut = async (
                amountIn: BigNumber,
                path: string[]
            ) => {
                if (path.length < 2) console.error('UniswapV2Library: INVALID_PATH')
                let amounts = []
                amounts[0] = amountIn;
                for (let i = 0; i < path.length - 1; i++) {
                    let pairAddress = await uniV2FactoryContract.connect(PROVIDER)
                        .getPair(path[i], path[i + 1])
                    let pairContract = new Contract(pairAddress, contracts.UniV2Pair.abi)
                    const reserves = await pairContract.connect(PROVIDER).getReserves()
                    amounts[i + 1] = getAmountOut(amounts[i], reserves[0], reserves[1]);
                }
                return amounts
            }

            // swap 0.1 WETH for DAI1
            const amountIn = ETH.div(100)
            const amountsOut = await getAmountsOut(amountIn, [addr_weth, addr_dai1])

            // need to send `amountIn` to pair contract before calling `swap`
            const signedPreSwapTransfer = await adminWallet.signTransaction(
                populateTxFully(
                    await wethContract.populateTransaction
                        .transfer(addr_dai1_weth, amountIn),
                    getNonce()
                )
            )
            await (await PROVIDER.sendTransaction(signedPreSwapTransfer)).wait(1)

            // finally, send the swap
            const signedSwap = await adminWallet.signTransaction(
                populateTxFully(
                    await dai1WethPair.populateTransaction.swap(amountsOut[0], amountsOut[1], adminWallet.address, []),
                    getNonce()
                )
            )
            const swapRes = await (await PROVIDER.sendTransaction(signedSwap)).wait(1)
            console.log("swap", swapRes.transactionHash)
        } catch (e) {
            console.error("failed to swap", e)
        }
        console.log("balances", await getBalances())
    }

    const endBalance = await adminWallet.connect(PROVIDER).getBalance()
    console.log(`balance: ${utils.formatEther(endBalance)} ETH (spent ${utils.formatEther(startBalance.sub(endBalance))})`)
    
    const deploymentsSignedTxs = deployments ? Object.values(deployments)
        .map(d => d.signedDeployTx) : []
    const signedTxs = deploymentsSignedTxs
        .concat(daiMints)
        .concat(signedMintWethTx || [])
        .concat(setFeeToTx || [])
        .concat(approvals)
        .concat(wethDaiDeposits)
        .concat(daiDaiDeposits)
    const filename = !shouldDeploy ? await getNewLiquidityFilename() : await getNewDeploymentFilename()
    await fs.writeFile(filename, JSON.stringify({deployments, allSignedTxs: signedTxs}), {encoding: "utf8"})
    console.log(`Done. Check output at ${textColors.Bright}${filename}${textColors.Reset}`)
}

main()
