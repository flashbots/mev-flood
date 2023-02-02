import assert, { equal } from "assert"
import { utils } from 'ethers'
import { calculateBackrunProfit, simulateSwap } from "../lib/arbitrage"
import math from "../lib/math"
type BigNumber = math.BigNumber

describe("arbitrage", () => {
    type PairReserves = {reserves0: BigNumber, reserves1: BigNumber}
    type Params = {
        A: PairReserves,
        B: PairReserves,
        swapXForY: boolean,
        amountIn: BigNumber,
    }
    
    const assetName = (swap_usdc_for_eth: boolean, labels: {x: string, y: string}) => {
        // const assetNames = ["USD", "ETH"]
        const assetNames = [labels.x, labels.y]
        return assetNames[swap_usdc_for_eth ? 0 : 1]
    }
    const labels = {x: "USD", y: "ETH"}
    const ETH = math.bignumber(1).mul(1e9).mul(1e9)
    const getK = (pairReserves: PairReserves): BigNumber => pairReserves.reserves0.mul(pairReserves.reserves1) as BigNumber

    const testBackrunProfit = (params: Params) => {
        const kA = getK(params.A)
        const kB = getK(params.B)
        const user_swap_usdc_for_eth = true
        const profit = calculateBackrunProfit(
            params.A.reserves0,
            params.A.reserves1,
            kA, // exchange A
            params.B.reserves0,
            params.B.reserves1,
            kB, // exchange B
            params.amountIn,
            params.swapXForY,
            labels
        )
        console.debug(`\nPROFIT\t\t${utils.formatEther(profit.toFixed(0))} ${assetName(!user_swap_usdc_for_eth, labels)}`)
        return profit
    }

    it('should find the optimal backrun arb', () => {
        // assume both pools are equally priced at start
        const params = {
            A: {
                reserves0: math.bignumber(1300000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            B: {
                reserves0: math.bignumber(1300000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            amountIn: math.bignumber(10000).mul(ETH),
            swapXForY: true,
        }
        console.debug(params)
        const profit = testBackrunProfit(params)
        assert(math.bignumber(profit).gt(0))
    })

    it('should find the optimal backrun arb (opposite direction)', () => {
        // assume both pools are equally priced at start
        const params = {
            A: {
                reserves0: math.bignumber(1300000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            B: {
                reserves0: math.bignumber(1300000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            amountIn: math.bignumber(7).mul(ETH),
            swapXForY: false,
        }
        console.debug(params)
        const profit = testBackrunProfit(params)
        console.debug("profit", profit.toFixed(0))
        assert(math.bignumber(profit).gt(0))
    })

    it('should find an obvious arb (x -> y)', () => {
        const params = {
            A: {
                reserves0: math.bignumber(1300000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            B: {
                reserves0: math.bignumber(1700000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            amountIn: math.bignumber(10000).mul(ETH),
            swapXForY: true,
        }
        console.debug(params)
        const profit = testBackrunProfit(params)
        console.debug("profit", utils.formatEther(profit.toFixed(0)))
        assert(math.bignumber(profit).gt(0))
    })

    it('should find an obvious arb (y -> x)', () => {
        const params = {
            A: {
                reserves0: math.bignumber(1300000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            B: {
                reserves0: math.bignumber(1700000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            amountIn: math.bignumber(1).mul(ETH),
            swapXForY: false,
        }
        console.debug(params)
        const profit = testBackrunProfit(params)
        console.debug("profit", utils.formatEther(profit.toFixed(0)))
        assert(math.bignumber(profit).gt(0))
    })

    it('should find an obvious arb ((x -> y) opposite exchange disparity)', () => {
        const params = {
            A: {
                reserves0: math.bignumber(1700000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            B: {
                reserves0: math.bignumber(1300000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            amountIn: math.bignumber(10000).mul(ETH),
            swapXForY: true,
        }
        console.debug(params)
        const profit = testBackrunProfit(params)
        console.debug("profit", utils.formatEther(profit.toFixed(0)))
        assert(math.bignumber(profit).gt(0))
    })

    it('should find an obvious arb ((y -> x) opposite exchange disparity)', () => {
        const params = {
            A: {
                reserves0: math.bignumber(1700000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            B: {
                reserves0: math.bignumber(1300000).mul(ETH),
                reserves1: math.bignumber(1000).mul(ETH),
            },
            amountIn: math.bignumber(1).mul(ETH),
            swapXForY: false,
        }
        console.debug(params)
        const profit = testBackrunProfit(params)
        console.debug("profit", utils.formatEther(profit.toFixed(0)))
        assert(math.bignumber(profit).gt(0))
    })

    // test
    // simulateSwap(reserves0, reserves1, k, math.bignumber(10000).mul(ETH), true, labels)
    // simulateSwap(reserves0, reserves1, k, math.bignumber(5).mul(ETH), false, labels)
})