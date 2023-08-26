import {Command, Flags} from '@oclif/core'
import {providers, Wallet} from 'ethers'

import {floodFlags} from '../../helpers/flags'
import MevFlood, {spam} from '../../../../core/build'
import {SendRoute} from '../../../../core/build/lib/cliArgs'
import {getDeploymentDir} from '../../helpers/files'

export default class Spam extends Command {
  static description = 'Send a constant stream of UniV2 swaps.'

  static flags = {
    ...floodFlags,
    sendRoute: Flags.string({
      char: 's',
      description: 'Route for the transactions ("mempool", "flashbots", "mevshare").',
      required: false,
      default: "mempool",
    }),
    txsPerBundle: Flags.integer({
      char: 't',
      description: 'Number of transactions to include in each bundle.',
      required: false,
      default: 2,
    }),
    secondsPerBundle: Flags.integer({
      char: 'p',
      description: 'Seconds to wait before sending another bundle.',
      required: false,
      default: 12,
    }),
    loadFile: Flags.string({
      char: 'l',
      description: 'Load the deployment details from a file.',
      required: false,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Spam)
    const provider = new providers.JsonRpcProvider(flags.rpcUrl)
    await provider.ready
    const wallet = new Wallet(flags.privateKey, provider)
    const deployment = flags.loadFile ? await MevFlood.loadDeployment(getDeploymentDir(flags.loadFile)) : undefined
    const flood = new MevFlood(wallet, provider, deployment)
    this.log(`connected to ${flags.rpcUrl} with wallet ${wallet.address}`)

    await spam.spamLoop(flood, wallet, {
      txsPerBundle: flags.txsPerBundle,
      sendRoute: flags.sendRoute as SendRoute,
      secondsPerBundle: flags.secondsPerBundle,
    })
  }
}
