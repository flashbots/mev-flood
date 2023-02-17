import { create, all } from 'mathjs'
import { BigNumber } from 'ethers'

// configure the default type of numbers as BigNumbers
const config = {
    // Default type of number
    // Available options: 'number' (default), 'BigNumber', or 'Fraction'
    number: "BigNumber" as any,

    // Number of significant digits for BigNumbers
    precision: 18
}
const math = create(all, config)

/**
 * Turns an ethers.BigNumber into a mathjs.BigNumber.
 * @param n The number to convert.
 * @returns 
 */
export const numify = (n: BigNumber): math.BigNumber => math.bignumber(n.toString())

export default math
