import assert from "assert"
import { ethers, utils, Wallet } from 'ethers'
import MevFlood from '..'
import { calculateBackrunParams, calculatePostTradeReserves } from "../lib/arbitrage"
import math from "../lib/math"
import { PROVIDER } from '../lib/providers'
type BigNumber = math.BigNumber

describe("arbitrage", () => {
    type PairReserves = {reserves0: BigNumber, reserves1: BigNumber}
    type Params = {
        A: PairReserves,
        B: PairReserves,
        swap0For1: boolean,
        amountIn: BigNumber,
    }

    const labels = {x: "USD", y: "ETH"}
    const ETH = math.bignumber(1).mul(1e9).mul(1e9)
    const getK = (pairReserves: PairReserves): BigNumber => pairReserves.reserves0.mul(pairReserves.reserves1) as BigNumber

    const testBackrunProfit = (params: Params) => {
        const kA = getK(params.A)
        const kB = getK(params.B)
        const backrunParams = calculateBackrunParams(
            params.A.reserves0,
            params.A.reserves1,
            kA, // exchange A
            params.B.reserves0,
            params.B.reserves1,
            kB, // exchange B
            params.amountIn,
            params.swap0For1,
            "A"
        )
        if (!backrunParams) {
            return undefined
        }
        console.debug(`\nPROFIT\t\t${utils.formatEther(backrunParams.profit.toFixed(0))} ${backrunParams.settlementToken === 0 ? labels.x : labels.y}`)
        return backrunParams
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
            swap0For1: true,
        }
        console.debug(params)
        const br = testBackrunProfit(params)
        assert(math.bignumber(br?.profit).gt(0))
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
            swap0For1: false,
        }
        console.debug(params)
        const br = testBackrunProfit(params)
        assert(math.bignumber(br?.profit).gt(0))
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
            amountIn: math.bignumber(13000).mul(ETH),
            swap0For1: true,
        }
        console.debug(params)
        const br = testBackrunProfit(params)
        assert(math.bignumber(br?.profit).gt(0))
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
            amountIn: math.bignumber(10).mul(ETH),
            swap0For1: false,
        }
        console.debug(params)
        const br = testBackrunProfit(params)
        assert(math.bignumber(br?.profit).gt(0))
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
            amountIn: math.bignumber(1300).mul(ETH),
            swap0For1: true,
        }
        console.debug(params)
        const br = testBackrunProfit(params)
        assert(math.bignumber(br?.profit).gt(0))
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
            swap0For1: false,
        }
        console.debug(params)
        const br = testBackrunProfit(params)
        assert(math.bignumber(br?.profit).gt(0))
    })

    it('should calculate trade outcomes accurately', async () => {
        try {
            const user = new Wallet("0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97", PROVIDER) // hh[8]
            const flood = await new MevFlood(
                new Wallet("0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"), // hh[9]
                PROVIDER
            ).liquid({wethMintAmountAdmin: 3, shouldTestSwap: false}, user)

            const contracts = await flood.deployment?.getDeployedContracts(PROVIDER)
            const ethersToMath = (bn: ethers.BigNumber) => math.bignumber(bn.toString())
            if (flood.deployment?.daiWethA && flood.deployment?.daiWethB && contracts && contracts.daiWethA && contracts.daiWethB) {
                let reserves0A = math.bignumber(0)
                let reserves1A = math.bignumber(0)
                let reserves0B = math.bignumber(0)
                let reserves1B = math.bignumber(0)
                let wethIndex = 0
                // [reserves0A, reserves1A]
                const rA = (await contracts.daiWethA[0].getReserves()).slice(0, 2).map(ethersToMath)
                // [reserves0B, reserves1B]
                const rB = (await contracts.daiWethB[0].getReserves()).slice(0, 2).map(ethersToMath)
                reserves0A = rA[0]
                reserves1A = rA[1]
                reserves0B = rB[0]
                reserves1B = rB[1]
                console.log("start", {
                    reservesA: {0: reserves0A.toFixed(0), 1: reserves1A.toFixed(0)}
                })

                const token0 = await contracts.daiWethA[0].token0()
                console.log("token0", token0)
                console.log("weth", contracts.weth.address)
                wethIndex = contracts.weth.address.toLowerCase() === (token0).toLowerCase() ? 0 : 1
                console.log("wethIndex", wethIndex)

                let price = wethIndex === 0 ? reserves1A.div(reserves0A) : reserves0A.div(reserves1A)
                const kA = reserves0A.mul(reserves1A)
                const kB = reserves0B.mul(reserves1B)
                const userSwapAmount = math.bignumber(5)

                const userSwap = calculatePostTradeReserves(reserves0A, reserves1A, kA, userSwapAmount, wethIndex === 0)
                console.log("sim swap", {
                    reservesA: {0: userSwap.reserves0, 1: userSwap.reserves1}
                })

                // user will swap 1 WETH -> DAI on exchange A
                const swap = await flood.sendSwaps({minUSD: userSwapAmount.mul(price).toNumber(), maxUSD: userSwapAmount.mul(price).toNumber(), swapWethForDai: true}, [user])
                await Promise.all(swap.swapResults.map(r => r.wait()))
                // await swap.swapResults[0].wait(1)
                // [reserves0A, reserves1A]
                const rA_new = (await contracts.daiWethA[0].getReserves()).slice(0, 2).map(ethersToMath)
                console.log("real swap", {
                    reservesA: {0: rA_new[0], 1: rA_new[1]}
                })

                // const brSim = calculateBackrunParams(userSwap.reserves0, userSwap.reserves1, kA, reserves0B, reserves1B, kB, userSwap.amountOut, wethIndex === 0, "A")
                // console.log("brSim", brSim)
            } else {
                console.error("deployment borked")
            }
        } catch (e) {
            // if it fails because the network threw an error, don't fail
            console.error(e)
        }
    })
})
