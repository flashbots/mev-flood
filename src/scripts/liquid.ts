import readline from "readline-sync"

// lib
import { getDeployUniswapV2Args } from '../lib/cliArgs';
import env from '../lib/env';
import { PROVIDER } from '../lib/providers';
import { getExistingDeploymentFilename, getNewDeploymentFilename, getNewLiquidityFilename } from '../lib/liquid';
import { getAdminWallet, getTestWallet } from '../lib/wallets';
import {LiquidParams} from '../lib/scripts';
import MevFlood from '..';

/** Prints txs:
 * build a set of contracts to deploy,
 * create univ2 pools,
 * bootstrap w/ liquidity
 * 
 * all txs are signed with the account specified by ADMIN_PRIVATE_KEY in .env
*/
const main = async () => {
    const args = getDeployUniswapV2Args()

    try {
        await PROVIDER.getBlockNumber()
    } catch (e) {
        console.error(`failed to connect to ${env.RPC_URL}.`)
        process.exit(1)
    }
    
    const adminWallet = getAdminWallet().connect(PROVIDER)
    const userWallet = getTestWallet().connect(PROVIDER)
    
    let adminNonce = await adminWallet.getTransactionCount()
    if (adminNonce != 0 && !args.autoAccept) {
        console.warn(`Your admin account nonce is currently ${adminNonce}.`)
        readline.question("press Enter to continue...")
    }
    const deploymentFile = await getExistingDeploymentFilename()
    const flood = await new MevFlood(adminWallet, PROVIDER).init(deploymentFile)
    const {deployment, deployToMempool, deployToFlashbots} = await flood.liquid(args as LiquidParams, userWallet)

    if (deployment.signedTxs && deployment.signedTxs.length > 0) {
        const filename = args.shouldDeploy ? await getNewDeploymentFilename() : await getNewLiquidityFilename()
        await MevFlood.saveDeployment(filename, deployment, deployment.signedTxs)
    }

    if (args.sendToMempool) {
        console.log("Txs prepared. Sending to mempool...")
        const deploymentRes = await deployToMempool()
        await Promise.all(deploymentRes.map(tx => tx.wait(1)))
        console.log(`Finished deployment. Sent ${deploymentRes.length} txs.`)
    } else {
        console.log("Txs prepared. Sending to Flashbots.")
        const deploymentRes = await deployToFlashbots()
        console.log(`Finished deployment.`)
    }
}

main()
