# MEXC

Read-only MEXC Spot balance plugin for ZenMoney.

## API key

Create an API key in MEXC and enable only:

- **Spot → Account → View account information**
- **Withdrawal → View deposit/withdrawal details**

Do not enable trading, withdrawal or transfer actions. The second permission is read-only despite being grouped under Withdrawal in the MEXC interface.

## Scope

The plugin creates one exchange-native **MEXC Spot** account denominated in USDT and values available/locked assets using MEXC market prices. USD-pegged stablecoin transfers are imported at nominal 1:1 parity with USDT; this is an accounting convention, not a guarantee that pegs never move. External deposit and withdrawal history is limited by MEXC to the latest 90 days and queried in windows shorter than seven days. A full window of 1,000 records is split automatically to avoid silent truncation. Individual spot trades are intentionally omitted from the household budget.
