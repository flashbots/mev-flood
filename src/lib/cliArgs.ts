/**
 * Get CLI args for "search" scripts (dumb-search, smart-search, fake-search)
 * @param programName name of script for console readability
 * @returns start and end indices for wallets to use from `output/wallets.json`
 */
export const getSearchArgs = (programName: string) => {
    const helpMessage = (program: string) => `search on multiple wallets (defined in \`output/wallets.json\`)

Usage:
    yarn ${program} <first_wallet_index> <last_wallet_index> [mempool]

Example:
    # search with 25 wallets on flashbots
    yarn ${program} 0 25

    # search with 4 wallets on mempool
    yarn ${program} 0 25 mempool
`
    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage(programName))
            process.exit(0)
        }
    } else {
        console.error("both wallet indices are required")
        console.log(helpMessage(programName))
        process.exit(1)
    }
    
    const [startIdx, endIdx] = process.argv.slice(2)
    return {startIdx, endIdx}
}

/**
 * Get CLI args for sendPrivateTx script.
 */
export const getSendPrivateTxArgs = () => {
    const helpMessage = `send a sample private tx.

Usage:
    yarn script.sendPrivateTx [dummy]

Example:
    # send private tx to lottery contract (lottery_mev.sol must be deployed on target chain)
    yarn script.sendPrivateTx

    # send private tx to uniswapV2 router (works on any chain)
    yarn script.sendPrivateTx dummy
`

    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage)
        } else if (process.argv[2].includes("dummy")) {
            return {
                dummy: true
            }
        }
    }
    return {
        dummy: false
    }
}

/**
 * Get CLI args for cancelPrivateTx script.
 */
 export const getCancelPrivateTxArgs = () => {
    const helpMessage = `cancel a private tx.

Usage:
    yarn script.cancelPrivateTx <tx_hash>

Example:
    yarn script.cancelPrivateTx 0x52485869d1aa64a4fb029edaf94e6b978ad32ea1879adabab38639dd462324ac
`

    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage)
        } else {
            return process.argv[2]
        }
    }
    return undefined
}

/**
 * Get CLI args for sendProtectTx script.
 */
 export const getSendProtectTxArgs = () => {
    const helpMessage = `send a sample Protect tx.

Usage:
    yarn script.sendProtectTx [dummy]

Example:
    # send Protect tx to lottery contract (lottery_mev.sol must be deployed on target chain)
    yarn script.sendProtectTx

    # send Protect tx to uniswapV2 router (works on any chain)
    yarn script.sendProtectTx dummy
`

    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage)
        } else if (process.argv[2].includes("dummy")) {
            return {
                dummy: true
            }
        }
    }
    return {
        dummy: false
    }
}

export const useMempool = process.argv.length > 4 && process.argv[4] == "mempool"
