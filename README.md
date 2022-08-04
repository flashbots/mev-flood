# mev-flood

Setup:

```sh
cd dumb-searcher
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
