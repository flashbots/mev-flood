import { 
    ContractFactory,
    Contract,
    utils,
    BigNumber,
    constants,
    providers,
    Wallet
} from "ethers"
import { formatEther } from 'ethers/lib/utils'

// lib
import contracts, { ContractSpec } from "../contracts"
import { ETH, populateTxFully } from '../helpers'
import { ContractDeployment, Deployments, getDeployment } from '../liquid'
import { signSwap } from '../swap'

export interface LiquidOptions {
    shouldApproveTokens?: boolean,
    shouldDeploy?: boolean,
    shouldBootstrapLiquidity?: boolean,
    shouldMintTokens?: boolean,
    shouldTestSwap?: boolean,
    wethMintAmountAdmin?: number,
    wethMintAmountUser?: number,
}

const liquid = async (options: LiquidOptions, provider: providers.JsonRpcProvider, adminWallet: Wallet, userWallet: Wallet, deploymentFile: string | Deployments) => {
    // toggles for individual steps
    const defaultTrue = (value?: boolean) => {
        if (value === undefined) {
            return true
        } else {
            return value
        }
    }
    const shouldApproveTokens = defaultTrue(options.shouldApproveTokens)
    const shouldDeploy = defaultTrue(options.shouldDeploy)
    const shouldBootstrapLiquidity = defaultTrue(options.shouldBootstrapLiquidity)
    const shouldMintTokens = defaultTrue(options.shouldMintTokens)
    const shouldTestSwap = defaultTrue(options.shouldTestSwap)

    const overrides = { // TODO: rename
        from: adminWallet.address,
        chainId: provider.network.chainId,
    }

    /** Get signed tx to deploy a generic contract clone, as well as the address it will be deployed at.*/
    const getCloneDeployment = async (contract: ContractSpec, nonce: number, args?: any[]): Promise<ContractDeployment> => {
        if (!contract.abi || !contract.bytecode) {
            console.error(`failed to build contract\nabi: ${contract.abi}\nbytecode: ${contract.bytecode}`)
            process.exit(1)
        }
        const factory = new ContractFactory(JSON.stringify(contract.abi), contract.bytecode)
        const txReq = populateTxFully(args ? factory.getDeployTransaction(...args) : factory.getDeployTransaction(), 
            nonce, 
            overrides
        )
        return {
            contractAddress: utils.getContractAddress({from: txReq.from || adminWallet.address, nonce}),
            deployTx: txReq,
            signedDeployTx: await adminWallet.signTransaction(txReq),
        }
    }

    const getPairDeployment = async (factoryAddress: string, token1Address: string, token2Address: string, nonce: number): Promise<ContractDeployment> => {
        const factoryContract = await new Contract(factoryAddress, contracts.UniV2Factory.abi)
        const txReq = populateTxFully(await factoryContract.populateTransaction.createPair(token1Address, token2Address), 
            nonce,
            overrides
        )
        const signedTx = await adminWallet.signTransaction(txReq)
        const contractAddress = await factoryContract.connect(provider).callStatic.createPair(token1Address, token2Address)

        return {
            contractAddress,
            deployTx: txReq,
            signedDeployTx: signedTx,
        }
    }

    adminWallet = adminWallet.connect(provider)
    userWallet = userWallet.connect(provider)
    const startBalance = await adminWallet.connect(provider).getBalance()
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
        let dai = await getCloneDeployment(contracts.DAI, getAdminNonce(), [overrides.chainId])
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
            await (await provider.sendTransaction(deployment.signedDeployTx)).wait(1)
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
            await (await provider.sendTransaction(deployment.signedDeployTx)).wait(1)
            console.log("OK.")
        }
        deployments = {
            ...deployments,
            dai_weth_A,
            dai_weth_B,
        }
    } else { // read contracts from `output/${NODE_ENV}/uniDeployment${X}.json`
        const deployments: Deployments = (deploymentFile instanceof String) ? (await getDeployment({filename: deploymentFile as string})).deployments : deploymentFile as Deployments
        addr_dai = deployments.dai.contractAddress
        addr_weth = deployments.weth.contractAddress
        addr_dai_weth_A = deployments.dai_weth_A?.contractAddress || ''
        addr_dai_weth_B = deployments.dai_weth_B?.contractAddress || ''
        addr_uniV2Factory_A = deployments.uniV2Factory_A.contractAddress
        addr_uniV2Factory_B = deployments.uniV2Factory_B.contractAddress
        addr_atomicSwap = deployments.atomicSwap.contractAddress
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

    const wethContract = new Contract(addr_weth, contracts.WETH.abi).connect(provider)
    const daiContract = new Contract(addr_dai, contracts.DAI.abi).connect(provider)
    const uniV2FactoryContract_A = new Contract(addr_uniV2Factory_A, contracts.UniV2Factory.abi).connect(provider)
    const uniV2FactoryContract_B = new Contract(addr_uniV2Factory_B, contracts.UniV2Factory.abi).connect(provider)
    const atomicSwapContract = new Contract (addr_atomicSwap, contracts.AtomicSwap.abi).connect(provider)
    const daiWethPair_A = new Contract(addr_dai_weth_A, contracts.UniV2Pair.abi).connect(provider)
    const daiWethPair_B = new Contract(addr_dai_weth_B, contracts.UniV2Pair.abi).connect(provider)

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
        const adminMintAmount = options.wethMintAmountAdmin !== undefined ? BigNumber.from(options.wethMintAmountAdmin) : undefined
        const userMintAmount = options.wethMintAmountUser !== undefined ? BigNumber.from(options.wethMintAmountUser) : undefined
        const WETH_ADMIN_MINT_AMOUNT = ETH.mul(adminMintAmount || 2500)
        const WETH_USER_MINT_AMOUNT = ETH.mul(userMintAmount || 500)
        const DAI_ADMIN_MINT_AMOUNT = WETH_ADMIN_MINT_AMOUNT.div(100).mul(90).mul(1300) // 90% 0f WETH will be paired w/ DAI @ 1300 DAI/WETH
        const DAI_USER_MINT_AMOUNT = ETH.mul(50000) // always mint 50k DAI for user

        // mint DAI for admin
        if (DAI_ADMIN_MINT_AMOUNT.gt(0)) {
            let signedTx = await adminWallet.signTransaction(populateTxFully(
                await daiContract.populateTransaction.mint(
                    adminWallet.address, DAI_ADMIN_MINT_AMOUNT
                ),
                getAdminNonce(),
                overrides
            ))
            signedTxs.push(signedTx)
            console.log(`minting ${formatEther(DAI_ADMIN_MINT_AMOUNT)} DAI for admin ${adminWallet.address}...`)
            await (await provider.sendTransaction(signedTx)).wait(1)
        }

        // mint DAI for user
        if (DAI_USER_MINT_AMOUNT.gt(0)) {
            let signedTx = await adminWallet.signTransaction(populateTxFully(
                await daiContract.populateTransaction.mint(
                    userWallet.address, DAI_USER_MINT_AMOUNT
                ),
                getAdminNonce(),
                overrides
            ))
            signedTxs.push(signedTx)
            console.log(`minting ${formatEther(DAI_USER_MINT_AMOUNT)} DAI for user ${userWallet.address}...`)
            await (await provider.sendTransaction(signedTx)).wait(1)
        }

        // mint WETH for admin
        if (WETH_ADMIN_MINT_AMOUNT.gt(0)) {
            let signedTx = await adminWallet.signTransaction(populateTxFully({
                value: WETH_ADMIN_MINT_AMOUNT,
                to: addr_weth,
                data: "0xd0e30db0" // deposit
            },
                getAdminNonce(),
                overrides
            ))
            signedTxs.push(signedTx)
            console.log(`minting ${formatEther(WETH_ADMIN_MINT_AMOUNT)} WETH for admin ${adminWallet.address}...`)
            await (await provider.sendTransaction(signedTx)).wait(1)
        }

        // mint WETH for user
        if (WETH_USER_MINT_AMOUNT.gt(0)) {
            let signedTx = await userWallet.signTransaction(populateTxFully({
                value: WETH_USER_MINT_AMOUNT,
                to: addr_weth,
                data: "0xd0e30db0" // deposit
            }, 
                getUserNonce(), 
                {from: userWallet.address, chainId: overrides.chainId}
            ))
            signedTxs.push(signedTx)
            console.log(`minting ${formatEther(WETH_USER_MINT_AMOUNT)} WETH for user ${userWallet.address}...`)
            await (await provider.sendTransaction(signedTx)).wait(1)
        }

        console.log("balances", await getBalances())
    }

    if (shouldApproveTokens) {
        const getApproveTx = async (token: Contract, spender: string, owner: Wallet) => {
            const signedTx = await owner.signTransaction(
                populateTxFully(
                    await token.populateTransaction.approve(spender, constants.MaxUint256),
                    owner.address == adminWallet.address ? getAdminNonce() : getUserNonce(),
                    {from: owner.address, chainId: overrides.chainId}
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
                console.log("approved", (await (await provider.sendTransaction(signedTx)).wait(1)).transactionHash)
            }
        }
    }

    if (shouldBootstrapLiquidity) {
        // if `options.wethMintAmountAdmin` was specified, mint 40% of admin's weth (twice, once for each pair)
        // otherwise mint 1000 WETH
        const WETH_DEPOSIT_AMOUNT = options.wethMintAmountAdmin ? ETH.mul(options.wethMintAmountAdmin).div(100).mul(40) : ETH.mul(1000)
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
                    getAdminNonce(),
                    overrides
                )
            )
            signedTxs.push(signedTx)
            console.log(`depositing WETH into pair...`)
            await (await provider.sendTransaction(signedTx)).wait(1)

            signedTx = await adminWallet.signTransaction( // deposit DAI into pair
                populateTxFully(
                    await daiContract.populateTransaction.transfer(pairAddr, DAI_DEPOSIT_AMOUNT),
                    getAdminNonce(),
                    overrides
                )
            )
            signedTxs.push(signedTx)
            console.log(`depositing DAI into pair...`)
            await (await provider.sendTransaction(signedTx)).wait(1)

            signedTx = await adminWallet.signTransaction( // mint LP tokens
                populateTxFully(
                    await pairContract.populateTransaction.mint(adminWallet.address),
                    getAdminNonce(),
                    overrides
                )
            )
            signedTxs.push(signedTx)
            console.log(`minting LP tokens...`)
            await (await provider.sendTransaction(signedTx)).wait(1)
        }        

        console.log("balances", await getBalances())
    }
    
    if (shouldTestSwap) {
        // swap 1/100 of user's (or 50 if unspecified) WETH for DAI on Uni_A
        const amountIn = options.wethMintAmountUser ? ETH.mul(options.wethMintAmountUser).div(100) : ETH.mul(50)
        const path = [addr_weth, addr_dai]

        try {
            // use custom router to swap
            const signedSwap = await signSwap(atomicSwapContract, uniV2FactoryContract_A.address, userWallet, amountIn, path, getUserNonce(), overrides.chainId)
            const swapRes = await (await provider.sendTransaction(signedSwap)).wait(1)
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
                    overrides
                )
            )
            const backrunRes = await (await provider.sendTransaction(signedBackrun)).wait(1)
            console.log("admin back-ran", backrunRes.transactionHash)
        } catch (e) {
            console.error("failed to backrun", (e as Error).message)
        }
        console.log("balances", await getBalances())
    }

    const endBalance = await adminWallet.connect(provider).getBalance()
    console.log(`balance: ${utils.formatEther(endBalance)} ETH (spent ${utils.formatEther(startBalance.sub(endBalance))})`)
    
    const deploymentsSignedTxs = deployments ? Object.values(deployments)
        .map(d => d.signedDeployTx) : []
    const allSignedTxs = deploymentsSignedTxs.concat(signedTxs)

    return {
        allSignedTxs,
        deployments,
    }
}


export default liquid
