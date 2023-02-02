import { formatEther } from 'ethers/lib/utils'
import { BigNumber } from 'mathjs'
import math from "./math"

const FEE = 0.997
// const FEE = 1

/**
 * Convenience function for picking the asset name given the trade direction.
 * @param swap_usdc_for_eth
 */
const assetName = (swap_usdc_for_eth: boolean, labels: {x: string, y: string}) => {
    // const assetNames = ["USD", "ETH"]
    const assetNames = [labels.x, labels.y]
    return assetNames[swap_usdc_for_eth ? 0 : 1]
}

/** Calculate spot price for a given pair. Specific to univ2 `exactInputSingle`, fees ignored.
 * @param x: reserves of token0.
 * @param y: reserves of token1.
 * @param k: product constant.
 * @param amount_in: amount of tokens to send in exchange for other tokens.
 * @param swap_x_for_y: determines trade direction.
 * @returns Price returned is ALWAYS defined as token0 per token1.
 */
const calculateSpotPrice = (
    x: BigNumber, y: BigNumber, k: BigNumber, amount_in: BigNumber, swap_x_for_y: boolean
): {reserves0: BigNumber, reserves1: BigNumber, amountOut: BigNumber, price: BigNumber} => {
    if (swap_x_for_y) {
        const dx = amount_in as BigNumber
        const dy = math.subtract(
            y,
            math.divide(k,
                math.add(x, dx)
            )
        ) as BigNumber
        const price = math.divide(dx, dy) as BigNumber
        return {
            reserves0: x.add(dx),
            reserves1: y.sub(dy),
            amountOut: dy,
            price,
        }
    }
    else {
        const dy = amount_in as BigNumber
        const dx = math.subtract(
            x, math.divide(k,
                math.add(y, dy)
            )
        ) as BigNumber
        const price = math.divide(dx, dy) as BigNumber
        return {
            reserves0: x.sub(dx),
            reserves1: y.add(dy),
            amountOut: dx,
            price,
        }
    }
}

/**
 * Convenience function to calculate a swap outcome and log relevant data.
 * @param reserves0: reserves of token0.
 * @param reserves1: reserves of token1.
 * @param k: product constant.
 * @param amount_in: amount of tokens to send in exchange for other tokens.
 * @param swap0For1: determines trade direction.
 * @returns Price returned is ALWAYS defined as token0 per token1.
 */
export const simulateSwap = (
    reserves0: BigNumber,
    reserves1: BigNumber,
    k: BigNumber,
    amount_in: BigNumber,
    swap0For1: boolean,
    labels: {x: string, y: string}
) => {

    console.log(
        `\n-- swapping ${formatEther(amount_in.toFixed(0))} ${assetName(swap0For1, labels)} for ${assetName(!swap0For1, labels)}`
    )
    return calculateSpotPrice(reserves0, reserves1, k, amount_in, swap0For1)
}

/** Calculates amount of tokens to swap for the optimal arb.
 * @param reserve0_A: Reserves of token0 on exchange A.
 * @param reserve1_A: Reserves of token1 on exchange A.
 * @param reserve0_B: Reserves of token0 on exchange B.
 * @param reserve1_B: Reserves of token1 on exchange B.
 * @param swap0For1: Determines trade direction.
 */
export const calculateOptimalArbAmountIn = (
    reserve0_A: BigNumber,
    reserve1_A: BigNumber,
    reserve0_B: BigNumber,
    reserve1_B: BigNumber,
    swap0For1: boolean,
): BigNumber => {

    if (swap0For1) {
        console.debug("SWAP_0_FOR_1")
        const priceA = reserve1_A.div(reserve0_A)
        const priceB = reserve0_B.div(reserve1_B)

        const numerator = math.sqrt(
            priceA.mul(priceB).mul(FEE).mul(FEE)
        ).sub(1)

        const denominator = math.chain(
            math.divide(FEE, reserve0_A)
        ).add(
            math.chain(FEE)
            .multiply(FEE)
            .multiply(priceA)
            .divide(reserve1_B)
            .done()
        ).done()

        return math.divide(numerator, denominator) as BigNumber
    }
    else {
        console.debug("SWAP_1_FOR_0")
        const priceA = reserve0_A.div(reserve1_A)
        const priceB = reserve1_B.div(reserve0_B)

        const numerator = math.sqrt(
            priceA.mul(priceB).mul(FEE).mul(FEE)
        ).sub(1)

        const denominator = math.chain(
            math.divide(FEE, reserve1_A)
        ).add(
            math.chain(FEE)
            .multiply(FEE)
            .multiply(priceA)
            .divide(reserve0_B)
            .done()
        ).done()

        return math.divide(numerator, denominator) as BigNumber
    }
}

const logPrice = (label: string, reserves: {reserves0: BigNumber, reserves1: BigNumber}) => {
    console.log(`price (${label})`, math.bignumber(reserves.reserves0.div(reserves.reserves1)))
}

/**
Simulates a backrun-arb given an initial state, returns the profit. 
Assumes user is trading on exchange A.
 * @param reserves0_A: Reserves of token0 on exchange A.
 * @param reserves1_A: Reserves of token1 on exchange A.
 * @param k_A: Product constant of pair on exchange A.
 * @param reserves0_B: Reserves of token0 on exchange B.
 * @param reserves1_B: Reserves of token1 on exchange B.
 * @param k_B: Product constant of pair on exchange B.
 * @param user_amount_in: Amount of tokens the user sends for their swap.
 * @param userSwap0For1: Determines trade direction.
 * @returns profit is always denoted in token0/token1
 */
export const calculateBackrunProfit = (
    reserves0_A: BigNumber,
    reserves1_A: BigNumber,
    k_A: BigNumber,
    reserves0_B: BigNumber,
    reserves1_B: BigNumber,
    k_B: BigNumber,
    user_amount_in: BigNumber,
    userSwap0For1: boolean,
    labels: {x: string, y: string},
): BigNumber => {
    let settlementToken = 0
    if (!userSwap0For1) {
        settlementToken = 1
    }
    // assume we'll do the opposite of the user after their trade
    let backrun_direction = !userSwap0For1
    const logPrices = () => {
        logPrice("A", {reserves0: reserves0_A, reserves1: reserves1_A})
        logPrice("B", {reserves0: reserves0_B, reserves1: reserves1_B})
    }
    logPrices()

    // calculate price impact from user trade
    const user_swap = simulateSwap(reserves0_A, reserves1_A, k_A, user_amount_in, userSwap0For1, labels)

    // simulate updating reserves on exchange A
    reserves0_A = user_swap["reserves0"]
    reserves1_A = user_swap["reserves1"]
    logPrices()

    // calculate optimal buy amount on exchange A
    let backrun_amount = calculateOptimalArbAmountIn(
        reserves0_A, reserves1_A, reserves0_B, reserves1_B, backrun_direction
    )
    if (backrun_amount.lt(0)) {
        // switch directions; better arb the other way
        backrun_direction = !backrun_direction
        backrun_amount = calculateOptimalArbAmountIn(
            reserves0_A, reserves1_A, reserves0_B, reserves1_B, backrun_direction
        )
        settlementToken = settlementToken === 1 ? 0 : 1
    }
    // if it's negative again, we don't have a good arb
    if (backrun_amount.lt(0)) {
        return math.bignumber(0)
    }

    // execute backrun swap on same exchange as user
    const backrun_buy = simulateSwap(
        reserves0_A, reserves1_A, k_A, backrun_amount, backrun_direction,
        labels
    )

    // "update reserves" on exchange A
    reserves0_A = backrun_buy["reserves0"]
    reserves1_A = backrun_buy["reserves1"]
    logPrices()

    // execute settlement swap; circular arb completion
    // same direction as user (opposite the backrun) on other exchange
    const backrun_sell = simulateSwap(
        reserves0_B, reserves1_B, k_B, backrun_buy["amountOut"], !backrun_direction,
        labels
    )

    // "update reserves" on exchange B
    reserves0_B = backrun_sell["reserves0"]
    reserves1_B = backrun_sell["reserves1"]
    logPrices()

    // return profit
    const profit = backrun_sell["amountOut"].sub(backrun_amount)
    // if we settle in token1, adjust the profit to be in terms of token0
    if (settlementToken === 1) {
        console.log("SWAPPIN PRICE QUOTIENT")
        const price = reserves0_B.div(reserves1_B)
        // convert profit to standard price format (x/y)
        return math.bignumber(profit.div(price))
    } else {
        return math.bignumber(profit)
    }
}
