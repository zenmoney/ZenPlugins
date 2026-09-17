# Bitget

Read-only Bitget wallet balances and external transfers for ZenMoney. The account overview endpoint returns the exchange-native Spot, Funding, Earn, Futures, Margin and Bots sections that are available for the connected account, already valued by Bitget in USDT.

Create a Bitget API key in **API Management**, choose a passphrase, and enable read access only. Leave trading, transfers and withdrawals disabled. The plugin supports the documented Classic account overview; Bitget recommends Unified Trading Account for newly migrated users, which will be handled separately when its read-only wallet coverage is equivalent.

Completed external deposits and withdrawals are loaded in API-compliant date windows, paginated with Bitget order IDs and imported with stable IDs. Individual trades and bot operations are intentionally omitted from the household budget. Bitget Card activity is not imported because Bitget does not currently publish a supported card-history API for third-party clients.
