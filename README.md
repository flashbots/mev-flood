# mev-flood

## the game

Call `bid`, placing a bet by setting `value`, and send the highest bid (which may be in _addition_ to others' bids in the block) before calling `claim`. The winner (the person who called bid with the highest `value` this round), upon calling `claim` gets the entire balance of the contract. `claim` will also only pay out if you placed the _most recent_ bid.

## setup

```sh
yarn install
cp .env.example .env
vim .env
```

Generate test accounts:

```sh
yarn script.createWallets
```

Fund test accounts (careful, it sends 0.1 ETH to 100 accounts):

```sh
yarn script.fundWallets
```

Run simulator with 5 accounts (careful, it currently sends to mempool without checking for profit):

```sh
yarn dev 0 4
```
