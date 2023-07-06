oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g mevflood
$ mevflood COMMAND
running command...
$ mevflood (--version)
mevflood/0.0.4 linux-x64 node-v20.2.0
$ mevflood --help [COMMAND]
USAGE
  $ mevflood COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`mevflood help [COMMANDS]`](#mevflood-help-commands)
* [`mevflood init`](#mevflood-init)
* [`mevflood spam`](#mevflood-spam)

## `mevflood help [COMMANDS]`

Display help for mevflood.

```
USAGE
  $ mevflood help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for mevflood.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.9/src/commands/help.ts)_

## `mevflood init`

Deploy smart contracts and provision liquidity on UniV2 pairs.

```
USAGE
  $ mevflood init [-r <value>] [-k <value>] [-u <value>] [-a <value>] [-s <value>]

FLAGS
  -a, --wethMintAmount=<value>  [default: 1000] Integer amount of WETH to mint for the owner account.
  -k, --privateKey=<value>      [default: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80] Private
                                key used to send transactions and deploy contracts.
  -r, --rpcUrl=<value>          [default: http://localhost:8545] HTTP JSON-RPC endpoint.
  -s, --saveFile=<value>        Save the deployment details to a file.
  -u, --userKey=<value>         [default: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d] Private
                                key for the user wallet used to send transactions

DESCRIPTION
  Deploy smart contracts and provision liquidity on UniV2 pairs.
```

_See code: [dist/commands/init/index.ts](https://github.com/flashbots/mev-flood/blob/v0.0.4/dist/commands/init/index.ts)_

## `mevflood spam`

Send a constant stream of UniV2 swaps.

```
USAGE
  $ mevflood spam [-r <value>] [-k <value>] [-u <value>] [-t <value>] [-b <value>] [-l <value>]

FLAGS
  -b, --bundlesPerSecond=<value>  [default: 1] Number of bundles to send per second.
  -k, --privateKey=<value>        [default: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80] Private
                                  key used to send transactions and deploy contracts.
  -l, --loadFile=<value>          Load the deployment details from a file.
  -r, --rpcUrl=<value>            [default: http://localhost:8545] HTTP JSON-RPC endpoint.
  -t, --txsPerBundle=<value>      [default: 2] Number of transactions to include in each bundle.
  -u, --userKey=<value>           [default: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d] Private
                                  key for the user wallet used to send transactions

DESCRIPTION
  Send a constant stream of UniV2 swaps.
```

_See code: [dist/commands/spam/index.ts](https://github.com/flashbots/mev-flood/blob/v0.0.4/dist/commands/spam/index.ts)_
<!-- commandsstop -->
