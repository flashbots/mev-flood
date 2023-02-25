import assert from "assert"
import { ethers } from 'ethers'
import { numify } from "../lib/math"

describe("math", () => {
    it("should decode a BigNumber correctly", () => {
        const ethersNum = ethers.BigNumber.from(42).mul(1e9).mul(1e9).mul(1e9).mul(1e9).mul(1e9)
        const mathNum = numify(ethersNum)
        console.log("mathNum.toFixed(0)", mathNum.toFixed(0))
        console.log("ethersNum.toString()", ethersNum.toString())
        assert(mathNum.toFixed(0) === ethersNum.toString())
    })
})
