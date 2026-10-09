# Scrape contract

Applies to account/transaction synchronization plugins. Export an asynchronous `scrape` function conforming to [ScrapeFunc](../../../src/types/zenmoney.ts). Other plugin types define their own exports and result interfaces.

Remote loading and [file import](file-import.md) share this interface, result, quality, and failure rules; their acquisition and history scope differ.

## Arguments and result

| Argument | Meaning |
| --- | --- |
| `preferences` | Typed settings for the plugin; the scrape adapter handles `startDate` separately |
| `fromDate` | Inclusive start of the requested history interval |
| `toDate` | Inclusive end of the interval; absent or `null` means no upper bound |
| `isFirstRun` | No successful scrape has yet been recorded by the adapter |
| `isInBackground` | `true` means UI is unavailable; follow the shared [runtime UI contract](../runtime.md#background-execution-and-ui) |

Return `Promise<{ accounts: Account[], transactions: Transaction[] }>` with both arrays and at least one account. `transactions` MAY be empty when no operations are in scope or all histories are skipped. The [adapter](../../../src/common/adapters.js) rejects empty accounts and handles host conversion/error presentation; return domain objects instead of calling `ZenMoney.addAccount`/`addTransaction` or legacy `main`.

Every movement reference by ID MUST resolve to an account in the same result. Account IDs MUST be unique. A transfer's external/cash side uses a reference by data; it does not require a fabricated fetched account. See [accounts](accounts.md#account-references) and [transactions](transactions.md).

## Dates and repeated runs

The current `provideScrapeDates` adapter derives `fromDate` from `preferences.startDate` and, after success, an overlap starting at midnight 14 days before the last successful run, bounded by the chosen start date and now. It removes `startDate` from the settings passed to `scrape`, passes `toDate: null`, and records the successful invocation time only after the promise resolves. Treat that as adapter behavior; do not recreate or override it in each plugin.

For remote history loading, include operations exactly at `fromDate` and, when supplied, `toDate`. A nullish `toDate` imposes no upper-date filter; do not replace it with the current moment as a domain cutoff. If a bank endpoint requires a concrete end date, choose a protocol-supported request bound that covers all available operations in scope and document that transport requirement. Map the interval to the bank's documented time zone and endpoint boundaries; an exclusive or date-only endpoint may require an overlapping request and local filtering. Fetch all pages and merge overlap without losing distinct identical-looking operations. Never assume an empty first page or a page-size limit proves that all history is loaded without the protocol's termination condition.

Bank endpoint boundaries do not change this inclusive output contract. Record their mapping and the selected transaction date semantics in the bank's existing notes or tests; test operations exactly at both edges and an unbounded upper date. Stable account/movement identifiers must survive repeat and overlapping runs.

First run is not an implicit permission to omit history. An accounts-only or history-limited integration must have a documented product scope and explicit tests. The [file-import contract](file-import.md#import-scope-and-repeated-runs) instead requires the whole selected statement on every run, independently of scrape dates. This does not authorize truncation or interval overrides in remote history loading.

## Completeness and failures

Within the integration's documented supported products/operation classes and available history, every requested account and transaction MUST be represented. Known product/history limits belong in the bank profile and user-facing setup where relevant. They do not authorize silently dropping a newly observed supported operation or swallowing a page failure.

Apply [error propagation and terminal-entity scope](../errors.md): unexpected failures reject the whole scrape; only user skips and the documented terminal exception permit omissions. Distinguish valid empty history from malformed/incomplete data. Error classification belongs to `api` under [architecture](../architecture.md#boundaries).

## Skipped accounts

Keep discovered accounts in `accounts`; `ZenMoney.isAccountSkipped(account.id)` means to skip their transaction loading, not erase their account metadata. For one-account plans, skip that plan's history request. For a shared multi-account plan, skip the request only when every covered account is skipped; otherwise fetch once and omit operations affecting only skipped accounts.

Keep operations affecting an included account, even when the other side is skipped. Apply [internal-movement evidence rules](quality/transfers.md#transfer-001-classify-by-the-financial-movement): a skipped account's metadata is not movement evidence. Do not fetch skipped history to force a match. Test mixed selections, unpaired income/expense, confirmed transfers, and [shared plans](account-sync-plans.md).

## Assembly and verification

Assembly follows [account sync plans](account-sync-plans.md) or the [file-import lifecycle](file-import.md#input-and-lifecycle), with [auth persistence](../authentication.md) independent of scrape completion.

Test first/repeated runs, unbounded upper date, inclusive boundary dates, pagination completion, valid empty history, rejection of empty accounts, user skips, shared fetches, grouping, persisted auth updates followed by a failed scrape, and unchanged propagation of unexpected errors where those behaviors are affected. A converter-only fixture cannot verify end-to-end completeness.
