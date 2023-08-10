import { Wallet, providers, utils } from 'ethers'
import { getSendProtectTxArgs } from '../lib/cliArgs'
import env from '../lib/env'
import { createRevertingUniTx, getSampleLotteryTx } from '../lib/lottery'
import { keccak256 } from 'ethers/lib/utils'
// import { getAdminWallet } from '../lib/wallets'

async function main() {
    const args = getSendProtectTxArgs()
    if (!args) {
        return
    }
    const provider = new providers.JsonRpcProvider(env.PROTECT_URL)
    // const adminWallet = getAdminWallet().connect(provider)
    const adminWallet = new Wallet(process.env.ADMIN_PRIVATE_KEY!).connect(provider)

    const send = async () => {
        const tx = args.dummy ? await createRevertingUniTx() : await getSampleLotteryTx(adminWallet)
        if (!tx) {
            console.warn("protect tx is undefined")
            return
        }
    
        console.log("SENDING", tx)
        // calculate tx hash
        const sendRes = await adminWallet.sendTransaction(tx)
        let tries = 0
        while (true) {
            if (tries++ > 10) { break }
            console.log(`https://protect.flashbots.net/tx/${sendRes.hash}`)
            const res = await (await fetch(`https://protect.flashbots.net/tx/${sendRes.hash}`)).json()
            if (res['status'] !== "UNKNOWN") {
                console.log(res)
                break
            } else {
                // sleep for one second
                await new Promise(r => setTimeout(r, 1000))
                console.log("checking protect api...")
            }
        }
    }
    if (args.forever) { 
        provider.on("block", send)
    } else {
        send()
    }
}

main()
