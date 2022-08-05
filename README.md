# mev-flood

## the game

Call `bid`, sending the most ETH (set `value`) (which may be in _addition_ to others' bids in the block) before calling `claim`. The winner (the person who called bid with the highest `value`), upon calling `claim` gets the entire balance of the contract.

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
