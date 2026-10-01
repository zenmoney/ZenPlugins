# Current compatibility limitations

Reference for affected code paths only. These limitations describe checked-in implementations and host boundaries; they do not relax the domain contracts or require unrelated legacy rewrites. Remove a limitation when its fix is verified.

| Area | Limitation and treatment |
| --- | --- |
| [Example plugin](../../src/plugins/example) | Uses `products` and simplified static auth/history. Use it for packaging/sample data; new code follows [account sync plans](scrape/account-sync-plans.md) and real auth transitions |
| [ScrapeFunc](../../src/types/zenmoney.ts) | Declares `toDate?: Date` with an outdated “till now” comment; the adapter passes `null`. Follow the [unbounded nullish date contract](scrape/contract.md#dates-and-repeated-runs); a declaration fix needs code verification |
| [Account masking](../../src/common/accounts.js) | `trimSyncId`/`sanitizeSyncId` can make distinct plugin IDs collide. Keep valid plugin identity selection and report adapter collisions separately |
| [Transfer grouping](../../src/common/transactionGroupHandler.js) | The default merger does not remove a one-sided duplicate beside an already complete transfer. Use confirmed deduplication for that source pattern; verify no duplicate financial effect |
| [Legacy transaction adapter](../../src/common/converters.js) | Incoming `sum: null` validation reads the outgoing invoice. A valid incoming invoice can fail. Report the adapter defect; do not guess an amount or drop the operation |
| [Native preferences](scrape/preferences.md) | Native parser implementations are outside this repository; the browser reader implements only part of the form. Check changed native UI behavior in the application |
| [XML loader](../../scripts/plugin-manifest-loader.js) | Supports scrape/legacy-main and optional `makeTransfer`. Another plugin type needs its own loader/interface contract; the shared runtime alone does not register exports |

Local database schema and permissions are installation-specific; use the [database reference](../debugging/local-database.md) and inspect current definitions. Missing legacy tests do not make a rule optional: add coverage for changed behavior and report unsampled cases.
