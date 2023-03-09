import { Contract } from 'ethers'
import UniV2Factory from '../contractsBuild/UniswapV2Factory.sol/UniswapV2Factory.json'
import UniV2Pair from '../contractsBuild/UniswapV2Pair.sol/UniswapV2Pair.json'
import UniV2Router from '@uniswap/v2-periphery/build/UniswapV2Router02.json'
import DAI from '../contractsBuild/DAI.sol/DAI.json'
import AtomicSwap from '../contractsBuild/atomicSwap.sol/AtomicSwap.json'
import AtomicLottery from '../contractsBuild/atomic_lottery.sol/AtomicLottery.json'
import LotteryMEV from '../contractsBuild/lottery_mev.sol/LotteryMEV.json'
import WETH from '../contractsBuild/weth.sol/WETH9.json'

export const getContract = (contract: {address: (chainId: number) => string, abi: any}, chainId: number) => {
  if (!contract.address || !contract.abi) {
      return undefined
  }
  return new Contract(contract.address(chainId), contract.abi)
}

export type ContractSpec = {
    address?: (chainId: number) => string,
    abi?: any[],
    bytecode?: string | any,
}

export default {
    AtomicLottery: {
        abi: AtomicLottery.abi,
        bytecode: AtomicLottery.bytecode,
    },
    AtomicSwap: {
      abi: AtomicSwap.abi,
      bytecode: AtomicSwap.bytecode,
    },
    LotteryMEV: {
        address: (chainId: number) =>
            chainId === 11155111 ? "0x1560949ba54689d5e4eF8D5d6162905B5663Cd54" :
            chainId === 5 ? "0x1B8810316B4bcb959369C9031778d41757CC1210" :
            "",
        abi: LotteryMEV.abi,
        bytecode: LotteryMEV.bytecode,
    },
    DAI: {
        address: (chainId: number) => chainId === 1 ? "0x6B175474E89094C44Da98b954EedeAC495271d0F" : "",
        abi: DAI.abi,
        bytecode: DAI.bytecode,
    },
    WETH: {
        address: (chainId: number) =>
            chainId === 11155111 ? "0xe2258541f30e991b96ef73068af258d29f8cae55" :
            chainId === 1 ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" :
            chainId === 5 ? "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6" :
            "",
        abi: WETH.abi,
        bytecode: WETH.bytecode,
    },
    UniV2Router: {
        address: (chainId: number) => chainId <= 5 ? "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" : "",
        abi: UniV2Router.abi,
        bytecode: UniV2Router.bytecode,
    },
    UniV2Factory: {
        abi: UniV2Factory.abi,
        bytecode: UniV2Factory.bytecode,
    },
    UniV2Pair: {
        // abi: UniV2Pair.abi,
        // bytecode: UniV2Pair.bytecode,
        ...UniV2Pair,
    },
}
