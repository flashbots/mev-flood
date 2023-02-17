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
import { ETH, populateTxFully, randInRange } from '../helpers'
import { ContractDeployment, LiquidDeployment, loadDeployment, ILiquidDeployment } from '../liquid'
import { signSwap } from '../swap'

export interface LiquidParams {
    shouldApproveTokens?: boolean,
    shouldDeploy?: boolean,
    shouldBootstrapLiquidity?: boolean,
    shouldMintTokens?: boolean,
    shouldTestSwap?: boolean,
    wethMintAmountAdmin?: number,
    wethMintAmountUser?: number,
    numPairs?: number,
}

const liquid = async (params: LiquidParams, provider: providers.JsonRpcProvider, adminWallet: Wallet, userWallet: Wallet, deploymentFile: string | LiquidDeployment) => {
    // toggles for individual steps
    const defaultTrue = (value?: boolean) => {
        if (value === undefined) {
            return true
        } else {
            return value
        }
    }
    const shouldApproveTokens = defaultTrue(params.shouldApproveTokens)
    const shouldDeploy = defaultTrue(params.shouldDeploy)
    const shouldBootstrapLiquidity = defaultTrue(params.shouldBootstrapLiquidity)
    const shouldMintTokens = defaultTrue(params.shouldMintTokens)
    const shouldTestSwap = defaultTrue(params.shouldTestSwap)

    const overrides = { // TODO: rename
        from: adminWallet.address,
        chainId: provider.network.chainId,
    }

    const numPairs = params.numPairs || 1

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

    let daiAddrs: string[] = []
    let wethAddress: string
    let uniV2FactoryAddressA: string
    let uniV2FactoryAddressB: string
    let daiWethAddrsA: string[] = []
    let daiWethAddrsB: string[] = []
    let atomicSwapAddress: string
    // to be returned at end
    let deployment: LiquidDeployment | undefined = undefined // the contracts we will interact with
    let signedTxs: string[] = []

    // defined after we get contract addresses, either from new deployment or from file
    let getBalances: () => Promise<any>

    // deploy on local devnet
    if (shouldDeploy) {
        // erc20 tokens
        const daiDeployments: ContractDeployment[] = []
        for (let i = 0; i < numPairs; i++) {
            const dai = await getCloneDeployment(contracts.DAI, getAdminNonce(), [provider.network.chainId])
            daiAddrs.push(dai.contractAddress)
            daiDeployments.push(dai)
        }
        const weth = await getCloneDeployment(contracts.WETH, getAdminNonce()) // weth has no constructor args
        wethAddress = weth.contractAddress

        // uniswapv2 factories
        const uniV2FactoryA = await getCloneDeployment(contracts.UniV2Factory, getAdminNonce(), [adminWallet.address])
        const uniV2FactoryB = await getCloneDeployment(contracts.UniV2Factory, getAdminNonce(), [adminWallet.address])
        uniV2FactoryAddressA = uniV2FactoryA.contractAddress
        uniV2FactoryAddressB = uniV2FactoryB.contractAddress

        // custom router
        const atomicSwap = await getCloneDeployment(contracts.AtomicSwap, getAdminNonce(), [weth.contractAddress])
        atomicSwapAddress = atomicSwap.contractAddress
        console.log("deploying base contracts: DAI, WETH, uniswapV2factory...")

        deployment = new LiquidDeployment({
            dai: daiDeployments,    // erc20
            weth,                   // erc20
            uniV2FactoryA,          // univ2 factory (creates univ2 pairs)
            uniV2FactoryB,          // univ2 factory (creates univ2 pairs)
            atomicSwap,             // custom router
        })

        // deploy contracts we have so far
        let signedDeployments = deployment.getDeploymentTransactions()
        const deployPromises = signedDeployments.map(tx => provider.sendTransaction(tx))
        const deployResults = await Promise.all(deployPromises)
        await Promise.all(deployResults.map(r => r.wait()))

        // build & send pair deployments
        let daiWethDeploymentsA = []
        let daiWethDeploymentsB = []
        for (let i = 0; i < numPairs; i++) {
            const daiAddress = daiAddrs[i]
            const daiWethA = await getPairDeployment(uniV2FactoryAddressA, daiAddress, wethAddress, getAdminNonce())
            daiWethAddrsA.push(daiWethA.contractAddress)
            daiWethDeploymentsA.push(daiWethA)

            const daiWethB = await getPairDeployment(uniV2FactoryAddressB, daiAddress, wethAddress, getAdminNonce())
            daiWethAddrsB.push(daiWethB.contractAddress)
            daiWethDeploymentsB.push(daiWethB)
        }

        const pairDeployments = daiWethDeploymentsA.concat(daiWethDeploymentsB)
        let pairHandles = (await Promise.all(pairDeployments.map(deployment => {
            console.log("deploying pair...")
            return provider.sendTransaction(deployment.signedDeployTx)
        }))).map(pendingTx => pendingTx.wait(1));
        await Promise.all(pairHandles);

        console.log("pairs deployed")
        let appendix = {
            daiWethA: daiWethDeploymentsA,
            daiWethB: daiWethDeploymentsB,
        }
        deployment.update(appendix)
    } else { // read contracts from disk
        deployment = (deploymentFile instanceof String) ? await loadDeployment({filename: deploymentFile as string}) : deploymentFile as LiquidDeployment
        daiAddrs = deployment.dai.map(d => d.contractAddress)
        wethAddress = deployment.weth.contractAddress
        daiWethAddrsA = deployment.daiWethA?.map(d => d.contractAddress) || []
        daiWethAddrsB = deployment.daiWethB?.map(d => d.contractAddress) || []
        uniV2FactoryAddressA = deployment.uniV2FactoryA.contractAddress
        uniV2FactoryAddressB = deployment.uniV2FactoryB.contractAddress
        atomicSwapAddress = deployment.atomicSwap.contractAddress
        console.log("contract addrs", {
            daiAddrs,
            wethAddress,
            daiWethAddrsA,
            daiWethAddrsB,
            uniV2FactoryAddressA,
            uniV2FactoryAddressB,
            atomicSwapAddress,
        })
    }

    const wethContract = new Contract(wethAddress, contracts.WETH.abi).connect(provider)
    const daiContracts = daiAddrs.map(addr => new Contract(addr, contracts.DAI.abi).connect(provider))
    const uniV2FactoryContractA = new Contract(uniV2FactoryAddressA, contracts.UniV2Factory.abi).connect(provider)
    const uniV2FactoryContractB = new Contract(uniV2FactoryAddressB, contracts.UniV2Factory.abi).connect(provider)
    const atomicSwapContract = new Contract (atomicSwapAddress, contracts.AtomicSwap.abi).connect(provider)
    const daiWethPairContractsA = daiWethAddrsA.map(addr => new Contract(addr, contracts.UniV2Pair.abi).connect(provider))
    const daiWethPairContractsB = daiWethAddrsB.map(addr => new Contract(addr, contracts.UniV2Pair.abi).connect(provider))

    getBalances = async () => {
        /** returns `true` if token0 of pair is WETH. */
        const isWeth0 = async (pair: Contract) => {
            const token0: string = await pair.token0()
            return token0.toLowerCase() === wethAddress.toLowerCase()
        }

        const daiBalances = async (of: string) => {
            return await Promise.all(daiContracts.map(daiContract => daiContract.balanceOf(of)))
        }
        const reservesDaiWeth_A = await Promise.all(daiWethPairContractsA.map(contract => contract.getReserves()))
        const reservesDaiWeth_B = await Promise.all(daiWethPairContractsB.map(contract => contract.getReserves()))
        console.log("reservesA", reservesDaiWeth_A)
        const emptyA = (idx: number) => (reservesDaiWeth_A[idx][0] as BigNumber).lte(0) || (reservesDaiWeth_A[idx][1] as BigNumber).lte(0)
        const emptyB = (idx: number) => (reservesDaiWeth_B[idx][0] as BigNumber).lte(0) || (reservesDaiWeth_B[idx][1] as BigNumber).lte(0)
        console.log("emptyA", emptyA(0))
        console.log("emptyB", emptyB(0))

        return {
            admin: {
                weth: utils.formatEther(await wethContract.balanceOf(adminWallet.address)),
                dai: await daiBalances(adminWallet.address),
            },
            user: {
                weth: utils.formatEther(await wethContract.balanceOf(userWallet.address)),
                dai: await daiBalances(userWallet.address),
            },
            swapContract: {
                weth: utils.formatEther(await wethContract.balanceOf(atomicSwapAddress)),
                dai: await daiBalances(atomicSwapAddress),
            },
            pricesPerWeth: {
                dai_Univ2_A: await Promise.all(daiWethPairContractsA.map(async (pair, idx) => emptyA(idx) ? BigNumber.from(0) : utils.formatEther(await isWeth0(pair) ?
                    (reservesDaiWeth_A[idx][1].mul(ETH)).div(reservesDaiWeth_A[idx][0] > 0 ? reservesDaiWeth_A[idx][0] : 1) : // price if token0 is WETH
                    (reservesDaiWeth_A[idx][0].mul(ETH)).div(reservesDaiWeth_A[idx][1] > 0 ? reservesDaiWeth_A[idx][1] : 1)))), // price if token0 is _not_ WETH
                dai_Univ2_B: await Promise.all(daiWethPairContractsB.map(async (pair, idx) => emptyB(idx) ? BigNumber.from(0) : utils.formatEther(await isWeth0(pair) ?
                    (reservesDaiWeth_B[idx][1].mul(ETH)).div(reservesDaiWeth_B[idx][0] > 0 ? reservesDaiWeth_B[idx][0] : 1) : // price if token0 is WETH
                    (reservesDaiWeth_B[idx][0].mul(ETH)).div(reservesDaiWeth_B[idx][1] > 0 ? reservesDaiWeth_B[idx][1] : 1)))), // price if token0 is _not_ WETH
            },
        }
    }

    if (shouldMintTokens) {
        const adminMintAmount = params.wethMintAmountAdmin !== undefined ? BigNumber.from(params.wethMintAmountAdmin) : undefined
        const userMintAmount = params.wethMintAmountUser !== undefined ? BigNumber.from(params.wethMintAmountUser) : undefined
        const WETH_ADMIN_MINT_AMOUNT = ETH.mul(adminMintAmount || 2500)
        const WETH_USER_MINT_AMOUNT = ETH.mul(userMintAmount || 500)
        const DAI_ADMIN_MINT_AMOUNT = WETH_ADMIN_MINT_AMOUNT.div(100).mul(90).mul(1300) // 90% 0f WETH will be paired w/ DAI @ 1300 DAI/WETH
        const DAI_USER_MINT_AMOUNT = ETH.mul(50000) // always mint 50k DAI for user

        for (const dai of daiContracts) {
            // mint DAI for admin
            let signedTx = await adminWallet.signTransaction(populateTxFully(
                await dai.populateTransaction.mint(
                    adminWallet.address, DAI_ADMIN_MINT_AMOUNT
                ),
                getAdminNonce(),
                overrides
                
            ))
            signedTxs.push(signedTx)
            console.log(`minting DAI for admin ${adminWallet.address}...`)
            await (await provider.sendTransaction(signedTx)).wait(1)

            // mint DAI for user
            signedTx = await adminWallet.signTransaction(populateTxFully(
                await dai.populateTransaction.mint(
                    userWallet.address, DAI_USER_MINT_AMOUNT
                ),
                getAdminNonce(),
                overrides
            ))
            signedTxs.push(signedTx)
            console.log(`minting DAI for user ${userWallet.address}...`)
            await (await provider.sendTransaction(signedTx)).wait(1)
        }

        // mint WETH for admin
        if (WETH_ADMIN_MINT_AMOUNT.gt(0)) {
            const signedTx = await adminWallet.signTransaction(populateTxFully({
                value: WETH_ADMIN_MINT_AMOUNT,
                to: wethAddress,
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
            const signedTx = await userWallet.signTransaction(populateTxFully({
                value: WETH_USER_MINT_AMOUNT,
                to: wethAddress,
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
            ...daiContracts,
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
        // if `params.wethMintAmountAdmin` was specified, mint 40% of admin's weth (twice, once for each pair)
        // otherwise mint 1000 WETH
        const WETH_DEPOSIT_AMOUNT = params.wethMintAmountAdmin ? ETH.mul(params.wethMintAmountAdmin).div(100).mul(40) : ETH.mul(1000)
        const DAI_DEPOSIT_AMOUNT = WETH_DEPOSIT_AMOUNT.mul(1300) // price 1300 DAI/WETH

        // deposit liquidity into WETH/DAI pairs
        // TODO: this should be a router function
        const pairContracts = [...daiWethPairContractsA, ...daiWethPairContractsB]
        for (const pairContract of pairContracts) {
            let token0 = await pairContract.callStatic.token0()
            let daiAddr = token0.toLowerCase() === deployment.weth.contractAddress.toLowerCase() ? await pairContract.callStatic.token1() : token0
            const daiContract = new Contract(daiAddr, contracts.DAI.abi)

            let signedTx = await adminWallet.signTransaction( // deposit WETH into pair
                populateTxFully(
                    await wethContract.populateTransaction.transfer(pairContract.address, WETH_DEPOSIT_AMOUNT),
                    getAdminNonce(),
                    overrides
                )
            )
            signedTxs.push(signedTx)
            console.log(`depositing WETH into pair...`)
            await (await provider.sendTransaction(signedTx)).wait(1)

            signedTx = await adminWallet.signTransaction( // deposit DAI into pair
                populateTxFully(
                    await daiContract.populateTransaction.transfer(pairContract.address, DAI_DEPOSIT_AMOUNT),
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
        // swap 1/1000 of user's (or 50 if unspecified) WETH for DAI on Uni_A
        const amountIn = params.wethMintAmountUser ? ETH.mul(params.wethMintAmountUser).div(1000) : ETH.mul(50)
        const daiAddress = daiAddrs[randInRange(0, daiAddrs.length)]
        const path = [wethAddress, daiAddress]

        try {
            // use custom router to swap
            const signedSwap = await signSwap(atomicSwapContract, uniV2FactoryContractA.address, userWallet, amountIn, path, getUserNonce(), overrides.chainId)
            const swapRes = await (await provider.sendTransaction(signedSwap)).wait(1)
            console.log("user swapped", swapRes.transactionHash)
            console.log("balances", await getBalances())
        } catch (e) {
            console.error("failed to swap", e)
        }
        try {
            const daiWethPairA = await uniV2FactoryContractA.callStatic.getPair(...path)
            const pairContractA = new Contract(daiWethPairA, contracts.UniV2Pair.abi, provider)
            const daiWethPairB = await uniV2FactoryContractB.callStatic.getPair(...path)
            const pairContractB = new Contract(daiWethPairB, contracts.UniV2Pair.abi, provider)
            const reservesA: BigNumber[] = (await pairContractA.callStatic.getReserves()).slice(0,2)
            const reservesB: BigNumber[] = (await pairContractB.callStatic.getReserves()).slice(0,2)

            const priceHigherOnA = reservesA[0].div(reservesA[1]).gt(reservesB[0].div(reservesB[1]))
            const startFactory = priceHigherOnA ? uniV2FactoryAddressA : uniV2FactoryAddressB
            const endFactory = priceHigherOnA ? uniV2FactoryAddressB : uniV2FactoryAddressA

            // backrun it
            const signedBackrun = await adminWallet.signTransaction(
                populateTxFully(
                    await atomicSwapContract.populateTransaction.backrun(
                        daiAddress, // token we're going to buy and sell
                        startFactory, // factory of pair we'll buy token from
                        endFactory, // factory of pair we'll sell token to
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

    // concat mints, deposits to contract deployments
    const deploymentsSignedTxs = deployment.getDeploymentTransactions()
    const allSignedTxs = deploymentsSignedTxs.concat(signedTxs)
    deployment.update({}, allSignedTxs)

    return deployment
}


export default liquid
