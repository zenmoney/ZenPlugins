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

`online.json` contains nine selected Online records and six overlapping shared
history records from an authorized browser capture. Each selected bank record
retains all fields. The Online envelope count reflects the selected subset rather
than the size of the original response.

Merchant and counterparty names, addresses, locations, dates, amounts and
transaction references were replaced with consistent
example values. Dates were shifted together to preserve ordering and intervals;
amounts were replaced independently while preserving cross-source equality and
signs. Reference lengths, collisions, shared prefixes, descriptor separators and
significant whitespace remain intact. Account and card identifiers are examples;
no authentication headers or browser session artifacts are included. These are
privacy-transformed observations, not additional invented bank scenarios.

Online contains both `AUTHORIZED` and `SETTLED` entries. By explicit user choice,
the plugin adds authorizations as ordinary transactions (`hold: false`); settled
online entries are supplied by shared history. A canceled authorization may need
manual correction. The selected examples preserve two same-code authorizations
at distinct timestamps alongside a separate settled payment, without exposing the
account owner's explanation or the original merchant. Neither source provides a
refund credit or cancellation linkage for these authorization records. Do not
collapse them by amount, merchant or the short authorization code alone.

An approved card transfer overlaps an online authorization at the exact operation
timestamp, account, direction, currency and amount. Card purchases use a different
booked UUID and later date; the history descriptor includes the online authorization
code, sometimes truncated to a prefix. Matching requires the same account,
direction, currency and original amount, a merchant prefix and the reference
prefix, with unique candidates in both sources. A seven-day booking window bounds
this heuristic. Ambiguous or unmatched authorizations remain separate for manual
correction rather than disappearing.

When an emitted authorization matches history, persist its identity and initiation
date so later imports keep one movement even without the Online record. When
history was imported first, retain its movement identity while using the initiation
date from the matched Online record. Apply period boundaries to that initiation
date. Saved unmatched records are identity evidence only and are never replayed as
current transactions. Model tests verify persistence using observed settled records;
no before/after capture of the same authorization settling is available.
