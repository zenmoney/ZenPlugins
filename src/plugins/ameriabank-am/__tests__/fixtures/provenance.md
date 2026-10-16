# Fixture provenance

The fixtures originate from authorized MyAmeria web/API observations in October
2026. They preserve complete relevant response records and their field structures.

`capture.json` covers accounts, cards, savings, product details, exchange documents,
general transaction history from July 2026 and deposit ledger entries.
`deposit-history.json` contains the shared-history transactions corresponding to
deposit opening and two capitalization events, including related interest and tax.
The `auth/` fixtures cover observed login, push confirmation, wrong-password and
refresh responses. Model-only placeholders test orchestration and persistence;
they do not represent additional observed bank behavior.

Personal data and account, card, product, contract and operation identifiers were
anonymized consistently. Credentials, tokens, cookies and full card numbers were
removed or replaced with public-safe placeholders. At the account owner's request,
monetary values were replaced with fixed alternatives while preserving signs,
currencies and relevant balance, transfer, interest, tax and fee relationships.
Dates, interest rates and response structures were retained. Original sensitive
data is excluded from the repository.

Deposit movements were verified against shared transaction history, transaction
details and product data. Shared history provides currency, direction and stable
operation identity; the deposit ledger supplies reconciliation context. Technical
renewal entries do not create separate financial movements. Interest and tax
retain their distinct shared-history operations, avoiding duplicate imports.

Expected results cover complete conversion, period boundaries, stable IDs,
repeated imports and rejection of incomplete or inconsistent data. Android
Bootloader verification confirmed the deposit movements and related interest and
tax; repeated imports returned identical results, and the user confirmed no
duplicates in the application.
