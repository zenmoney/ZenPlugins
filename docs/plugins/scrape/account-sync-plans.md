# Account conversion and fetch plans

Required for new scrape plugins with account-dependent history loading, substantial API migrations of that path, and plugins already using this structure. [File importers](file-import.md#module-boundaries) convert already supplied history without `fetchParams`. A focused fix in a legacy plugin keeps its existing public converter contract unless changing it is necessary. Related definitions: [architecture](../architecture.md), [accounts](accounts.md), and [account quality](quality/accounts.md).

## Public converter boundary

`convertAccounts(apiAccounts)` receives the complete bank account/card graph needed for correlation. It returns plans shaped as `{ account, fetchParams }`, or `{ accounts, fetchParams }` when one history workflow covers several Zenmoney accounts.

The converter MUST own cross-item decisions: duplicate bank entities, card/account relationships, one-to-many and many-to-one mappings, identifier selection, and the minimal non-duplicating sources required for complete history. Private per-item helpers are allowed. `index` MUST NOT call a public per-item converter independently and rebuild the graph itself; `api` MUST NOT repeat the same grouping analysis.

## Fetch parameters

`fetchParams` is a small declarative DTO containing stable bank identifiers and source discriminators. It MAY contain multiple sources if they carry different required history. It MUST NOT contain executable callbacks, URLs, headers, cookies, authorization state, pagination cursors, or retry policy. Define its type in a behavior-free local model module.

Account grouping, identity collisions, and minimal history-source decisions follow [account quality](quality/accounts.md).

`api.fetchTransactions(session, fetchParams, fromDate, toDate)` executes the plan: endpoint selection, request sequence, pagination, retries, and response-dependent fallbacks stay in `api`. It returns the raw operations needed for conversion. The exact DTO and function parameter order are local implementation choices; the responsibility boundary is mandatory.

Older names such as `product`, `products`, or `mainProduct` often represent these fetch parameters. Prefer `fetchParams` in new code and migrations; do not retain the entire raw account object when a smaller DTO is sufficient.

## Entrypoint consumption

Treat each plan as an indivisible fetch unit. Add its account(s) to the returned account list, honor [skips](contract.md#skipped-accounts), execute its history workflow once, convert operations, then perform transaction grouping. Do not duplicate a shared fetch for each covered account.

Verify complete plans and their execution under [account quality](quality/accounts.md) and [full-result testing](../../project/testing.md#verification-for-code-changes), including mixed skips and a single execution of shared workflows.
