# Bybit Card plugin for ZenMoney

Synchronizes the **Bybit Card** with ZenMoney via the public Bybit V5 REST API, using a read-only API key + secret.

## What it imports

- One ZenMoney credit-card account (`ccard`): **Bybit Card**.
  - Stable id: `bybit_card`.
  - Instrument: `USD`.
  - Balance: the card's estimated spending power:
    - the "one-click" USDT-worth (`uBalance`) returned by the [Convert coin list](https://bybit-exchange.github.io/docs/v5/asset/convert/convert-coin-list) for configured Funding coins (`USDT`, `USDC`);
    - Funding `USD` fiat (added automatically, 1:1);
    - the redeemable `availableAmount` returned by [Flexible Earn positions](https://bybit-exchange.github.io/docs/v5/finance/earn/easy-onchain/position) for the same configured stablecoins.
  - Bybit does not expose the card's Auto-Deduction switch through the public API. Configure only coins that are selected for card payment with Auto-Deduction enabled; otherwise the estimate can exceed the actual spending power.
  - Skip in ZenMoney: `bybit_card`.
- Card transactions from [`POST /v5/card/transaction/query-asset-records`](https://bybit-exchange.github.io/docs/v5/bybit-card/asset-records).
  - `SIDE_QUERY_FINANCIAL_ALL` is used for posted card transactions.
  - `SIDE_QUERY_AUTH` is queried for the requested date range and only in-progress authorizations (`tradeStatus=0`) are imported, so new card payments appear as ZenMoney holds before posting.
  - Each transaction's movement `sum` is the **total USD amount including fees** (`basicAmount` in `basicCurrency`, expected to be `USD`).
  - `invoice` is the original fiat transaction amount (`transactionCurrencyAmount` in `transactionCurrency`) only when that currency differs from the USD card account; otherwise it is `null`.
  - ZenMoney's final plugin API has no separate fee field. Bybit's fees are already included in `basicAmount`, so the exact total balance effect is preserved without a separate fee annotation.
  - Merchant title and MCC are mapped to ZenMoney's native fields. Category, city, and country are also retained in the comment because ZenMoney's final plugin serializer has no fields for them. Bybit does not provide merchant coordinates.
  - Authorizations (`side=1`) and any in-progress transactions (`tradeStatus=0`) are marked as holds.
  - Declined (`tradeStatus=2`), reversal (`tradeStatus=3`), authorization-reversal (`side=2`), unDeduct-refund (`side=4`), and various `*-reversal` / `*-request` sides are filtered out to avoid double-counting.

## How to create the API key

1. Sign in to [bybit.com](https://www.bybit.com) → click your avatar → **API**.
2. Click **Create New Key** → **System-generated API Keys** → **API Transaction**.
3. Set **API Key Permissions** to **Read-Only**.
4. Enable:
   - **Bybit Card** (this is the scope required by `/v5/card/transaction/query-asset-records`).
   - **Earn** → *Earn* (read-only; required to include redeemable Flexible Earn in card spending power).
   - **Wallet** → *Account Transfer* and *Subaccount Transfer* (so the funding-wallet balance probe works).
   - **Exchange** → *Exchange History* (read-only; required by `/v5/asset/exchange/query-coin-list`, which provides the one-click `uBalance` used for the aggregated USD balance).
5. **Do NOT** enable any trading, derivatives, or withdrawal permissions. Read-only "Exchange History" alone does not allow executing convert/exchange orders.
6. Optionally restrict the key by IP for extra safety.
7. Copy the **API Key** and **API Secret** (the secret is shown only once) and paste them into the plugin's preferences.
8. Select the official API host for the account region. The global default is
   `https://api.bybit.com`; Kazakhstan accounts use `https://api.bybit.kz`.

## Limitations

- The plugin imports the side codes listed above. If Bybit introduces new `side` values or renames the existing ones, the `SIDE_SIGN` whitelist in [`converters.ts`](converters.ts) needs to be updated.
- The Flexible Earn part of the balance assumes that every configured stablecoin is selected in Bybit Card's **Paying With** settings and has **Auto-Deduction** enabled. The public Card API does not expose those switches.
- Authorization reversals (`side=2`) are not imported — instead, the matching authorization (`side=1`, in-progress hold) is expected to disappear from the upstream feed or be superseded by a cleared transaction on a subsequent sync. ZenMoney's hold-reconciliation logic handles the difference.
- Bybit documents a separate API hostname for some regions. A key created on a
  regional Bybit site may be rejected by the global host, so the plugin setting
  must match the account region.

## Suggested ZenMoney workflow

- `Bybit Card` is a single USD `ccard` account. Spending is imported as the final USD card charge, including Bybit's card fees.
- Hide the card via «skip account» using `bybit_card` if needed. The plugin uses `ZenMoney.isAccountSkipped` and skips imports for skipped accounts.
