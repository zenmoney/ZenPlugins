# OKX

Read-only OKX wallets for ZenMoney. The plugin shows the exchange-native **Trading**, **Funding**, and **Savings** wallets separately.

Create an API key in **Profile → API keys**, set a passphrase, and grant **Read** permission only. Leave trading, transfers and withdrawals disabled.

Choose the region where the OKX account was registered. The plugin uses only official API domains; users never enter an API URL manually:

- Global — `openapi.okx.com`
- European Economic Area — `eea.okx.com`
- United States / Australia — `us.okx.com`
- Türkiye — `tr.okx.com`

The plugin values all supported assets in USDT terms, keeps Trading, Funding and Savings separate, and imports completed external deposits and withdrawals with stable IDs. History requests are paginated within the selected date range, so they are not limited to the latest 100 records. Trading fills and Earn accrual noise are intentionally not copied into a household budget.
