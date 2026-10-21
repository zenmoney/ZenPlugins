# Fixture provenance

The fixtures originate from authorized MyAmeria web/API captures and Android
Bootloader observations. Selected bank records retain their complete field
structures. Model-only placeholders verify implementation invariants and do not
represent additional observed bank behavior.

Personal identifiers and reusable secrets are anonymized, removed or replaced with
public-safe values. Fixture-specific transformations preserve the relationships,
formats, collisions, separators and significant whitespace needed by each test.
Raw captures and session artifacts remain outside the repository. This document
omits customer names, account/card identifiers, merchant identities, transaction
amounts, activity dates, exact timestamps and other personal activity details.

`capture.json` covers accounts, cards, savings, product details, exchange documents,
general transaction history and deposit ledger entries. Account, card, product,
contract and operation identifiers use consistent replacements. Monetary values
use fixed alternatives preserving signs, currencies and relevant balance,
transfer, interest, tax and fee relationships. Dates are shifted consistently across related records and test boundaries.
Merchant text and utility/payment references use format-preserving replacements.
Interest rates and response structures are retained.

`deposit-history.json` contains shared-history records for deposit opening and
capitalization, including related interest and tax. Movements were checked against
shared transaction history, transaction details and product data. Shared history
provides currency, direction and stable operation identity; the deposit ledger
supplies reconciliation context. Technical renewal entries do not create separate
financial movements. Interest and tax retain their distinct shared-history
operations. Android Bootloader verification covered the resulting movements and
repeat-import stability.

The `auth/` fixtures cover observed login, push confirmation, wrong-password and
refresh responses. Authentication credentials and reusable session artifacts are
excluded or replaced with public-safe placeholders.

`online.json` contains selected Online records and overlapping shared-history
records. Its envelope count reflects the selected subset. Merchant/counterparty
names, addresses, locations, dates, amounts and references use example values.
Dates were shifted together to preserve ordering and intervals; monetary
transformations preserve cross-source equality and signs. Reference lengths,
collisions, shared prefixes, descriptor separators and significant whitespace
remain intact.

Online authorizations are pending transactions (`hold: true`) under
[STATUS-001](../../../../../docs/plugins/scrape/quality/amounts-and-statuses.md#status-001-preserve-lifecycle-states);
settled Online entries are supplied by shared history. Observed same-code
operations at distinct timestamps remain separate unless lifecycle evidence
supports a match. The fixture contains no refund or cancellation linkage for those
records; matching only by amount, merchant or short reference is insufficient.

An approved card transfer overlaps an authorization at the exact operation
timestamp, account, direction, currency and amount. Card purchases use different
booked UUIDs and later dates; history descriptors contain authorization references,
sometimes truncated to a prefix. Matching requires compatible account, direction,
currency and original amount, merchant/reference prefixes, and unique candidates.
Comparison tolerates observed whitespace after punctuation without rewriting
merchant output. A seven-day booking window bounds this heuristic. Unmatched or
ambiguous authorizations remain pending while present in the current source.

Matched authorizations retain their emitted identity and initiation date through
booking. When history was imported first, its movement identity remains stable.
Period boundaries apply to the initiation date. Saved unmatched records are
identity evidence only and are never replayed as current transactions. Model tests
verify persistence using observed settled records; the original Online fixture
does not contain a before/after authorization capture.

`online-lifecycle.json` preserves complete observed `pre-purchase:e-pos` and
`purchasecompletion:e-pos` pairs. Each pair shares a reference, card/account,
direction, currency, amount and merchant text, with completion occurring later.
Both stages were `SETTLED` at capture time. Application records confirmed duplicate
imports of the stages; their earlier raw `AUTHORIZED` responses were unavailable.

Separate older booked records establish merchant-spelling differences and reference
format. They are not presented as booked counterparts of the captured lifecycle
pairs; those counterparts were unavailable. Account numbers, operation UUIDs and
short references use consistent public-safe replacements. Merchant/counterparty names, addresses, locations and monetary values use
consistent examples. All timestamps are shifted by the same offset; display dates
retain their original language and padding. These transformations preserve record
structure, chronology, intervals, amount equality and the punctuation/whitespace
differences needed by the tests.

The `preauthorization` and `settledPreauthorization` records capture an independent
operation before and after settlement. Display-date languages differ between the
captures. These records establish pending/settled handling beyond the paired
purchase examples.

Only unique pre-purchase/completion pairs with identical card/account, bank
reference, direction, currency, amount and merchant text are linked within the
booking window. Completion retains the initial movement identity and date in
optional `origin` metadata. Unrelated same-code payments remain distinct. Saved
metadata never replays absent transactions, and the plugin does not delete
existing ordinary duplicates. Tests using settled pairs as previously imported
state are labeled `[model]`; they verify identity migration and persistence without
inventing earlier bank responses. Application-side hold cleanup and the captured
purchase pairs reaching booked history remain unverified.
