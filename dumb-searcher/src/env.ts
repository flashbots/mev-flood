import dotenv from "dotenv"
dotenv.config()

const env = {
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY || "",
}

let fail = false
for (const [key, val] of Object.entries(env)) {
    if (!val) {
        console.error(`${key} is undefined`)
        fail = true
    }
}
if (fail) {
    console.error("ERROR: bad .env")
    process.exit(2)
}

export default env
