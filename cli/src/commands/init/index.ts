import {Command, Flags} from '@oclif/core'
import { Wallet, providers } from 'ethers'
import MevFlood from "../../../../core"

export default class Hello extends Command {
  static description = 'Deploy smart contracts and provision liquidity on UniV2 pairs.'

  static examples = [
    `$ mevflood init
`,
  ]

  static flags = {
    rpcUrl: Flags.string({
      char: 'r',
      description: 'HTTP JSON-RPC endpoint.',
      required: false,
      default: "http://localhost:8545"
    }),
    ownerKey: Flags.string({
      char: 'o',
      description: "Contract owner's private key.",
      required: false,
      default: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    }),
    userKey: Flags.string({
      char: 'u',
      description: "Private key of account that sends swaps.",
      required: false,
      default: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    }),
    wethMintAmountOwner: Flags.integer({
      char: 'a',
      description: "Integer amount of WETH to mint for the owner account.",
      required: false,
      default: 1000,
    }),
    wethMintAmountUser: Flags.integer({
      char: 'b',
      description: "Integer amount of WETH to mint for the user account.",
      required: false,
      default: 100,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Hello)
    const provider = new providers.JsonRpcProvider(flags.rpcUrl)
    const userWallet = new Wallet(flags.userKey, provider)
    const adminWallet = new Wallet(flags.ownerKey, provider)
    this.log(`connected to ${flags.rpcUrl} with owner ${adminWallet.address} and user ${userWallet.address}`)

    const flood = new MevFlood(adminWallet, provider)
    const deployment = await flood.liquid({
        wethMintAmountAdmin: flags.wethMintAmountOwner,
        wethMintAmountUser: flags.wethMintAmountUser,
    }, userWallet)
    await deployment.deployToMempool()
    this.log("liquidity deployed via mempool")
  }
}
