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

Prefer stable natural identifiers: IBAN, domestic account number, and bank-provided masked card numbers belonging to this account. Evaluate uniqueness over the complete account set returned by the plugin, before host-adapter transformations. When natural identifiers distinguish accounts, use only those; do not copy every API object/product/card ID into `syncIds`.

If natural identifiers are absent or collide, add the minimum stable non-secret technical identifier needed so every account has at least one distinguishing identifier. A collision alone does not justify merging two accounts. The fallback MUST NOT be an auth credential, secret, or short-lived token. Deduplicate `syncIds` and make their values and order deterministic across runs.

Collisions introduced later by the shared adapter's `trimSyncId` or `sanitizeSyncId` are adapter limitations, not an additional plugin identity requirement. Report them separately; do not add technical identifiers solely to work around host masking of an otherwise unique plugin result.

| Case | Required result |
| --- | --- |
| Unique IBAN plus several unrelated API IDs | Natural identifier(s), no unnecessary technical fallback |
| Two accounts have the same masked card value | Preserve separate accounts and add a stable distinguishing identifier |
| No natural identifier but stable loan contract ID exists | Use the minimal appropriate stable fallback |
| Only a session token distinguishes raw objects | Do not use it as identity; find the real account identifier or fail visibly |
| One loan links a separately returned payment account | Do not reuse the payment account number as the loan's identity |
| API order changes or repeats a card | Identical deterministic `syncIds` without duplicates |
| Distinct plugin identifiers collide only after shared adapter masking | Keep the valid plugin identity set and report the adapter limitation |

## ACCOUNT-003 Preserve product and balance semantics

Choose account type from the financial product's meaning. A debit card may use `ccard`; it is not proof of credit. A savings label does not alone establish a term deposit. Closed accounts can be marked `archived` when the bank provides that state; do not turn closure into a failed account fetch.

Use the [balance sign and field definitions](../accounts.md#common-fields-and-balances). MUST distinguish own funds, debt, available funds, credit limit, full statement amount due, and minimum payment. Preserve unknown values as nullable/optional values where the contract permits them; do not manufacture zero or loan/deposit terms.

Required cases: debit funds, debt, credit overpayment, known zero, unknown balance, holds/reservations, balance/limit versus available funds, and loan/deposit terms where supported. Use the account contract's current-funds examples as the expected semantics.

## ACCOUNT-004 Load each necessary source once

For account-dependent history loading, the converter MUST select the minimal source set that still gives complete supported history. Account-level history already containing card operations makes those card requests redundant. A separate card-only hold source can still be necessary. Encode the choice in `fetchParams`; let `api` execute it. File importers use the separate [selected-file lifecycle](../file-import.md#input-and-lifecycle) without creating fetch plans.

Test account/card overlap, separate holds, duplicate raw products, and shared multi-account fetches where applicable. Mixed skipped/non-skipped accounts must follow [skip handling](../contract.md#skipped-accounts); no per-account loop may duplicate a shared request.

Verification: account fixtures assert the full account(s) and `fetchParams` when applicable, including relationships and deterministic identifiers. The existing [example account tests](../../../../src/plugins/example/__tests__/converters/accounts) show full-result assertions but retain their legacy `products` DTO; see [compatibility limitations](../../compatibility.md).
