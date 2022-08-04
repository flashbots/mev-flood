import { Wallet } from "ethers"
import fs from "fs/promises"
import { WALLETS_PATH } from './helpers'

async function main() {
    try {
        await fs.stat(WALLETS_PATH)
        console.error(`${WALLETS_PATH} already exists`)
        process.exit(1)
    } catch (e) {/* do nothing */}

    // creates 100 wallets and saves their key/addr map to a JSON file
    console.log("Creating wallets...")
    let wallets = []
    for (let i = 0; i < 100; i++) {
        const wallet = Wallet.createRandom()
        wallets.push({
            address: wallet.address,
            privateKey: wallet.privateKey,
        })
    }
    console.log("Saving to `output/wallets.json`...")
    await fs.writeFile(WALLETS_PATH, JSON.stringify(wallets, null, 2))
}

main().then(() => {
    process.exit(0)
})
