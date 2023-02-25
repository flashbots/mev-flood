# mev-flood

A collection of tools to simulate MEV activity on EVM-based networks.

## the library

This project's primary export is `MevFlood`, a library that manages deployment of, and interaction with a UniswapV2 environment.

```typescript
import MevFlood from "mev-flood"

const adminWallet = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
const provider = new providers.JsonRpcProvider("http://localhost:8545")

const flood = new MevFlood(adminWallet, provider)
```

### Fund Wallets

This script sends the specified amount to each wallet from the admin account.

```typescript
const userWallet = new Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d")
await flood.fundWallets([userWallet], 5) // send 5 ETH to userWallet
```

### Deployments

`MevFlood` interacts with a class `LiquidDeployment` which is a wrapper for interacting with contracts. A LiquidDeployment must be initialized in the `MevFlood` instance for most features to work.

#### Create a New Liquid deployment

This will deploy all contracts of a full Uniswap V2 system:

```typescript
// LiquidDeployment is stored internally in `flood` upon completion
const liquid = await flood.liquid()

// send deployment via one of the callbacks
// await liquid.deployToFlashbots()
await liquid.deployToMempool()
```

You can also specify options to modify what the liquid script does or doesn't do.

```typescript
type LiquidParams = {
  shouldApproveTokens?: boolean,
  shouldDeploy?: boolean,
  shouldBootstrapLiquidity?: boolean,
  shouldMintTokens?: boolean,
  wethMintAmountAdmin?: number,
  wethMintAmountUser?: number,
  numPairs?: number,
}
```

For example, we can use liquid to mint more WETH into a user's account:

```typescript
await (await flood.liquid({
  shouldDeploy: false,
  shouldBootstrapLiquidity: false,
  wethMintAmountAdmin: 0,
  wethMintAmountUser: 13.37, // mint 13.37 WETH using user's ETH balance
}, userWallet))
.deployToMempool()
```

We can also send deployments to Flashbots instead of the mempool. We just have to initialize the Flashbots provider first:

```typescript
// account used to sign payloads to Flashbots, should not contain any ETH
const flashbotsSigner = new Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")
await liquid.initFlashbots(flashbotsSigner)
await (await flood.liquid({}, userWallet)).deployToFlashbots()
```

#### Load & Save Deployment

Deployments can be saved to disk so that you can use the same environment continually.

Save:

```typescript
await liquid.saveDeployment("deployment.json")
```

Load:

```typescript
const flood = new MevFlood(adminWallet, provider).withDeploymentFile("deployment.json")
```

You can also use the raw LiquidDeployment object to instantiate an MevFlood instance:

```typescript
const liquid = await flood.liquid()
...
// assume `flood` is now out of scope
const flood = new MevFlood(adminWallet, provider, liquid.deployment)
```

Alternatively, you can hot-swap deployments:

```typescript
await flood.withDeployment(liquid.deployment).deployToMempool()
```

### swaps

MevFlood can facilitate the sending of UniV2 swaps from an array of specified accounts.

```typescript
const swaps = await flood.generateSwaps({}, [userWallet])
await swaps.sendToMempool()
```

Swaps have many options that enable you to test your strategy with certainty, or conversely, increase entropy (your choice!):

```typescript
type SwapOptions = {
    minUSD?: number,
    maxUSD?: number,
    swapOnA?: boolean,
    daiIndex?: number, // useful if you deployed >1 DAI tokens in the deploy step (using the `numPairs` option)
    swapWethForDai?: boolean,
}
```

Example:

```typescript
const swaps = await flood.generateSwaps({
  minUSD: 5000,
  maxUSD: 5000,
  swapOnA: true,
  swapWethForDai: true,
}, [userWallet])
await swaps.sendToMempool()
```

### backruns

MevFlood contains an arbitrage engine that will attempt to create a transaction that arbitrages tokens from a user's trade by backrunning.

```typescript
// most likely you want to send backruns to Flashbots
await flood.initFlashbots(flashbotsSigner)

provider.on('pending', async pendingTx => {
  const pendingTx = provider.getPendingTransactions
  const backrun = await flood.backrun(pendingTx)

  // `sendToFlashbots` throws an error if `initFlashbots` hasn't been called on the MevFlood instance
  await backrun.sendToFlashbots()
})
```

> The backrun tx is sent from the `adminWallet` account used to instantiate `MevFlood`.

Backruns have some optionality to give you more control when you need it:

```typescript
type BackrunOptions = {
    minProfit?: BigNumber,
    maxProfit?: BigNumber,
    userPairReserves?: Reserves, // pre-trade reserves of pair that user swaps on; used to calculate optimal arb
    nonce?: number, // override nonce used for backrun tx
}
```

```typescript
provider.on('pending', async pendingTx => {
  const pendingTx = provider.getPendingTransactions
  const backrun = await flood.backrun(pendingTx, {
    minProfit: 0.05, // minimum 0.05 ETH estimated profit to execute
  })
  await backrun.sendToFlashbots()
})
```

## the game

This repository originally started here. This is a game that simulates MEV-like activity, but it's not very applicable to the real world.

> Note: `MevFlood` does not export any of this functionality.

Call `bid`, placing a bet by setting `value`, and send the highest bid (which may be in _addition_ to others' bids in the block) before calling `claim`. The winner (the person who called bid with the highest `value` this round), upon calling `claim` gets the entire balance of the contract, at which point `highest_bid` (also the minimum to land a new bid) resets (to 1 gwei). `claim` will also only pay out if you placed the _most recent_ bid.

## system details

![mev-flood system diagram](docs/sys-diagram.jpg)

mev-flood is a multi-daemon project, and is designed to be run in parallel with other instances, each using the same source code but different params.

### features

* 100 test accounts to send from (excluding accounts set in .env)
* `claim` does not revert when called by a non-winner (on purpose, to add technical complexity to the game)

#### Daemons

* **dumb-search:** blindly sends bid (constant `value`) & claim txs on every block
  * helpful for stress-testing on testnet (don't run on mainnet!)
  * mostly fails and wastes money on bids (for others to take)
  * sends to FB builder, may also send to mempool (pending how/what we want to test)
* **smart-search:** finds winning bid amount and uses a smart contract that atomically executes bid+claim to win the pool
  * helpful for stress-testing on testnet (don't run on mainnet!)
  * if only one instance is run, it's practically guaranteed to win every round
  * if more than one instance is run, they will generate "conflicting" bundles
    * technically all the bundles will land but their profits will be affected by who gets included first
* **fake-search** sends a uniswap v2 swap that will always revert
  * helpful for early testing (not stress-testing)
  * mainnet-friendly (use an empty account for `ADMIN_PRIVATE_KEY`)
  * this sends a single-transaction bundle to Flashbots from the admin wallet (env: `ADMIN_PRIVATE_KEY`)
* **swapd** generates a random swap for each wallet in the specified array, for every new block

#### Scripts

* **createWallets**: creates new `wallets.json` file populated w/ 100 wallets
* **fundWallets**: send 0.1 ETH to each wallet in `wallets.json` from admin wallet (`ADMIN_PRIVATE_KEY`)
* **sendPrivateTx**: send a private transaction to the bundle API
* **cancelPrivateTx**: cancel a private transaction sent to the bundle API given `txHash`
* **getBundleStats**: get bundle stats for a given `bundleHash`
* **getUserStats**: get user stats for admin wallet (`ADMIN_PRIVATE_KEY`)
* **sendProtectTx**: send a tx to Protect RPC
* **createTestBundle**: prints a test bundle without sending or signing it (txs are signed)
* **liquid**: bootstrap a complete uniswap v2 environment

Scripts with optional params are explained with the `help` flag:

```sh
yarn script.sendProtectTx --help
yarn script.sendPrivateTx --help
yarn script.cancelPrivateTx --help
```

## setup

```sh
yarn install

# pick your poison:
cp .env.example .env.goerli
cp .env.example .env.sepolia
cp .env.example .env.mainnet

vim .env.goerli
vim .env.sepolia
vim .env.mainnet
```

_Set preferred environment:_

```sh
export NODE_ENV=sepolia
```

_Generate test accounts:_

```sh
mkdir src/output
yarn script.createWallets
```

_Fund test accounts (careful, it sends 0.1 ETH to 100 accounts):_

```sh
yarn script.fundWallets
```

## run

_Run dumb-search simulator with 5 accounts (careful, it currently sends without checking for profit):_

```sh
yarn dumb-dev 0 5
```

Note: 5 is the _exclusive_ end index, meaning that arguments (`0 5`) will use `wallets[0, 1, 2, 3, 4]`.

_Run smart-search simulator._

```sh
yarn smart-dev
```

_Run fake-search simulator._

```sh
yarn fake-dev
```

### help

Daemons that have params/options include the `help` flag:

```sh
yarn dumb-dev --help
yarn smart-dev --help
```

### production builds

```sh
yarn build
yarn dumb-search $i $j
yarn smart-search $i $j
yarn fake-search
```

### mempool testing

You might need to use the mempool to test your transactions' validity before trying to use the bundle API.

```sh
yarn dumb-dev 13 14 mempool
yarn smart-dev 13 14 mempool
```

### stress-test example

_Run 49 dumb searchers and 2 smart searchers (a relatively realistic case):_

```sh
# terminal 1 (49 test wallets)
yarn dumb-dev 0 49

# terminal 2 (49 test wallets)
yarn dumb-dev 49 98

# terminal 3 (2 test wallets)
yarn smart-dev 98 100
```

### Generate random orderflow on univ2 environment

```sh
# if you haven't already, deploy univ2 environment
yarn script.liquid

# if you haven't already, fund your wallets
yarn script.fundWallets

# generate orderflow w/ 10 wallets
yarn swapd 10 20
```

_Note: if you didn't run `yarn build` you can run `yarn swapd-dev` instead of `yarn swapd`._

### other features

_Get bundle stats:_

```sh
yarn script.getBundleStats 0x40d83aebb63f61730eb6309e1a806624cf6d52ff666d1b13d5ced535397f9a46 0x7088e9
# alternatively you can use int block number
yarn script.getBundleStats 0x40d83aebb63f61730eb6309e1a806624cf6d52ff666d1b13d5ced535397f9a46 7375081
```

_Send private tx:_

```sh
# send a lottery tx
yarn script.sendPrivateTx

# send a reverting univ2 swap
yarn script.sendPrivateTx dummy
```

_Cancel private tx:_

```sh
yarn script.cancelPrivateTx 0xca79f3114de50a77e42dd595c0ba4e786d3ddf782c62075ec067fe32329e3ea2
```

_Print a test bundle (sends ETH from test wallet to itself):_

```sh
yarn script.createTestBundle
```

_Send tx to Protect:_

```sh
yarn script.sendProtectTx

# send uniswapV2 router tx to Protect (works on any chain)
yarn script.sendProtectTx dummy

# send lottery contract tx to Protect with fast mode
yarn script.sendProtectTx fast

# send uniswapV2 router tx to Protect w/ fast mode
yarn script.sendProtectTx fast dummy
# or
yarn script.sendProtectTx dummy fast
```

_Bootstrap a uniswap V2 environment:_

```sh
yarn script.liquid
```

In addition to deploying the contracts to the environment specified by NODE_ENV, this script will create a file at `src/output/uniBootstrap.json` containing all the details of the deployment, including pre-calculated contract addresses and a list of all signed transactions.
