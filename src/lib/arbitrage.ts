import { BigNumber } from 'mathjs'
import math from "./math"

const FEE = 0.997

/** Calculate spot price for a given pair. Specific to univ2 `exactInputSingle`, fees ignored.
 * @param x: reserves of token0.
 * @param y: reserves of token1.
 * @param k: product constant.
 * @param amountIn: amount of tokens to send in exchange for other tokens.
 * @param swapXForY: determines trade direction.
 */
export const calculatePostTradeReserves = (
    x: BigNumber, y: BigNumber, k: BigNumber, amountIn: BigNumber, swapXForY: boolean
): {reserves0: BigNumber, reserves1: BigNumber, amountOut: BigNumber} => {
    if (swapXForY) {
        const dx = amountIn as BigNumber
        const dy = math.subtract(
            y,
            math.divide(k,
                math.add(x, dx)
            )
        ) as BigNumber
        return {
            reserves0: x.add(dx),
            reserves1: y.sub(dy),
            amountOut: dy.mul(FEE),
        }
    }
    else {
        const dy = amountIn as BigNumber
        const dx = math.subtract(
            x, math.divide(k,
                math.add(y, dy)
            )
        ) as BigNumber
        return {
            reserves0: x.sub(dx),
            reserves1: y.add(dy),
            amountOut: dx.mul(FEE),
        }
    }
}

/** Calculates amount of tokens to swap for the optimal arb.
 * @param reserveA_0: Reserves of token0 on exchange A.
 * @param reserveA_1: Reserves of token1 on exchange A.
 * @param reserveB_0: Reserves of token0 on exchange B.
 * @param reserveB_1: Reserves of token1 on exchange B.
 * @param settlementToken: Trade direction. If settlementToken == 1, calculates 0 -> 1 swap.
 */
const calculateOptimalArbAmountIn = (
    reserveA_0: BigNumber,
    reserveA_1: BigNumber,
    reserveB_0: BigNumber,
    reserveB_1: BigNumber,
    settlementToken: 0 | 1,
): BigNumber => {
    if (settlementToken === 1) {
        const priceA = reserveA_1.div(reserveA_0)
        const priceB = reserveB_0.div(reserveB_1)

        const numerator = math.sqrt(
            priceA.mul(priceB).mul(FEE).mul(FEE)
        ).sub(1)

        const denominator = math.chain(
            math.divide(FEE, reserveA_0)
        ).add(
            math.chain(FEE)
            .multiply(FEE)
            .multiply(priceA)
            .divide(reserveB_1)
            .done()
        ).done()

        return math.divide(numerator, denominator) as BigNumber
    }
    else {
        const priceA = reserveA_0.div(reserveA_1)
        const priceB = reserveB_1.div(reserveB_0)

        const numerator = math.sqrt(
            priceA.mul(priceB).mul(FEE).mul(FEE)
        ).sub(1)

        const denominator = math.chain(
            math.divide(FEE, reserveA_1)
        ).add(
            math.chain(FEE)
            .multiply(FEE)
            .multiply(priceA)
            .divide(reserveB_0)
            .done()
        ).done()

        return math.divide(numerator, denominator) as BigNumber
    }
}

/**
 * Convenience log
 */
const logPrice = (label: string, reserves: {reserves0: BigNumber, reserves1: BigNumber}) => {
    // assume the one with less in it is the base currency
    let denominator = reserves.reserves0.lt(reserves.reserves1) ? reserves.reserves0 : reserves.reserves1
    let numerator = denominator === reserves.reserves1 ? reserves.reserves0 : reserves.reserves1
    console.debug(`price (${label})`, math.bignumber(numerator.div(denominator)))
}

/**
 * ```
 * not(1) === 0
 * not(0) === 1
 * ```
 */
const not = (tokenNumber: 0 | 1) => {
    return Math.abs(tokenNumber - 1) as 0 | 1
}

type Pool = {
    reserves0: BigNumber,
    reserves1: BigNumber,
    k: BigNumber,
}

/**
Simulates a backrun-arb given an initial state, returns the profit. 
Assumes user is trading on exchange A.
 * @param reservesA_0: Reserves of token0 on exchange A.
 * @param reservesA_1: Reserves of token1 on exchange A.
 * @param kA: Product constant of pair on exchange A.
 * @param reservesB_0: Reserves of token0 on exchange B.
 * @param reservesB_1: Reserves of token1 on exchange B.
 * @param kB: Product constant of pair on exchange B.
 * @param userAmountIn: Amount of tokens the user sends for their swap.
 * @param userSwap0For1: Determines trade direction.
 * @param wethIndex: index of weth. Prices are calculated in terms of TOKEN/WETH.
 * @param userExchange: Identifier of exchange that the user trades on; matches to param `reserves(A|B)_N`.
 * @returns profit is always denoted in terms of ETH
 */
export const calculateBackrunParams = (
    reservesA_0: BigNumber,
    reservesA_1: BigNumber,
    kA: BigNumber,
    reservesB_0: BigNumber,
    reservesB_1: BigNumber,
    kB: BigNumber,
    userAmountIn: BigNumber,
    userSwap0For1: boolean,
    wethIndex: 0 | 1,
    userExchange: "A" | "B"
): {profit: BigNumber, settlementToken: 0 | 1, backrunAmount: BigNumber, userReserves: Pool, otherReserves: Pool} | undefined => {
    const otherExchange = userExchange === "A" ? "B" : "A"

    // convenience log
    const logPrices = () => {
        const reservesA = {reserves0: reservesA_0, reserves1: reservesA_1}
        const reservesB = {reserves0: reservesB_0, reserves1: reservesB_1}
        logPrice("A", reservesA)
        logPrice("B", reservesB)
    }

    const updateUserExchangeReserves = (reserves0: BigNumber, reserves1: BigNumber) => {
        if (userExchange === "A") {
            reservesA_0 = reserves0
            reservesA_1 = reserves1
        } else {
            reservesB_0 = reserves0
            reservesB_1 = reserves1
        }
    }

    const updateOtherExchangeReserves = (reserves0: BigNumber, reserves1: BigNumber) => {
        if (otherExchange === "A") {
            reservesA_0 = reserves0
            reservesA_1 = reserves1
        } else {
            reservesB_0 = reserves0
            reservesB_1 = reserves1
        }
    }

    /**
     * Gets reserves of exchange that the user's transaction is on.
     * 
     * We do this because we need to know the difference between the exchange that the user is trading on, and our instantiated definition of "exchange A".
     */
    const getUserExchangeReserves = () => {
        return userExchange === "A" ? {reserves0: reservesA_0, reserves1: reservesA_1, k: kA} : {reserves0: reservesB_0, reserves1: reservesB_1, k: kB}
    }

    /**
     * Gets reserves of exchange that we sell our backrun-purchased tokens on.
     */
    const getOtherExchangeReserves = () => {
        return otherExchange === "A" ? {reserves0: reservesA_0, reserves1: reservesA_1, k: kA} : {reserves0: reservesB_0, reserves1: reservesB_1, k: kB}
    }

    // settlementToken is the FINAL node in the arb path
    let settlementToken: 0 | 1 = 0
    if (userSwap0For1) { 
        /* user swapping 1 -> 0, we swap 0 -> 1 -> 0
                         |----|          |----|    |
                       exchange_A      exchange_A  |
                                              |----|
                                            exchange_B
        */
        settlementToken = 1
    }
    // assume we'll do the opposite of the user after their trade
    logPrices()

    // calculate price impact from user trade
    let userReserves = getUserExchangeReserves()
    const userSwap = calculatePostTradeReserves(userReserves.reserves0, userReserves.reserves1, userReserves.k, userAmountIn, userSwap0For1)

    // update local reserves cache: user's exchange
    updateUserExchangeReserves(userSwap.reserves0, userSwap.reserves1)
    userReserves = getUserExchangeReserves()
    logPrices()

    let otherReserves = getOtherExchangeReserves()

    // calculate optimal buy amount on exchange A (opposite of user)
    let backrunAmount = calculateOptimalArbAmountIn(
        userReserves.reserves0, userReserves.reserves1, otherReserves.reserves0, otherReserves.reserves1, not(settlementToken)
    )
    if (backrunAmount.lte(0)) {
        console.log("SWITCHING DIRECTION")
        // better arb the other way, so we'll settle in the other token
        settlementToken = not(settlementToken)
        backrunAmount = calculateOptimalArbAmountIn(
            userReserves.reserves0, userReserves.reserves1, otherReserves.reserves0, otherReserves.reserves1, not(settlementToken)
        )
    }
    // if it's negative again, there's no good arb opportunity
    if (backrunAmount.lte(0)) {
        return undefined
    }

    // "execute backrun" swap; opposite direction of user trade on same exchange
    userReserves = getUserExchangeReserves()
    const backrunBuy = calculatePostTradeReserves(userReserves.reserves0, userReserves.reserves1, userReserves.k, backrunAmount, settlementToken === 0)

    // update local reserves after backrunning user on same exchange
    updateUserExchangeReserves(backrunBuy.reserves0, backrunBuy.reserves1)
    userReserves = getUserExchangeReserves()
    logPrices()

    // execute settlement swap; circular arb completion
    // same direction as user (opposite the backrun) on other exchange
    const backrunSell = calculatePostTradeReserves(otherReserves.reserves0, otherReserves.reserves1, otherReserves.k, backrunBuy.amountOut, settlementToken === 1)

    // update local reserves on other exchange (not the one the user traded on)
    updateOtherExchangeReserves(backrunSell.reserves0, backrunSell.reserves1)
    otherReserves = getOtherExchangeReserves()
    logPrices()

    // difference in tokens bought on exchange A and sold on exchange B
    const profit = math.bignumber(backrunSell.amountOut.sub(backrunAmount))

    return {
        settlementToken,
        backrunAmount,
        profit,
        userReserves,
        otherReserves,
    }
}
