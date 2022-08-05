import { Wallet } from "ethers"
import env from './env'

import minionWallets from "../output/wallets.json"
import { getArgs } from './cliArgs'

export const getWalletSet = (programName: string) => {
    const {startIdx, endIdx} = getArgs(programName)
    return minionWallets
        .slice(parseInt(startIdx), parseInt(endIdx))
        .map(wallet => new Wallet(wallet.privateKey))
}

export const getAdminWallet = () => new Wallet(env.ADMIN_PRIVATE_KEY)
