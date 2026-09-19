# Bybit wallets and Card plugin for ZenMoney

Read-only synchronization of Bybit wallets and, optionally, Bybit Card transactions through the public V5 API.

## What the plugin creates

- **Bybit Unified** — the USD equity reported by Bybit for the Unified wallet.
- **Bybit Funding** — all non-zero Funding assets, valued in USD through Bybit's own Convert valuation.
- **Bybit Flexible Earn** — every Flexible Earn asset, valued in USDT with Bybit's own spot prices. The account is marked as savings.

The Card is a payment instrument, not an independent wallet with a reliable separate balance. Enabling Card sync imports its purchases into the wallet chosen in the Card's *Paying With* settings, without creating a duplicate "Bybit Card" balance.

## Wallet movements

- Confirmed on-chain deposits, deposits from another Bybit account and successful withdrawals are imported with stable operation IDs.
- Funding ↔ Unified transfers are imported as balanced transfers between the two ZenMoney accounts.
- Flexible Earn subscriptions and redemptions are imported as balanced transfers between Flexible Earn and the source wallet selected by the user.
- Bybit does not expose the destination wallet of an older external deposit or the source wallet of an older Earn order. The plugin therefore asks for both settings and never guesses.
- USDT, USDC, FDUSD, TUSD and USD can be imported at their nominal amount. Non-stable assets remain included in the live USD account valuation, but are not represented as misleading historical USD cash flow without a trustworthy historical quote.
- The first synchronization reads the requested external history. Internal wallet and Flexible Earn history is limited to the latest 180 days to stay within Bybit API limits; later synchronizations continue incrementally from ZenMoney's last successful date.

## Card transactions

- Cleared purchases, refunds, chargebacks, ATM withdrawals and fees use stable
  transaction IDs from Bybit. The aggregate financial query is retained because
  it is the mode accepted by the live Kazakhstan Card API.
- Pending authorizations are imported as holds; declined and reversal records are skipped so they cannot be double-counted.
- An authorization does not move money out of Bybit yet: the coin is sold at once and the fiat is parked in Funding with a zero
  transferable balance until the merchant clears the purchase, about a day and a half later. That parked fiat is therefore subtracted from
  the Funding balance for as long as the matching hold is imported, so the same money is not reported twice. Authorizations are
  read over a fixed fourteen-day window rather than the synchronization window: the same set has to be imported and subtracted, and
  tying it to the requested history would make the balance jump between a first run and a daily one. Fourteen days is what ZenMoney
  asks for anyway, and an ample margin over the day and a half an authorization was observed to need.
- The deduction is applied to Funding whichever wallet settles the card. That is where the parked fiat was observed on a
  Funding-settled account; an account paying from Flexible Earn was not available to check.
- Bybit's authorization and clearing records for one purchase share neither `txnId` nor `orderNo`, so the plugin does not try to
  pair them. ZenMoney merges a hold with the cleared operation on its own.
- `totalFees` covers only the fees Bybit reports on the fiat side. The markup it keeps when selling crypto for that fiat is absent
  from every Card API field and from the convert history, so it is left to the **Crypto-to-fiat conversion fee** preference. With
  it unset, card purchases are imported for less than the wallet actually paid. The current cost is visible in the Bybit app under
  *Crypto used*: divide the crypto spent by the fiat it produced.
- Merchant, MCC, city and country are retained where Bybit provides them.
- The Card API does not disclose the actual *Paying With* setting. The plugin therefore asks the user to choose **Flexible Earn** or **Funding** and never guesses from a current balance. Set it to the same source selected in Bybit.

## Creating a safe API key

1. In Bybit open **API** → **Create New Key** → **System-generated API Key**.
2. Select **Read-Only** permissions.
3. Enable only the read permissions needed by the active features:
   - **Wallet** for wallet balances and transfer history;
   - **Earn** for Flexible Earn positions;
   - **Exchange History** for Funding asset valuation;
   - **Bybit Card** only when Card transaction sync is enabled.
4. Never enable trading, transfer or withdrawal permissions.
5. Restrict the key to a trusted IP address when practical.

Choose the account region from the predefined list. The plugin maps it to the
official Bybit API host; users never type an API URL. Kazakhstan accounts use
Bybit's documented `api.bybit.kz` host rather than the global host. Brazil uses
the global host with Bybit's required `BRA_BTL` site identifier.

## Limitations and safety

- If Bybit does not publish a USDT market price for a non-stable Earn asset, synchronization stops with a clear error instead of silently valuing it at zero.
- The plugin imports wallet balances, wallet movements and Card operations, not raw exchange orders, bot events or every trade fill. This keeps a household budget useful.
- An API key and secret remain in ZenMoney preferences; development files `zp_preferences.json` are ignored by Git and must never be committed.
