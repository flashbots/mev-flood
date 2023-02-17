import { textColors, } from './helpers'

export const getOption = (args: string[], flagIndex: number) => {
    if (args.length > flagIndex + 1) {
        return parseInt(args[flagIndex + 1])
    } else {
        throw new Error(`option '${args[flagIndex]}' was not specified`)
    }
}

export const getFlagIndex = (args: string[], fullName: string, shortName?: string) => {
    return Math.max(args.indexOf(fullName), shortName ? args.indexOf(shortName) : -1)
}

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
    let shouldDeploy = true
    let shouldMintTokens = true
    let shouldBootstrapLiquidity = true
    let shouldApproveTokens = true
    let shouldTestSwap = true
    let autoAccept = false
    let numPairs = 1

    const helpMessage = `
    ${textColors.Bright}script.liquid${textColors.Reset}: deploy a uniswap v2 environment w/ bootstrapped liquidity.
    Deployment details are written to \`src/output/${process.env.NODE_ENV}/uniBootstrap$N.json\`
    where $N increments numerically.

Usage:
    yarn script.liquid [options]

Options:
    --deploy-only *     Only deploy contracts, don't bootstrap liquidity.
    --mint-only *       Only mint tokens.
    --bootstrap-only *  Only bootstrap liquidity, don't deploy contracts.
    --approve-only *    Only approve uni router to spend your tokens.
    --swap-only *       Only test swap.
    -p, --num-pairs     Number of DAI pairs to deploy (if deploying). 
                        Half that number of DAI tokens (rounding up) will be created, 
                        and a unique WETH_DAI pair will be deployed on each UniswapV2 
                        clone for each DAI token.
    -y                  Auto-accept prompts (non-interactive mode).

    (*) passing multiple --X-only params will cause none of them to execute.

Example:
    # default; deploy contracts and bootstrap liquidity
    yarn script.liquid

    # only deploy contracts
    yarn script.liquid --deploy-only

    # enable degen mode
    yarn script.liquid --swap-only -y

    # deploy 4 DAI contracts 
`
    if (process.argv.length > 2) {
        const args = process.argv.slice(2)
        if (args.toString().includes("help")) {
            console.log(helpMessage)
            process.exit(0)
        } 
        if (args.includes("--deploy-only")) {
            shouldBootstrapLiquidity = false
            shouldMintTokens = false
            shouldApproveTokens = false
            shouldTestSwap = false
        }
        if (args.includes("--bootstrap-only")) {
            shouldDeploy = false
            shouldMintTokens = false
            shouldApproveTokens = false
            shouldTestSwap = false
        }
        if (args.includes("--mint-only")) {
            shouldDeploy = false
            shouldBootstrapLiquidity = false
            shouldApproveTokens = false
            shouldTestSwap = false
        }
        if (args.includes("--approve-only")) {
            shouldDeploy = false
            shouldBootstrapLiquidity = false
            shouldMintTokens = false
            shouldTestSwap = false
        }
        if (args.includes("--swap-only")) {
            shouldDeploy = false
            shouldBootstrapLiquidity = false
            shouldMintTokens = false
            shouldApproveTokens = false
        }
        if (args.includes("--num-pairs") || args.includes("-p")) {
            numPairs = getOption(args, getFlagIndex(args, "--num-pairs", "-p"))
        }
        if (args.includes("-y")) {
            autoAccept = true
        }
    }
    return {
        shouldApproveTokens,
        shouldDeploy,
        shouldBootstrapLiquidity,
        shouldMintTokens,
        shouldTestSwap,
        autoAccept,
        numPairs,
    }
}

export const getSwapdArgs = () => {
    // TODO: remove this. good lord.
    const modes = {
        swapd: "swapd",
        arbd: "arbd",
    }
    const program = process.env.MODE
    if (!program || !Object.keys(modes).includes(program)) {
        console.error("environment variable MODE=<'swapd' || 'arbd'> is required")
    }
    const noun = program == modes.swapd ? "swap" : "arb"
    const xPerBlockFlag = `--${noun}s-per-block`
    const options = program == modes.swapd ? `` : 
    // arbd
    `${textColors.Bright}-m, --min-profit${textColors.Reset}\t\tMinimum profit an arbitrage should achieve, in gwei. (default=100)
    ${textColors.Bright}-M, --max-profit${textColors.Reset}\t\tMaximum profit an arbitrage should achieve, in gwei. (default=inf)
`

    const helpMessage = () => `randomly swap on every block with multiple wallets (defined in \`src/output/wallets.json\`)

${textColors.Underscore}Usage:${textColors.Reset}
    yarn ${program} <first_wallet_index> [last_wallet_index] [OPTIONS...]

${textColors.Underscore}Options:${textColors.Reset}
    ${textColors.Bright}--help${textColors.Reset}\t\t\tPrint this help message.
    ${textColors.Bright}-n, ${xPerBlockFlag}${textColors.Reset}\tNumber of ${noun}s each wallet will make in each block.
    ${textColors.Bright}-p, --num-pairs${textColors.Reset}\t\tNumber of DAI_x/WETH pairs to trade with. Minimum is 2 for arbd.
    ${options}

${textColors.Underscore}Examples:${textColors.Reset}
    # run with a single wallet
    yarn ${program} 13

    # run with 25 wallets
    yarn ${program} 0 25

    # run with 10 wallets, each sending 5 ${noun}s per block
    yarn ${program} 10 21 -n 5

    # do the same with 5 trading pairs to choose from
    yarn ${program} 10 21 -n 5 -p 5

    # include "help" anywhere in the command to print this message
    yarn ${program} help
`
    // TODO: replace these horrible arg parsers
    
    const args = process.argv.slice(2)
    let actionsPerBlock = 1
    let numPairs = program === modes.arbd ? 2 : 1
    let minProfit = 100
    let maxProfit = 0 // 0 is interpreted as unlimited
    
    if (args.length > 0) {
        if (args.reduce((prv, crr) => `${prv} ${crr}`).includes("help")) {
            console.log(helpMessage())
            process.exit(0)
        } else {
            if (args.includes(xPerBlockFlag) || args.includes("-n")) {
                const flagIndex = getFlagIndex(args, xPerBlockFlag)
                actionsPerBlock = getOption(args, flagIndex)
            }
            if (args.includes("--num-pairs") || args.includes("-p")) {
                const flagIndex = getFlagIndex(args, "--num-pairs", "-p")
                numPairs = Math.max(getOption(args, flagIndex), numPairs)
            }
            if (args.includes("--min-profit") || args.includes("-m")) {
                const flagIndex = getFlagIndex(args, "--min-profit", "-m")
                minProfit = getOption(args, flagIndex)
            }
            if (args.includes("--max-profit") || args.includes("-m")) {
                const flagIndex = getFlagIndex(args, "--max-profit", "-m")
                maxProfit = getOption(args, flagIndex)
            }
        }
    } else {
        console.error("one or two wallet indices are required")
        console.log(helpMessage())
        process.exit(1)
    }
    
    let [startIdx, endIdx] = args
    if (!endIdx || endIdx[0] == '-') {
        endIdx = `${parseInt(startIdx) + 1}`
    }
    return {
        startIdx,
        endIdx,
        actionsPerBlock,
        numPairs,
        minProfit,
        maxProfit,
        program,
        modes,
    }
}
