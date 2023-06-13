import { Command, Flags } from '@oclif/core'
import { floodFlags } from '../../helpers/flags'
import { Wallet, providers } from 'ethers'
import MevFlood from '../../../../core/build'

export default class Init extends Command {
  static description = 'Deploy smart contracts and provision liquidity on UniV2 pairs.'

  static flags = {
    ...floodFlags,
    wethMintAmount: Flags.integer({
      char: 'a',
      description: "Integer amount of WETH to mint for the owner account.",
      required: false,
      default: 1000,
    }),
    saveFile: Flags.string({
      char: 's',
      description: "Save the deployment details to a file.",
      required: false,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Init)
    const provider = new providers.JsonRpcProvider(flags.rpcUrl)
    const wallet = new Wallet(flags.privateKey, provider)
    const flood = new MevFlood(wallet, provider)
    this.log(`connected to ${flags.rpcUrl} with wallet ${wallet.address}`)
    const deployment = await flood.liquid({
        wethMintAmountAdmin: flags.wethMintAmountOwner,
        wethMintAmountUser: flags.wethMintAmountUser,
    })
    await deployment.deployToMempool()
    this.log("liquidity deployed via mempool")
    if (flags.saveFile) {
        await flood.saveDeployment(flags.saveFile)
        this.log(`deployment saved to ${flags.saveFile}`)
    }
  }
}
