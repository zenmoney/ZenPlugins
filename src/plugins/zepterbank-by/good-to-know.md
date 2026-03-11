# Synchronization plugin with Zepterbank (Цептер Банк)

API seems common for both mobile and web versions.

## Authentication

Nothing special

## Accounts

Nothing special

## Transactions

---
Transactions are fetched from two different sources:
- _history_ – last transactions (only cards available)
- _statement_ – full list of transactions (available from the next business day)

---

Be aware that there are various delays for transactions display.

---

For card transactions, 'MCC' in the `transMcc` field of `FetchCardTransaction` is cyrillic, not latin

