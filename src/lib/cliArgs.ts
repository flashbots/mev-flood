
const helpMessage = (program: string) => `Dumb-search on multiple wallets (defined in \`output/wallets.json\`)

Usage:
    yarn ${program} <first_wallet_index> <last_wallet_index>

Example:
    # search with 25 wallets
    yarn ${program} 0 25
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
