import { Semaphore } from 'async-mutex'
import { 
    ContractFactory,
    Contract,
    utils,
    constants,
    providers,
    Wallet,
    BigNumber
} from "ethers"
import { formatEther, parseEther } from 'ethers/lib/utils'

// lib
import contracts, { ContractSpec } from "../contracts"
import { computeUniV2PairAddress, ETH, GWEI, populateTxFully, sortTokens } from '../helpers'
import { ContractDeployment, LiquidDeployment, loadDeployment } from '../liquid'

export interface LiquidParams {
    shouldApproveTokens?: boolean,
    shouldDeploy?: boolean,
    shouldBootstrapLiquidity?: boolean,
    shouldMintTokens?: boolean,
    wethMintAmountAdmin?: number,
    wethMintAmountUser?: number,
    numPairs?: number,
}

const generateLiquidDeployment = async (params: LiquidParams, provider: providers.JsonRpcProvider, adminWallet: Wallet, userWallet: Wallet, deploymentFile: string | LiquidDeployment) => {
    // toggles for individual steps
    const defaultTrue = (value?: boolean) => {
        if (value === undefined) {
            return true
        } else {
            return value
        }
    }
    // parse args, set defaults
    const shouldApproveTokens = defaultTrue(params.shouldApproveTokens)
    const shouldDeploy = defaultTrue(params.shouldDeploy)
    const shouldBootstrapLiquidity = defaultTrue(params.shouldBootstrapLiquidity)
    const shouldMintTokens = defaultTrue(params.shouldMintTokens)
    const numPairs = params.numPairs || 1
    // have to explicitly check for undefined because 0 is falsy
    const adminMintAmount = params.wethMintAmountAdmin !== undefined ? parseEther(params.wethMintAmountAdmin.toString()) : undefined
    const userMintAmount = params.wethMintAmountUser !== undefined ? parseEther(params.wethMintAmountUser.toString()) : undefined

    const feeData = await provider.getFeeData()
    const overrides = {
        from: adminWallet.address,
        chainId: provider.network.chainId,
        type: 2,
        maxFeePerGas: feeData.maxFeePerGas || GWEI.mul(42),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || GWEI.mul(2),
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

    const getPairDeployment = async (factoryAddress: string, tokenA: string, tokenB: string, nonce: number): Promise<ContractDeployment> => {
        const factoryContract = await new Contract(factoryAddress, contracts.UniV2Factory.abi)

        const txReq = populateTxFully(await factoryContract.populateTransaction.createPair(tokenA, tokenB),
            nonce,
            overrides
        )
        const signedTx = await adminWallet.signTransaction(txReq)
        const contractAddress = await computeUniV2PairAddress(factoryAddress, tokenA, tokenB)

        return {
            contractAddress,
            deployTx: txReq,
            signedDeployTx: signedTx,
        }
    }

    adminWallet = adminWallet.connect(provider)
    userWallet = userWallet.connect(provider)

    let adminNonce = new Semaphore(await adminWallet.getTransactionCount())
    let userNonce = new Semaphore(await userWallet.getTransactionCount())
    const getAdminNonce = async () => {
        const currentNonce = await adminNonce.getValue()
        adminNonce.setValue(currentNonce + 1)
        return currentNonce
    }
    const getUserNonce = async () => {
        const currentNonce = await userNonce.getValue()
        userNonce.setValue(currentNonce + 1)
        return currentNonce
    }

    let daiAddrs: string[] = []
    let wethAddress: string
    let uniV2FactoryAddressA: string
    let uniV2FactoryAddressB: string
    let daiWethAddrsA: string[] = []
    let daiWethAddrsB: string[] = []
    let atomicSwapAddress: string
    // defined after we get contract addresses, either from new deployment or from file
    let deployment: LiquidDeployment | undefined = undefined
    let signedTxs: string[] = []

    // deploy on local devnet
    if (shouldDeploy) {
        // erc20 tokens
        const daiDeployments: ContractDeployment[] = []
        for (let i = 0; i < numPairs; i++) {
            console.log(`deploying DAI${numPairs > 1 ? i+1 : ''} contract`)
            const dai = await getCloneDeployment(contracts.DAI, await getAdminNonce(), [provider.network.chainId])
            daiAddrs.push(dai.contractAddress)
            daiDeployments.push(dai)
        }
        const weth = await getCloneDeployment(contracts.WETH, await getAdminNonce()) // weth has no constructor args
        wethAddress = weth.contractAddress

        // uniswapv2 factories
        const uniV2FactoryA = await getCloneDeployment(contracts.UniV2Factory, await getAdminNonce(), [adminWallet.address])
        const uniV2FactoryB = await getCloneDeployment(contracts.UniV2Factory, await getAdminNonce(), [adminWallet.address])
        uniV2FactoryAddressA = uniV2FactoryA.contractAddress
        uniV2FactoryAddressB = uniV2FactoryB.contractAddress

        // custom router
        const atomicSwap = await getCloneDeployment(contracts.AtomicSwap, await getAdminNonce(), [weth.contractAddress])
        atomicSwapAddress = atomicSwap.contractAddress
        console.log("deploying base contracts: DAI, WETH, uniswapV2factory...")

        deployment = new LiquidDeployment({
            dai: daiDeployments,    // erc20
            weth,                   // erc20
            uniV2FactoryA,          // univ2 factory (creates univ2 pairs)
            uniV2FactoryB,          // univ2 factory (creates univ2 pairs)
            atomicSwap,             // custom router
        })

        // pair deployments
        let daiWethDeploymentsA = []
        let daiWethDeploymentsB = []
        for (let i = 0; i < numPairs; i++) {
            const daiAddress = daiAddrs[i]
            const daiWethA = await getPairDeployment(uniV2FactoryAddressA, daiAddress, wethAddress, await getAdminNonce())
            daiWethAddrsA.push(daiWethA.contractAddress)
            daiWethDeploymentsA.push(daiWethA)

            const daiWethB = await getPairDeployment(uniV2FactoryAddressB, daiAddress, wethAddress, await getAdminNonce())
            daiWethAddrsB.push(daiWethB.contractAddress)
            daiWethDeploymentsB.push(daiWethB)
        }

        let appendix = {
            daiWethA: daiWethDeploymentsA,
            daiWethB: daiWethDeploymentsB,
        }
        deployment.update(appendix)
    } else {
        // read contracts from disk
        deployment = (deploymentFile instanceof String) ? await loadDeployment({filename: deploymentFile as string}) : deploymentFile as LiquidDeployment
        daiAddrs = deployment.dai.map(d => d.contractAddress)
        wethAddress = deployment.weth.contractAddress
        daiWethAddrsA = deployment.daiWethA?.map(d => d.contractAddress) || []
        daiWethAddrsB = deployment.daiWethB?.map(d => d.contractAddress) || []
        uniV2FactoryAddressA = deployment.uniV2FactoryA.contractAddress
        uniV2FactoryAddressB = deployment.uniV2FactoryB.contractAddress
        atomicSwapAddress = deployment.atomicSwap.contractAddress
    }

    const wethContract = new Contract(wethAddress, contracts.WETH.abi)
    const daiContracts = daiAddrs.map(addr => new Contract(addr, contracts.DAI.abi))
    const atomicSwapContract = new Contract (atomicSwapAddress, contracts.AtomicSwap.abi)
    const daiWethPairContractsA = daiWethAddrsA.map(addr => new Contract(addr, contracts.UniV2Pair.abi))
    const daiWethPairContractsB = daiWethAddrsB.map(addr => new Contract(addr, contracts.UniV2Pair.abi))

    if (shouldMintTokens) {
        // assign defaults if amounts were not specified
        const WETH_ADMIN_MINT_AMOUNT = adminMintAmount || ETH.mul(2500)
        const WETH_USER_MINT_AMOUNT = userMintAmount || ETH.mul(500)
        // 90% of admin's WETH will be paired w/ DAI @ 1300 DAI/WETH
        const DAI_ADMIN_MINT_AMOUNT = WETH_ADMIN_MINT_AMOUNT.div(100).mul(90).mul(1300)
        // always mint 50k DAI for user
        const DAI_USER_MINT_AMOUNT = ETH.mul(50000)

        for (const dai of daiContracts) {
            // mint DAI for admin
            let signedTx = await adminWallet.signTransaction(populateTxFully(
                await dai.populateTransaction.mint(
                    adminWallet.address, DAI_ADMIN_MINT_AMOUNT
                ),
                await getAdminNonce(),
                overrides
                
            ))
            signedTxs.push(signedTx)
            console.log(`minting DAI for admin ${adminWallet.address}...`)

            // mint DAI for user
            signedTx = await adminWallet.signTransaction(populateTxFully(
                await dai.populateTransaction.mint(
                    userWallet.address, DAI_USER_MINT_AMOUNT
                ),
                await getAdminNonce(),
                overrides
            ))
            signedTxs.push(signedTx)
            console.log(`minting DAI for user ${userWallet.address}...`)
        }

        // mint WETH for admin
        if (WETH_ADMIN_MINT_AMOUNT.gt(0)) {
            const signedTx = await adminWallet.signTransaction(populateTxFully({
                value: WETH_ADMIN_MINT_AMOUNT,
                to: wethAddress,
                data: "0xd0e30db0" // deposit
            },
                await getAdminNonce(),
                overrides
            ))
            signedTxs.push(signedTx)
            console.log(`minting ${formatEther(WETH_ADMIN_MINT_AMOUNT)} WETH for admin ${adminWallet.address}...`)
        }

        // mint WETH for user
        if (WETH_USER_MINT_AMOUNT.gt(0)) {
            const signedTx = await userWallet.signTransaction(populateTxFully({
                value: WETH_USER_MINT_AMOUNT,
                to: wethAddress,
                data: "0xd0e30db0" // deposit
            }, 
                await getUserNonce(),
                {from: userWallet.address, chainId: overrides.chainId}
            ))
            signedTxs.push(signedTx)
            console.log(`minting ${formatEther(WETH_USER_MINT_AMOUNT)} WETH for user ${userWallet.address}...`)
        }
    }

    if (shouldApproveTokens) {
        const getApproveTx = async (token: Contract, spender: string, owner: Wallet) => {
            const signedTx = await owner.signTransaction(
                populateTxFully(
                    await token.populateTransaction.approve(spender, constants.MaxUint256),
                    owner.address.toLowerCase() === adminWallet.address.toLocaleLowerCase() ?
                        await getAdminNonce() :
                        await getUserNonce(),
                    {from: owner.address, chainId: overrides.chainId}
                )
            )
            return signedTx
        }
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
                console.log(`approving atomicSwap to spend token ${token.address} on behalf of ${wallet.address}`)
                const signedTx = await getApproveTx(token, atomicSwapContract.address, wallet)
                signedTxs.push(signedTx)
            }
        }
    }

    if (shouldBootstrapLiquidity) {
        // if `params.wethMintAmountAdmin` was specified, mint 40% of admin's weth (per pair, per exchange)
        // otherwise mint 1000 WETH
        const WETH_DEPOSIT_AMOUNT = adminMintAmount?.div(100).mul(40/numPairs) || ETH.mul(1000/numPairs)
        const DAI_DEPOSIT_AMOUNT = WETH_DEPOSIT_AMOUNT.mul(1300) // price 1300 DAI/WETH

        // deposit liquidity into WETH/DAI pairs
        const pairContracts = [...daiWethPairContractsA, ...daiWethPairContractsB]
        let daiIdx = 0
        for (const pairContract of pairContracts) {
            const tokenA = wethAddress
            const tokenB = daiAddrs[daiIdx % (pairContracts.length / 2)]
            const {token0, token1} = sortTokens(tokenA, tokenB)
            const daiAddr = token0.toLowerCase() === deployment.weth.contractAddress.toLowerCase() ? token1 : token0
            const daiContract = new Contract(daiAddr, contracts.DAI.abi)

            // deposit WETH into pair
            let signedTx = await adminWallet.signTransaction(
                populateTxFully(
                    await wethContract.populateTransaction.transfer(pairContract.address, WETH_DEPOSIT_AMOUNT),
                    await getAdminNonce(),
                    overrides
                )
            )
            signedTxs.push(signedTx)
            console.log(`depositing WETH into pair...`)

            // deposit DAI into pair
            signedTx = await adminWallet.signTransaction(
                populateTxFully(
                    await daiContract.populateTransaction.transfer(pairContract.address, DAI_DEPOSIT_AMOUNT),
                    await getAdminNonce(),
                    overrides
                )
            )
            signedTxs.push(signedTx)
            console.log(`depositing DAI into pair...`)

            // mint LP tokens
            signedTx = await adminWallet.signTransaction(
                populateTxFully(
                    await pairContract.populateTransaction.mint(adminWallet.address),
                    await getAdminNonce(),
                    overrides
                )
            )
            signedTxs.push(signedTx)
            console.log(`minting LP tokens...`)
            daiIdx++
        }
    }

    // concat mints + deposits to contract deployments
    const deploymentsSignedTxs = deployment.getDeploymentTransactions()
    const allSignedTxs = deploymentsSignedTxs.concat(signedTxs)
    deployment.update({}, allSignedTxs)

    return deployment
}


export default generateLiquidDeployment
