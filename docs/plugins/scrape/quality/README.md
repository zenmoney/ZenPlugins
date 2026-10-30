# Scrape data quality requirements

These rules interpret bank evidence for scrape; [accounts](../accounts.md) and [transactions](../transactions.md) define output contracts. Rules apply to supported products/operation classes. Record scope limits in existing integration notes; they never authorize dropping unknown data.

## Required use

Start every scrape development, review, and log-analysis task here. Assess data correctness even for auth/network changes: successful requests, schema validation, or completion alone do not prove it.

For a new plugin or substantial API migration, read both output contracts and all applicable topics before choosing fields/endpoints; define expected results and coverage during implementation. For an existing plugin, select topics by the shared [review scope](../../README.md#review-scope): affected topics/dependencies for a focused task, every applicable topic for general log analysis or a full review.

Missing examples are evidence gaps, not non-applicability. Use relevant existing fixtures/other logs; if authorization prevents all financial data collection, mark data quality unverified.

## Topics to assess

| Topic | Decisions covered |
| --- | --- |
| [Accounts](accounts.md) | Complete account/card graph, product grouping, stable identity, balance meaning, complete non-redundant history sources |
| [Merchants](merchants.md) | Known name/place boundaries, significant delimiters and whitespace, preserved enrichment, sender/recipient identity, missing data |
| [Comments](comments.md) | Preserved useful purpose, removed technical text and duplication, meaningful transfer comments |
| [Transfers](transfers.md) | Internal/external/cash/P2P classification, confirmed matching, skipped or unavailable sides, final grouping without duplicates |
| [Amounts and statuses](amounts-and-statuses.md) | Signs, account and operation currencies, fees counted once, dates, pending/settled/refund states, stable IDs across runs |

## Development and review procedure

Within [diagnostic triage](../../../debugging/README.md#triage-before-implementation), cover supported operation classes: real expenses, income and internal transfers where they exist. Rare classes may require a 3–6 month interval. Purchases alone cannot validate transfer matching; for a suspected missing transfer, find both source records before attributing it to matching.

1. Identify supported products/operation classes from protocol evidence. Derive expected accounts/transactions from source records and rules before implementing conversion, including merchant, purpose, and observed missing values, ambiguities, and counterexamples.
2. Compare source records with the complete converted result, including account fetch plans and final transaction grouping where applicable. Check missing records and lost useful fields as well as invalid values. Verify pagination, overlapping sources, and repeated-run behavior when they affect completeness or identity.

Use [scrape testing](../testing.md) for changes and shared [findings and next steps](../../../debugging/README.md#findings-and-next-steps) for the report.

## What counts as a defect

- Unexpected authorization failures, crashes, assertions, or incomplete fetch/conversion.
- Missing supported accounts or transactions, including unexpectedly empty results.
- Invalid amounts, signs, currency, dates, or movement structure.
- Unstable identifiers causing duplicates or incorrect matching across runs.
- Separate income/expense records that should form a confirmed transfer.
- Lost or incorrectly guessed merchant, location, purpose, status, or fee information, subject to the [merchant representation contract](../transactions.md#merchant-and-comment) and the explicit comment-preservation exception for grouped internal transfers in [COMMENT-002](comments.md#comment-002-exclude-technical-identifiers-and-duplication).

Confirmed user-input mistakes are deliberate UI errors, not unknown protocol failures. User-skipped accounts and the narrow previously investigated terminal-entity omission follow [the scrape contract](../contract.md#completeness-and-failures) and [error policy](../../errors.md). They are not general fallback mechanisms.

## Evidence and coverage

Topic tables define required scenarios for supported source data, not one test per rule or a Cartesian product of cases. [Scrape testing](../testing.md#required-coverage) owns coverage, [fixtures](../../../project/fixtures.md#observed-evidence) own source evidence, and [maintenance](../../../project/documentation.md) owns rule changes. Missing examples remain gaps, not verified coverage.
