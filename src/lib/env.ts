import dotenv from "dotenv"
const envPath = `.env.${process.env.NODE_ENV}`
dotenv.config({ path: envPath })
console.log(`ENV: ${process.env.NODE_ENV}`)

const env = {
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY || "",
    TEST_PRIVATE_KEY: process.env.TEST_PRIVATE_KEY || "",
    CHAIN_ID: parseInt(process.env.CHAIN_ID || ""),
    CHAIN_NAME: process.env.CHAIN_NAME || "",
    PROTECT_URL: process.env.PROTECT_URL || "",
    RPC_URL: process.env.RPC_URL || "",
    MEV_GETH_HTTP_URL: process.env.MEV_GETH_HTTP_URL || "",
}

let fail = false
for (const [key, val] of Object.entries(env)) {
    if (!val) {
        console.error(`${key} is undefined`)
        fail = true
    }
}
if (fail) {
    console.error(`bad configuration in ${envPath}`)
    process.exit(2)
}

export default env
