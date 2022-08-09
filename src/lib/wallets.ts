import { Wallet } from "ethers"
import env from './env'

import minionWallets from "../output/wallets.json"
import { getArgs } from './cliArgs'

export const getWalletSet = (programName: string) => {
    const {startIdx, endIdx} = getArgs(programName)
    const wallets = minionWallets
        .slice(parseInt(startIdx), parseInt(endIdx))
        .map(wallet => new Wallet(wallet.privateKey))
    console.log("using the following wallet(s)", wallets.map(w => w.address))
    return wallets
}

export const getAdminWallet = () => new Wallet(env.ADMIN_PRIVATE_KEY)
