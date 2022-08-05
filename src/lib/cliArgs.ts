
const helpMessage = (program: string) => `search on multiple wallets (defined in \`output/wallets.json\`)

Usage:
    yarn ${program} <first_wallet_index> <last_wallet_index> [mempool]

Example:
    # search with 25 wallets on flashbots
    yarn ${program} 0 25

    # search with 4 wallets on mempool
    yarn ${program} 0 25 mempool
`

export const getArgs = (programName: string) => {
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

export const useMempool = process.argv.length > 4 && process.argv[4] == "mempool"
