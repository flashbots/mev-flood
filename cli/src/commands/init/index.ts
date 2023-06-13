import { Command, Flags } from '@oclif/core'
import { getFlood } from '../../helpers/mevFlood'
import { floodFlags } from '../../helpers/flags'

export default class Hello extends Command {
  static description = 'Deploy smart contracts and provision liquidity on UniV2 pairs.'

  static flags = {
    ...floodFlags,
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
    const {ownerWallet, userWallet, flood} = getFlood(flags)
    this.log(`connected to ${flags.rpcUrl} with owner ${ownerWallet.address} and user ${userWallet.address}`)
    const deployment = await flood.liquid({
        wethMintAmountAdmin: flags.wethMintAmountOwner,
        wethMintAmountUser: flags.wethMintAmountUser,
    }, userWallet)
    await deployment.deployToMempool()
    this.log("liquidity deployed via mempool")
  }
}
