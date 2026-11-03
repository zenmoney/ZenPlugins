# Account conversion quality

Applies to scrape account conversion. Field meanings and orchestration are in the [account contract](../accounts.md) and [sync plans](../account-sync-plans.md). Copy bank records under [fixture rules](../../../project/fixtures.md).

## ACCOUNT-001 Convert the complete account graph

The public `convertAccounts` MUST inspect all relevant accounts, cards, and products before deciding the final account set and any fetch plans. Its input is the bank graph for remote loading or the complete selected statement set for [file imports](../file-import.md#module-boundaries). Merge repeated representations of one balance; do not merge different balances merely because they share a contract, settlement account, masked suffix, or customer ID.

| Evidence | Expected decision |
| --- | --- |
| Several cards spend the same account balance | One account with the necessary card identifiers/history sources |
| Two currency balances under one product | Separate currency accounts; one shared fetch plan if the protocol supports it |
| Loan plus separate repayment account | Separate domain accounts; do not give the loan the repayment account's identity |
| Repeated API object for one account | Collapse the duplicate without losing unique identifiers or operation sources |
| Relationship is unknown | Investigate/assert; do not infer ownership from title or matching balance |

The whole public result, including fetch plans when applicable, is the unit of verification. Test reversed/raw item order when relationships are relevant. Preserve an isolated legacy plugin's public structure under the [architecture scope](../../architecture.md).

## ACCOUNT-002 Select stable matching identifiers

New plugins and substantial migrations MUST emit `syncIds: string[]`, not legacy `syncID`. `account.id` must also remain stable across runs and unique in the result.

Include the account number (IBAN or domestic number) and the numbers of all cards linked to that account in `syncIds`, as supplied by the bank. Keep bank-provided card masks. Deduplicate the values and keep their order deterministic across runs.

If neither an account number nor a linked card number is available, use a loan agreement number or another stable, non-secret identifier for the account. If the supplied numbers are all shared with other accounts in the same `instrument`, add one such identifier to distinguish the account.

| Case | Required result |
| --- | --- |
| One account has an IBAN, two linked cards and several API object IDs | Return the IBAN and both card numbers |
| Two accounts in the same currency have only the same masked card number | Keep both accounts and add a stable distinguishing identifier to each |
| No natural identifier but stable loan contract ID exists | Use the minimal appropriate stable fallback |
| Only a session token distinguishes raw objects | Do not use it as identity; find the real account identifier or fail visibly |
| One loan links a separately returned payment account | Do not reuse the payment account number as the loan's identity |
| API order changes or repeats a card | Identical deterministic `syncIds` without duplicates |

## ACCOUNT-003 Preserve product and balance semantics

Choose account type from the financial product's meaning. A debit card may use `ccard`; it is not proof of credit. A savings label does not alone establish a term deposit. Closed accounts can be marked `archived` when the bank provides that state; do not turn closure into a failed account fetch.

Use the [balance sign and field definitions](../accounts.md#common-fields-and-balances). MUST distinguish own funds, debt, available funds, credit limit, full statement amount due, and minimum payment. Preserve unknown values as nullable/optional values where the contract permits them; do not manufacture zero or loan/deposit terms.

Required cases: debit funds, debt, credit overpayment, known zero, unknown balance, holds/reservations, balance/limit versus available funds, and loan/deposit terms where supported. Use the account contract's current-funds examples as the expected semantics.

## ACCOUNT-004 Load each necessary source once

For account-dependent history loading, the converter MUST select the minimal source set that still gives complete supported history. Account-level history already containing card operations makes those card requests redundant. A separate card-only hold source can still be necessary. Encode the choice in `fetchParams`; let `api` execute it. File importers use the separate [selected-file lifecycle](../file-import.md#input-and-lifecycle) without creating fetch plans.

Test account/card overlap, separate holds, duplicate raw products, and shared multi-account fetches where applicable. Mixed skipped/non-skipped accounts must follow [skip handling](../contract.md#skipped-accounts); no per-account loop may duplicate a shared request.

Verification: account fixtures assert the full account(s) and `fetchParams` when applicable, including relationships and deterministic identifiers. The existing [example account tests](../../../../src/plugins/example/__tests__/converters/accounts) show full-result assertions but retain their legacy `products` DTO; see [compatibility limitations](../../compatibility.md).
