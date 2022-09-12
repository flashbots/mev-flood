# mev-flood

## the game

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

#### Scripts

* **createWallets**: creates new `wallets.json` file populated w/ 100 wallets
* **fundWallets**: send 0.1 ETH to each wallet in `wallets.json` from admin wallet (`ADMIN_PRIVATE_KEY`)
* **sendPrivateTx**: send a private transaction to the bundle API
* **cancelPrivateTx**: cancel a private transaction sent to the bundle API given `txHash`
* **getBundleStats**: get bundle stats for a given `bundleHash`
* **getUserStats**: get user stats for admin wallet (`ADMIN_PRIVATE_KEY`)
* **sendProtectTx**: send a tx to Protect RPC
* **createTestBundle**: prints a test bundle without sending or signing it (txs are signed)

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

_Run dumb-search simulator with 5 accounts (careful, it currently sends to mempool without checking for profit):_

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
