import {Flags} from '@oclif/core'

export const floodFlags = {
  rpcUrl: Flags.string({
    char: 'r',
    description: 'HTTP JSON-RPC endpoint.',
    required: false,
    default: 'http://localhost:8545',
  }),
  privateKey: Flags.string({
    char: 'k',
    description: 'Private key used to send transactions and deploy contracts.',
    required: false,
    default: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  }),
  userKey: Flags.string({
    char: 'u',
    description: 'Private key for the user wallet used to send transactions',
    required: false,
    default: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' // hardhat/anvil[1]
  })
}
