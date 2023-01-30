// const FEE = 0.997
const FEE = 1
// token0 = USD, token1 = ETH
const assetNames = ["USD", "ETH"]

/**
 * Convenience function for picking the asset name given the trade direction.
 * @param swap_usdc_for_eth
 */
const assetName = (swap_usdc_for_eth: boolean) => {
    return assetNames[swap_usdc_for_eth ? 1 : 0]
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
    x: number, y: number, k: number, amount_in: number, swap_x_for_y: boolean
) =>{

    if (swap_x_for_y) {
        const dx = amount_in
        const dy = y - (k / (x + dx))
        const price = dx / dy
        return {
            reserves0: x + dx,
            reserves1: y - dy,
            amount_out: dy,
            price,
        }
    }
    else {
        const dy = amount_in
        const dx = x - (k / (y + dy))
        const price = dx / dy
        return {
            reserves0: x - dx,
            reserves1: y + dy,
            amount_out: dx,
            price,
        }
    }
}

const logReserves = (reserves0: number, reserves1: number) => {
    console.log(
        `reserves0\t${reserves0} ${assetNames[0]}\nreserves1\t${reserves1} ${assetNames[1]}`
    )
}

/**
 * Convenience function to calculate a swap outcome and log relevant data.
 * @param reserves0: reserves of token0.
 * @param reserves1: reserves of token1.
 * @param k: product constant.
 * @param amount_in: amount of tokens to send in exchange for other tokens.
 * @param swap_0_for_1: determines trade direction.
 * @returns Price returned is ALWAYS defined as token0 per token1.
 */
const swap = (
    reserves0: number, reserves1: number, k: number, amount_in: number, swap_0_for_1: boolean
) => {

    console.log(
        `-- swapping ${amount_in} ${assetName(swap_0_for_1)} for ${assetName(! swap_0_for_1)}`
    )
    const spot = calculateSpotPrice(reserves0, reserves1, k, amount_in, swap_0_for_1)
    logReserves(spot.reserves0, spot.reserves1)
    console.log(`amount_out\t${spot.amount_out} ${assetName(! swap_0_for_1)}`)
    console.log(`price\t\t${spot.price} ${assetNames[0]}/${assetNames[1]}`)
    return spot
}

/** Calculates amount of tokens to swap for the optimal arb.
 * @param reserve0_A: Reserves of token0 on exchange A.
 * @param reserve1_A: Reserves of token1 on exchange A.
 * @param reserve0_B: Reserves of token0 on exchange B.
 * @param reserve1_B: Reserves of token1 on exchange B.
 * @param swap_0_for_1: Determines trade direction.
 */
const calculateOptimalArbAmountIn = (
    reserve0_A: number,
    reserve1_A: number,
    reserve0_B: number,
    reserve1_B: number,
    swap_0_for_1: boolean,
) => {

    if (swap_0_for_1) {
        const price_A = reserve1_A / reserve0_A
        const price_B = reserve0_B / reserve1_B
        const numerator = Math.sqrt(price_A * price_B * FEE * FEE) - 1
        const denominator = (FEE / reserve0_A) + (FEE * FEE * price_A / reserve1_B)
        return numerator / denominator
    }
    else {
        const price_A = reserve0_A / reserve1_A
        const price_B = reserve1_B / reserve0_B
        const numerator = Math.sqrt(price_A * price_B * FEE * FEE) - 1
        const denominator = (FEE / reserve1_A) + (FEE * FEE * price_A / reserve0_B)
        return numerator / denominator
    }
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
 * @param user_swap_x_for_y: Determines trade direction.
 */
export const calculateBackrunProfit = (
    reserves0_A: number,
    reserves1_A: number,
    k_A: number,
    reserves0_B: number,
    reserves1_B: number,
    k_B: number,
    user_amount_in: number,
    user_swap_x_for_y: boolean,
) => {

    // calculate price impact from user trade
    const user_swap = swap(reserves0_A, reserves1_A, k_A, user_amount_in, user_swap_x_for_y)

    // update reserves on exchange A
    reserves0_A = user_swap["reserves0"]
    reserves1_A = user_swap["reserves1"]

    // calculate optimal buy amount on exchange A
    const backrun_amount = calculateOptimalArbAmountIn(
        reserves0_A, reserves1_A, reserves0_B, reserves1_B, ! user_swap_x_for_y
    )

    // execute swap; opposite user's trade direction on same exchange
    const backrun_buy = swap(
        reserves0_A, reserves1_A, k_A, backrun_amount, ! user_swap_x_for_y
    )

    // update reserves on exchange A
    reserves0_A = backrun_buy["reserves0"]
    reserves1_A = backrun_buy["reserves1"]

    // execute swap; same direction as user on other exchange
    const backrun_sell = swap(
        reserves0_B, reserves1_B, k_B, backrun_buy["amount_out"], user_swap_x_for_y
    )

    // update reserves on exchange B
    reserves0_B = backrun_sell["reserves0"]
    reserves1_B = backrun_sell["reserves1"]

    // return profit
    return backrun_sell["amount_out"] - backrun_amount
}

// def main():
//     reserves0 = 2 * million
//     reserves1 = 1000
//     k = reserves0 * reserves1

//     logReserves(reserves0, reserves1)

//     # test
//     # swap(reserves0, reserves1, k, 10000, True)
//     # swap(reserves0, reserves1, k, 5, False)

//     # assume both pools are equally priced at start
//     user_swap_usdc_for_eth = True
//     profit = calculateBackrunProfit(
//         reserves0,
//         reserves1,
//         k,  # / exchange A
//         reserves0,
//         reserves1,
//         k,  # / exchange B
//         10000,
//         user_swap_usdc_for_eth,
//     )
//     console.log("\nPROFIT\t\t{} {}".format(profit, assetName(! user_swap_usdc_for_eth)))
