# Binance balance plugin for ZenMoney

Read-only synchronization through the official Binance REST API.

By default it mirrors the top-level Binance wallets as separate USD-valued investment accounts:
- `Spot` — free assets plus amounts locked in Spot orders;
- `Funding` — the wallet used by Pay/P2P and related flows;
- `Earn` — Flexible and Locked Simple Earn positions combined;
- `Margin`, `Futures`, `Trading Bots`, `Copy Trading` — discovered automatically.

Balances include every asset that Binance can value through a direct USDT pair or a BTC/ETH/BNB bridge. USDC, FDUSD and other settlement assets use a live Binance quote when one exists instead of being permanently assumed to equal one USDT.

## Transactions

- completed on-chain deposits and withdrawals;
- Binance Pay and transfers by Binance ID;
- completed P2P buys and sells;
- Spot ↔ Funding transfers;
- Flexible and Locked Simple Earn subscriptions and redemptions.

Every imported operation has a deterministic Binance ID. Internal movements are balanced transfers between the corresponding ZenMoney accounts. Raw trading fills, bot events and daily market-price changes are intentionally not imported as household income or spending.

Binance limits Pay, P2P, internal wallet and Earn history. The plugin reads up to the latest 180 days on the first run and then continues incrementally from ZenMoney's last successful synchronization. External deposit and withdrawal history follows the selected start date.

## Setup

1. Binance → Account → API Management → Create API.
2. Choose a system-generated HMAC key with **Enable Reading** only.
3. Keep Spot & Margin Trading, Futures, and Withdrawals off.
4. Do not enable Universal Transfer: reading its history does not require permission to move funds.

Use a distinct account label for each connection, for example `Binance` and `Binance M`. The label is part of the stable account ID; changing it later creates a different set of ZenMoney accounts.
