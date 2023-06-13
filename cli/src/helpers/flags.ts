import { Flags } from '@oclif/core';

export const floodFlags = {
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
}
