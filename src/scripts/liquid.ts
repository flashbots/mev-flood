import readline from "readline-sync"
import { Wallet } from 'ethers';

// lib
import { getDeployLiquidArgs } from '../lib/cliArgs';
import env from '../lib/env';
import { PROVIDER } from '../lib/providers';
import { getExistingDeploymentFilename, getNewDeploymentFilename, getNewLiquidityFilename } from '../lib/liquid';
import { getAdminWallet, getTestWallet } from '../lib/wallets';
import {LiquidParams} from '../lib/scripts';
import MevFlood from '..';
import { FlashbotsBundleResolution, RelayResponseError } from '@flashbots/ethers-provider-bundle';

/** Prints txs:
 * build a set of contracts to deploy,
 * create univ2 pools,
 * bootstrap w/ liquidity
 * 
 * all txs are signed with the account specified by ADMIN_PRIVATE_KEY in .env
*/
const main = async () => {
    const args = getDeployLiquidArgs()
    try {
        await PROVIDER.getBlockNumber()
    } catch (e) {
        console.error(`failed to connect to ${env.RPC_URL}.`)
        process.exit(1)
    }

    const adminWallet = getAdminWallet().connect(PROVIDER)
    const userWallet = getTestWallet().connect(PROVIDER)
    const flashbotsSigner = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") // hh[0]

    let adminNonce = await adminWallet.getTransactionCount()
    if (adminNonce != 0 && !args.autoAccept) {
        console.warn(`Your admin account nonce is currently ${adminNonce}.`)
        readline.question("press Enter to continue...")
    }

    let flood = new MevFlood(adminWallet, PROVIDER)
    const deploymentFile = await getExistingDeploymentFilename()
    try {
        flood = await (await flood.withDeploymentFile(deploymentFile)).initFlashbots(flashbotsSigner)
    } catch (e) {
        console.error("Failed to load deployment file. Creating new deployment.")
        await flood.liquid(args as LiquidParams, userWallet)
        flood.saveDeployment(deploymentFile)
    }
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
        let bundleStatus: FlashbotsBundleResolution = FlashbotsBundleResolution.BlockPassedWithoutInclusion
        while (bundleStatus == FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
            const deploymentRes = await deployToFlashbots()
            if ("error" in deploymentRes) {
                throw (deploymentRes as RelayResponseError).error
            } else {
                const res = await deploymentRes.wait()
                if (res == FlashbotsBundleResolution.BundleIncluded) {
                    console.log("bundle included")
                    break
                } else {
                    const msg = res == FlashbotsBundleResolution.BlockPassedWithoutInclusion ?
                        "block passed without inclusion" :
                        res == FlashbotsBundleResolution.AccountNonceTooHigh ?
                        "account nonce too high" :
                        "bundle not included (unknown reason)"
                    console.log(msg)
                }
            }
        }
        console.log(`Finished deployment.`)
    }
}

main()
