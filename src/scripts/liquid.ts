import { ContractFactory, Contract, utils, BigNumber, constants, Wallet } from "ethers"
import fs from "fs/promises"
import readline from "readline-sync"
import { getDeployUniswapV2Args } from '../lib/cliArgs';

import contracts, { ContractSpec } from "../lib/contracts"
import env from '../lib/env';
import { ETH, PROVIDER, textColors, populateTxFully } from '../lib/helpers';
import { signSwap, getNewDeploymentFilename, getNewLiquidityFilename, getExistingDeploymentFilename, ContractDeployment, DeploymentsFile, Deployments, getDeployment } from '../lib/liquid';
import { getAdminWallet, getTestWallet } from '../lib/wallets';

/** Used for signing only, NOT connected to a provider. */
const adminWallet = getAdminWallet()

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
    const userWallet = getTestWallet().connect(PROVIDER)
    console.log("adminWallet", adminWallet.address)
    const startBalance = await adminWallet.connect(PROVIDER).getBalance()
    console.log(`balance: ${utils.formatEther(startBalance)} ETH`)
    let adminNonce = await adminWallet.getTransactionCount()
    let userNonce = await userWallet.getTransactionCount()
    const getAdminNonce = () => {
        const tempNonce = adminNonce
        adminNonce += 1
        return tempNonce
    }
    const getUserNonce = () => {
        const tempNonce = userNonce
        userNonce += 1
        return tempNonce
    }
    if (adminNonce != 0 && !autoAccept) {
        console.warn(`Your admin account nonce is currently ${adminNonce}.`)
        readline.question("press Enter to continue...")
    }

    let addr_dai: string
    let addr_weth: string
    let addr_uniV2Factory_A: string
    let addr_uniV2Factory_B: string
    let addr_dai_weth_A: string
    let addr_dai_weth_B: string
    let addr_atomicSwap: string
    // to be returned at end
    let deployments: Deployments | undefined = undefined // the contracts we will interact with
    let signedTxs: string[] = []

    // defined after we get contract addresses, either from new deployment or from file
    let getBalances: () => Promise<any>

    // deploy on local devnet
    if (shouldDeploy) {
        // ### get contract deployments
        // tokens
        let dai = await getCloneDeployment(contracts.DAI, getAdminNonce(), [env.CHAIN_ID])
        let weth = await getCloneDeployment(contracts.WETH, getAdminNonce()) // weth has no constructor args
        // uniswapv2 factories
        let uniV2Factory_A = await getCloneDeployment(contracts.UniV2Factory, getAdminNonce(), [adminWallet.address])
        let uniV2Factory_B = await getCloneDeployment(contracts.UniV2Factory, getAdminNonce(), [adminWallet.address])
        // custom router
        let atomicSwap = await getCloneDeployment(contracts.AtomicSwap, getAdminNonce(), [weth.contractAddress])
        console.log("deploying base contracts: 3 DAI tokens, WETH, uniswapV2factory...")

        deployments = {
            dai,            // erc20
            weth,           // erc20
            uniV2Factory_A, // univ2 factory (creates univ2 pairs)
            uniV2Factory_B, // univ2 factory (creates univ2 pairs)
            atomicSwap,     // custom router
        }
        addr_dai = dai.contractAddress
        addr_weth = weth.contractAddress
        addr_uniV2Factory_A = uniV2Factory_A.contractAddress
        addr_uniV2Factory_B = uniV2Factory_B.contractAddress
        addr_atomicSwap = atomicSwap.contractAddress

        for (const deployment of Object.values(deployments)) {
            await (await PROVIDER.sendTransaction(deployment.signedDeployTx)).wait(1)
            console.log("OK.")
        }
        
        // ### deploy liq pairs
        const dai_weth_A = await getPairDeployment(addr_uniV2Factory_A, addr_dai, addr_weth, getAdminNonce())
        const dai_weth_B = await getPairDeployment(addr_uniV2Factory_B, addr_dai, addr_weth, getAdminNonce())
        addr_dai_weth_A = dai_weth_A.contractAddress
        addr_dai_weth_B = dai_weth_B.contractAddress

        const pairDeployments = [
            dai_weth_A,
            dai_weth_B,
        ]
        for (const deployment of pairDeployments) {
            console.log("deploying pair...")
            await (await PROVIDER.sendTransaction(deployment.signedDeployTx)).wait(1)
            console.log("OK.")
        }
        deployments = {
            ...deployments,
            dai_weth_A,
            dai_weth_B,
        }
    } else { // read contracts from `output/${NODE_ENV}/uniDeployment${X}.json`
        const filename = await getExistingDeploymentFilename()
        console.log(`reading config from ${filename}`)
        const uniDeployments = await getDeployment()
        addr_dai = uniDeployments.deployments.dai.contractAddress
        addr_weth = uniDeployments.deployments.weth.contractAddress
        addr_dai_weth_A = uniDeployments.deployments.dai_weth_A?.contractAddress || ''
        addr_dai_weth_B = uniDeployments.deployments.dai_weth_B?.contractAddress || ''
        addr_uniV2Factory_A = uniDeployments.deployments.uniV2Factory_A.contractAddress
        addr_uniV2Factory_B = uniDeployments.deployments.uniV2Factory_B.contractAddress
        addr_atomicSwap = uniDeployments.deployments.atomicSwap.contractAddress
        console.log("contract addrs", {
            addr_dai,
            addr_weth,
            addr_dai_weth_A,
            addr_dai_weth_B,
            addr_uniV2Factory_A,
            addr_uniV2Factory_B,
            addr_atomicSwap,
        })
    }

    const wethContract = new Contract(addr_weth, contracts.WETH.abi).connect(PROVIDER)
    const daiContract = new Contract(addr_dai, contracts.DAI.abi).connect(PROVIDER)
    const uniV2FactoryContract_A = new Contract(addr_uniV2Factory_A, contracts.UniV2Factory.abi).connect(PROVIDER)
    const uniV2FactoryContract_B = new Contract(addr_uniV2Factory_B, contracts.UniV2Factory.abi).connect(PROVIDER)
    const atomicSwapContract = new Contract (addr_atomicSwap, contracts.AtomicSwap.abi).connect(PROVIDER)
    const daiWethPair_A = new Contract(addr_dai_weth_A, contracts.UniV2Pair.abi).connect(PROVIDER)
    const daiWethPair_B = new Contract(addr_dai_weth_B, contracts.UniV2Pair.abi).connect(PROVIDER)

    getBalances = async () => {
        const isWeth0 = async (pair: Contract) => {
            const token0: string = await pair.token0()
            return token0.toLowerCase() === addr_weth.toLowerCase()
        }
        const reservesDaiWeth_A: any[] = await daiWethPair_A.getReserves()
        const reservesDaiWeth_B: any[] = await daiWethPair_B.getReserves()
        return {
            admin: {
                weth: utils.formatEther(await wethContract.balanceOf(adminWallet.address)),
                dai: utils.formatEther(await daiContract.balanceOf(adminWallet.address)),
            },
            user: {
                weth: utils.formatEther(await wethContract.balanceOf(userWallet.address)),
                dai: utils.formatEther(await daiContract.balanceOf(userWallet.address)),
            },
            swapContract: {
                weth: utils.formatEther(await wethContract.balanceOf(addr_atomicSwap)),
                dai: utils.formatEther(await daiContract.balanceOf(addr_atomicSwap)),
            },
            pricesPerWeth: {
                dai_Univ2_A: utils.formatEther(await isWeth0(daiWethPair_A) ?
                    (reservesDaiWeth_A[1].mul(ETH)).div(reservesDaiWeth_A[0] > 0 ? reservesDaiWeth_A[0] : 1) :
                    (reservesDaiWeth_A[0].mul(ETH)).div(reservesDaiWeth_A[1] > 0 ? reservesDaiWeth_A[1] : 1)),
                dai_Univ2_B: utils.formatEther(await isWeth0(daiWethPair_B) ?
                    (reservesDaiWeth_B[1].mul(ETH)).div(reservesDaiWeth_B[0] > 0 ? reservesDaiWeth_B[0] : 1) :
                    (reservesDaiWeth_B[0].mul(ETH)).div(reservesDaiWeth_B[1] > 0 ? reservesDaiWeth_B[1] : 1)),
            },
            reserves: {
                uni_A: reservesDaiWeth_A.slice(0, 2).map(r => utils.formatEther(r)),
                uni_B: reservesDaiWeth_B.slice(0, 2).map(r => utils.formatEther(r)),
            }
        }
    }
    
    if (shouldMintTokens) {
        const DAI_ADMIN_MINT_AMOUNT = ETH.mul(3000000) // mint 3M DAI for admin (to make LP deposits)
        const DAI_USER_MINT_AMOUNT = ETH.mul(50000)
        const WETH_ADMIN_MINT_AMOUNT = ETH.mul(9000)
        const WETH_USER_MINT_AMOUNT = ETH.mul(500)

        // mint DAI for admin
        let signedTx = await adminWallet.signTransaction(populateTxFully(
            await daiContract.populateTransaction.mint(
                adminWallet.address, DAI_ADMIN_MINT_AMOUNT
            ),
            getAdminNonce()
        ))
        signedTxs.push(signedTx)
        console.log(`minting DAI for admin ${adminWallet.address}...`)
        await (await PROVIDER.sendTransaction(signedTx)).wait(1)

        // mint DAI for user
        signedTx = await adminWallet.signTransaction(populateTxFully(
            await daiContract.populateTransaction.mint(
                userWallet.address, DAI_USER_MINT_AMOUNT
            ),
            getAdminNonce()
        ))
        signedTxs.push(signedTx)
        console.log(`minting DAI for user ${userWallet.address}...`)
        await (await PROVIDER.sendTransaction(signedTx)).wait(1)

        // mint 1000 weth for admin
        signedTx = await adminWallet.signTransaction(populateTxFully({
            value: WETH_ADMIN_MINT_AMOUNT,
            to: addr_weth,
            data: "0xd0e30db0" // deposit
        }, getAdminNonce()))
        signedTxs.push(signedTx)
        console.log(`minting WETH for admin ${adminWallet.address}...`)
        await (await PROVIDER.sendTransaction(signedTx)).wait(1)

        // mint an earnest amount of weth for user
        signedTx = await userWallet.signTransaction(populateTxFully({
            value: WETH_USER_MINT_AMOUNT,
            to: addr_weth,
            data: "0xd0e30db0" // deposit
        }, getUserNonce(), {from: userWallet.address}))
        signedTxs.push(signedTx)
        console.log(`minting WETH for user ${userWallet.address}...`)
        await (await PROVIDER.sendTransaction(signedTx)).wait(1)

        console.log("balances", await getBalances())
    }

    if (shouldApproveTokens) {
        const getApproveTx = async (token: Contract, spender: string, owner: Wallet) => {
            const signedTx = await owner.signTransaction(
                populateTxFully(
                    await token.populateTransaction.approve(spender, constants.MaxUint256),
                    owner.address == adminWallet.address ? getAdminNonce() : getUserNonce(),
                    {from: owner.address}
                )
            )
            signedTxs.push(signedTx)
            return signedTx
        }
        // approve pair contracts to spend my tokens
        const tokens = [
            daiContract,
            wethContract,
        ]
        const approvers = [
            adminWallet,
            userWallet,
        ]
        for (const wallet of approvers) {
            for (const token of tokens) {
                const signedTx = await getApproveTx(token, atomicSwapContract.address, wallet)
                signedTxs.push(signedTx)
                console.log("approved", (await (await PROVIDER.sendTransaction(signedTx)).wait(1)).transactionHash)
            }
        }
    }

    if (shouldBootstrapLiquidity) {
        const WETH_DEPOSIT_AMOUNT = ETH.mul(1000)
        const DAI_DEPOSIT_AMOUNT = WETH_DEPOSIT_AMOUNT.mul(1300) // price 1300 DAI/WETH

        const factoryPairsLength_A = await uniV2FactoryContract_A.allPairsLength()
        const factoryPairsLength_B = await uniV2FactoryContract_B.allPairsLength()
        console.log("factory_A num pairs", factoryPairsLength_A)
        console.log("factory_B num pairs", factoryPairsLength_B)

        const addr_dai_weth_A: string = await uniV2FactoryContract_A.getPair(addr_weth, addr_dai)
        const addr_dai_weth_B: string = await uniV2FactoryContract_B.getPair(addr_weth, addr_dai)
        console.log("addr_dai_weth_A", addr_dai_weth_A)
        console.log("addr_dai_weth_B", addr_dai_weth_B)

        // deposit liquidity into WETH/DAI pairs
        // TODO: this should be a router function
        const daiWethPairAddrs = [addr_dai_weth_A, addr_dai_weth_B]
        for (const pairAddr of daiWethPairAddrs) {
            const pairContract = new Contract(pairAddr, contracts.UniV2Pair.abi)
            
            let signedTx = await adminWallet.signTransaction( // deposit WETH into pair
                populateTxFully(
                    await wethContract.populateTransaction.transfer(pairAddr, WETH_DEPOSIT_AMOUNT),
                    getAdminNonce()
                )
            )
            signedTxs.push(signedTx)
            console.log(`depositing WETH into pair...`)
            await (await PROVIDER.sendTransaction(signedTx)).wait(1)

            signedTx = await adminWallet.signTransaction( // deposit DAI into pair
                populateTxFully(
                    await daiContract.populateTransaction.transfer(pairAddr, DAI_DEPOSIT_AMOUNT),
                    getAdminNonce()
                )
            )
            signedTxs.push(signedTx)
            console.log(`depositing DAI into pair...`)
            await (await PROVIDER.sendTransaction(signedTx)).wait(1)

            signedTx = await adminWallet.signTransaction( // mint LP tokens
                populateTxFully(
                    await pairContract.populateTransaction.mint(adminWallet.address),
                    getAdminNonce()
                )
            )
            signedTxs.push(signedTx)
            console.log(`minting LP tokens...`)
            await (await PROVIDER.sendTransaction(signedTx)).wait(1)
        }        

        console.log("balances", await getBalances())
    }
    
    if (shouldTestSwap) {
        // swap 1 WETH for DAI on Uni_A
        const amountIn = ETH.mul(50)
        const path = [addr_weth, addr_dai]

        try {
            // use custom router to swap
            const signedSwap = await signSwap(atomicSwapContract, uniV2FactoryContract_A.address, userWallet, amountIn, path, getUserNonce())
            const swapRes = await (await PROVIDER.sendTransaction(signedSwap)).wait(1)
            console.log("user swapped", swapRes.transactionHash)
            console.log("balances", await getBalances())
        } catch (e) {
            console.error("failed to swap", e)
        }
        try {
            const reserves_A: BigNumber[] = (await daiWethPair_A.getReserves()).slice(0,2)
            const reserves_B: BigNumber[] = (await daiWethPair_B.getReserves()).slice(0,2)

            const priceHigherOnA = reserves_A[0].div(reserves_A[1]).gt(reserves_B[0].div(reserves_B[1]))
            const start_factory = priceHigherOnA ? addr_uniV2Factory_A : addr_uniV2Factory_B
            const end_factory = priceHigherOnA ? addr_uniV2Factory_B : addr_uniV2Factory_A

            // backrun it
            const signedBackrun = await adminWallet.signTransaction(
                populateTxFully(
                    await atomicSwapContract.populateTransaction.backrun(
                        addr_dai, // token we're going to buy and sell
                        start_factory, // factory of pair we'll buy token from
                        end_factory, // factory of pair we'll sell token to
                        amountIn.mul(50).div(100) // amount of WETH to spend on tokens // lazy approximation
                    ),
                    getAdminNonce(),
                )
            )
            const backrunRes = await (await PROVIDER.sendTransaction(signedBackrun)).wait(1)
            console.log("admin back-ran", backrunRes.transactionHash)
        } catch (e) {
            console.error("failed to backrun", (e as Error).message)
        }
        console.log("balances", await getBalances())
    }

    const endBalance = await adminWallet.connect(PROVIDER).getBalance()
    console.log(`balance: ${utils.formatEther(endBalance)} ETH (spent ${utils.formatEther(startBalance.sub(endBalance))})`)
    
    const deploymentsSignedTxs = deployments ? Object.values(deployments)
        .map(d => d.signedDeployTx) : []
    const allSignedTxs = deploymentsSignedTxs.concat(signedTxs)
    if (allSignedTxs.length > 0) {
        const filename = shouldDeploy ? await getNewDeploymentFilename() : await getNewLiquidityFilename()
        await fs.writeFile(filename, JSON.stringify({deployments, allSignedTxs}), {encoding: "utf8"})
        console.log(`Setup complete. Check output at ${textColors.Bright}${filename}${textColors.Reset}`)
    }
}

main()
