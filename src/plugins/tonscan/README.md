# TON Scan

Read-only synchronization of public TON wallets through the official TON
Center API v3. The plugin imports the native TON balance and transfers, plus
the verified TON USDT Jetton balance and transfers.

## Setup

1. Copy the public address of a regular TON wallet or TON Space wallet.
2. Enter one or more addresses separated by commas.
3. Choose the history start date.

No seed phrase, private key or withdrawal permission is required. Never enter
a recovery phrase into ZenMoney or any third-party integration.

## Telegram Wallet limitation

Telegram may expose two different products:

- TON Space or another self-custody wallet has a public TON address and can be
  synchronized by this plugin.
- A custodial Telegram Wallet balance is maintained by the provider. If it
  does not give the user a dedicated on-chain address and complete on-chain
  history, a blockchain scanner cannot reconstruct that internal ledger.

## Imported data

- Native TON wallet balance and transfers.
- Official TON USDT Jetton balance and confirmed transfers.
- Multiple public wallet addresses in one connection.

Unsupported Jettons are intentionally ignored to keep spam tokens and crypto
dust out of ZenMoney. Aborted Jetton transfers are ignored. Transaction IDs
include the transfer-specific TON fields so multiple Jetton movements in one
blockchain transaction cannot overwrite each other.
