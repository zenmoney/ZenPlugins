# Scrape data quality requirements

These rules interpret bank evidence for scrape; [accounts](../accounts.md) and [transactions](../transactions.md) define output contracts. Rules apply to supported products/operation classes. Record scope limits in existing integration notes; they never authorize dropping unknown data.

## Required use

Start every scrape development, review, and log-analysis task here, alongside the policies in the [task route](../../../README.md#choose-a-task). Assess data correctness even for auth/network changes: successful requests, schema validation, or completion alone do not prove it. Include available successful runs/records in log reviews. Select detailed topics by affected data and decisions:

| Task | Required scope |
| --- | --- |
| New scrape plugin or substantial API migration | Before choosing fields/endpoints, read both contracts and all applicable topics; define expected results and coverage during implementation |
| Full plugin review or general log analysis | Assess every topic against source records and output; report checked coverage, findings, evidence gaps, or justified non-applicability |
| Focused fix or review, including auth/network changes | Read affected topics and dependencies; inspect available financial records for additional defects, report them in the same backlog, and keep unrelated fixes separate |

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

1. Identify supported products/operation classes from protocol evidence. Derive expected accounts/transactions from source records and rules before implementing conversion, including merchant, purpose, and observed missing values, ambiguities, and counterexamples.
2. Compare source records with the complete converted result, including account fetch plans and final transaction grouping where applicable. Check missing records and lost useful fields as well as invalid values. Verify pagination, overlapping sources, and repeated-run behavior when they affect completeness or identity.
3. Tie the comparison to the plugin/build that produced the evidence. If the log has no converted output, reproduce conversion with the relevant implementation and a complete real fixture under the target branch rules; distinguish reproduced output from logged output. When source records or necessary context are absent, record the limit instead of guessing.
4. Implement new/changed behavior together with [full-result tests](../../../project/testing.md#verification-for-code-changes) referencing affected rule IDs. Expectations come from step 1, not accepted converter output. Follow the [bank/model evidence boundary](../../../project/testing.md#bank-data-and-model-tests).
5. Report checked cases, defects, and evidence gaps alongside other task/MR findings, covering every topic for a full review. Use existing tests/notes and the task/MR; do not create per-plugin READMEs for this procedure.

## What counts as a defect

- Unexpected authorization failures, crashes, assertions, or incomplete fetch/conversion.
- Missing supported accounts or transactions, including unexpectedly empty results.
- Invalid amounts, signs, currency, dates, or movement structure.
- Unstable identifiers causing duplicates or incorrect matching across runs.
- Separate income/expense records that should form a confirmed transfer.
- Lost or incorrectly guessed merchant, location, purpose, status, or fee information, subject to the explicit comment-preservation exception for grouped internal transfers in [COMMENT-002](comments.md#comment-002-exclude-technical-identifiers-and-duplication).

Confirmed user-input mistakes are deliberate UI errors, not unknown protocol failures. User-skipped accounts and the narrow previously investigated terminal-entity omission follow [the scrape contract](../contract.md#completeness-and-failures) and [error policy](../../errors.md). They are not general fallback mechanisms.

## Evidence and coverage

Topic decision tables define required scenarios when their inputs are supported, not verified coverage of every legacy plugin. [Diagnostics](../../../debugging/README.md#triage-before-implementation) owns log collection and backlog preparation; [testing](../../../project/testing.md#bank-data-and-model-tests) owns evidence rules; [maintenance](../../../project/documentation.md) owns rule changes.
