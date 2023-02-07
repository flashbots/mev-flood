import readline from "readline-sync"
import { getDeployUniswapV2Args } from '../lib/cliArgs';

import env from '../lib/env';
import { PROVIDER } from '../lib/providers';
import { getExistingDeploymentFilename, getNewDeploymentFilename, getNewLiquidityFilename } from '../lib/liquid';
import { getAdminWallet, getTestWallet } from '../lib/wallets';
import scripts, {LiquidOptions} from '../lib/scripts';
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
    const options: LiquidOptions = args as LiquidOptions
    const {allSignedTxs, deployments} = await scripts.liquid(
        options,
        PROVIDER,
        adminWallet,
        userWallet,
        deploymentFile
    )
    
    if (allSignedTxs.length > 0 && deployments) {
        const filename = args.shouldDeploy ? await getNewDeploymentFilename() : await getNewLiquidityFilename()
        await MevFlood.saveDeployments(filename, deployments, allSignedTxs)
    }
}

main()
