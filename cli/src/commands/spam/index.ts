import {Command, Flags} from '@oclif/core'
import {providers, Wallet} from 'ethers'

import {floodFlags} from '../../helpers/flags'
import MevFlood, {spam} from '../../../../core/build'
import {SendRoute} from '../../../../core/build/lib/cliArgs'
import {getDeploymentDir} from '../../helpers/files'
import {TxStrategy} from '../../../../core/build/lib/scripts/spam'

export default class Spam extends Command {
  static description = 'Send a constant stream of UniV2 swaps.'

  static flags = {
    ...floodFlags,
    txsPerBundle: Flags.integer({
      char: 't',
      description: 'Number of transactions to include in each bundle.',
      required: false,
      default: 1,
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
    revert: Flags.boolean({
      description: 'Send reverting transactions.',
      required: false,
      default: false,
    }),
    sendTo: Flags.string({
      char: 's',
      description: 'Where to send transactions. (' + Object.keys(SendRoute).filter(k => Number.isNaN(k)).map(k => k.toLowerCase()).reduce((a, b) => a + ', ' + b) + ')',
      required: false,
      default: 'mempool',
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
    const txStrategy = flags.revert ? TxStrategy.UniV2Reverting : TxStrategy.UniV2
    const sendTo = flags.sendTo.toLowerCase()

    await spam.spamLoop(flood, wallet, {
      txsPerBundle: flags.txsPerBundle,
      sendRoute: sendTo === 'flashbots' ? SendRoute.Flashbots : (sendTo === 'mevshare' ? SendRoute.MevShare : SendRoute.Mempool),
      secondsPerBundle: flags.secondsPerBundle,
      txStrategy,
    })
  }
}
