# BingX

Read-only BingX wallets and transfers for ZenMoney.

Create an API key in BingX API Management with read access only. Do not enable trading, transfers or withdrawals.

The plugin uses BingX's USDT-valued account overview and creates the exchange-native sections available to the user: Fund / Spot, Standard Futures, USDT-M Futures, Coin-M Futures, Copy Trading, Grid Bots, Wealth and C2C. It imports confirmed external deposits and withdrawals with stable IDs.

Confirmed transfers between Fund, Standard Futures and USDT-M Futures are represented as balanced transfers between the user's own ZenMoney accounts. They have no income or spending effect. Individual trades, futures PnL events and Wealth accrual noise are intentionally not copied into the household budget.
