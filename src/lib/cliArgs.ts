/**
 * Get CLI args for "search" scripts (dumb-search, smart-search, fake-search)
 * @param programName name of script for console readability
 * @returns start and end indices for wallets to use from `src/output/wallets.json`
 */
export const getSearchArgs = (programName: string) => {
    const helpMessage = (program: string) => `search on multiple wallets (defined in \`src/output/wallets.json\`)

Usage:
    yarn ${program} <first_wallet_index> <last_wallet_index> [mempool]

Example:
    # run with a single wallet
    yarn ${program} 13

    # run with 25 wallets on flashbots
    yarn ${program} 0 25

    # run with 4 wallets on mempool
    yarn ${program} 0 25 mempool
`
    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage(programName))
            process.exit(0)
        }
    } else {
        console.error("one or two wallet indices are required")
        console.log(helpMessage(programName))
        process.exit(1)
    }
    
    let [startIdx, endIdx] = process.argv.slice(2)
    if (!endIdx) {
        endIdx = `${parseInt(startIdx) + 1}`
    }
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
            return undefined
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
    let dummy = false
    let fast = false
    const helpMessage = `send a sample Protect tx.

Usage:
    yarn script.sendProtectTx [dummy] [fast]

Example:
    # send lottery contract tx to Protect (lottery_mev.sol must be deployed on target chain)
    yarn script.sendProtectTx

    # send uniswapV2 router tx to Protect (works on any chain)
    yarn script.sendProtectTx dummy

    # send lottery contract tx to Protect with fast mode
    yarn script.sendProtectTx fast

    # send uniswapV2 router tx to Protect w/ fast mode
    yarn script.sendProtectTx fast dummy
    # or
    yarn script.sendProtectTx dummy fast
`

    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage)
            return undefined
        } 
        const args = `${process.argv[2]}&${process.argv[3]}`
        if (args.includes("dummy")) {
            dummy = true
        }
        if (args.includes("fast")) {
            fast = true
        }
    }
    return {
        dummy,
        fast,
    }
}

export const useMempool = process.argv.length > 4 && process.argv[4] == "mempool"

export const getDeployUniswapV2Args = () => {
    let deployOnly = false
    const helpMessage = `deploy a uniswap v2 environment w/ bootstrapped liquidity.
    Generates a JSON file with all details of deployments in \`src/output/uniBootstrap.json\`

Usage:
    yarn script.liquid [options]

Options:
    --deploy-only       Only deploy contracts, don't bootstrap liquidity.

Example:
    # default; deploy contracts and bootstrap liquidity
    yarn script.sendProtectTx

    # send uniswapV2 router tx to Protect (works on any chain)
    yarn script.sendProtectTx dummy

    # send lottery contract tx to Protect with fast mode
    yarn script.sendProtectTx fast

    # send uniswapV2 router tx to Protect w/ fast mode
    yarn script.sendProtectTx fast dummy
    # or
    yarn script.sendProtectTx dummy fast
`
    if (process.argv.length > 2) {
        if (process.argv[2].includes("help")) {
            console.log(helpMessage)
            return {deployOnly: false}
        } 
        const args = `${process.argv[2]}&${process.argv[3]}`
        if (args.includes("--deploy-only")) {
            deployOnly = true
        }
    }
    return {
        deployOnly
    }
}
