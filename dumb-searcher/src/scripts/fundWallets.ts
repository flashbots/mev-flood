import fs from "fs/promises"
import { Wallet } from "ethers"
import env from '../env'

// read wallets from file, send them each some ether
const adminWallet = new Wallet(env.ADMIN_PRIVATE_KEY)
console.log(adminWallet)
