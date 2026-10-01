# Plugin development documentation

This is the canonical documentation for public and internal plugins. Shared requirements are maintained in `master`. This page owns the reading routes; topic pages link to related details without adding recursive reading requirements.

## Choose a task

Read the listed pages or sections once. Combine routes only when the task crosses their boundaries. A reference link is optional unless its condition applies to the task; follow it to resolve that detail, not to load the whole tree.

| Task | Required reading |
| --- | --- |
| Locate/place files or understand the repository | [Structure](project/structure.md), [plugin model](plugins/README.md) |
| New plugin or substantial API migration | [Creation](development/new-plugin.md), [architecture](plugins/architecture.md), [runtime](plugins/runtime.md), chosen type's contract; for scrape, [quality assessment](plugins/scrape/quality/README.md) selects all applicable topics |
| File-based scrape plugin | [File import contract](plugins/scrape/file-import.md), [scrape contract](plugins/scrape/contract.md), [runtime UI](plugins/runtime.md#background-execution-and-ui), plus the route for the actual change |
| Entrypoint or persisted state | [Runtime](plugins/runtime.md), [architecture boundaries](plugins/architecture.md#boundaries), affected type's contract; [authentication](plugins/authentication.md) for auth state |
| Scrape account conversion | [Account contract](plugins/scrape/accounts.md), [account quality](plugins/scrape/quality/accounts.md), [sync plans](plugins/scrape/account-sync-plans.md) for account-dependent history loading or [file import](plugins/scrape/file-import.md) for statements; [skips](plugins/scrape/contract.md#skipped-accounts) when selection is involved |
| Transaction amounts, dates, statuses, or IDs | [Transaction contract](plugins/scrape/transactions.md), [amounts and statuses](plugins/scrape/quality/amounts-and-statuses.md) |
| Merchant or comment parsing | [Merchant/comment contract](plugins/scrape/transactions.md#merchant-and-comment), [merchants](plugins/scrape/quality/merchants.md), [comments](plugins/scrape/quality/comments.md) |
| Transfer classification or grouping | [Transaction contract](plugins/scrape/transactions.md), [transfers](plugins/scrape/quality/transfers.md); affected [amount/fee](plugins/scrape/quality/amounts-and-statuses.md), [merchant](plugins/scrape/quality/merchants.md), and [comment](plugins/scrape/quality/comments.md) sections |
| Authentication | [Authentication](plugins/authentication.md), [runtime state/input](plugins/runtime.md), [errors](plugins/errors.md), [sanitization](debugging/log-sanitization.md) |
| Error classification | [Errors](plugins/errors.md), [sanitization](debugging/log-sanitization.md); [authentication](plugins/authentication.md) only when changing auth transitions |
| Network request or diagnostic | [Architecture boundaries](plugins/architecture.md#boundaries), [errors](plugins/errors.md), [sanitization](debugging/log-sanitization.md) |
| Scrape settings or packaging | Affected [preferences](plugins/scrape/preferences.md) or [manifest](plugins/scrape/manifest.md) page |
| Focused plugin review, log analysis, or incident | [Diagnostics](debugging/README.md), [errors](plugins/errors.md), [sanitization](debugging/log-sanitization.md), [authentication](plugins/authentication.md) when present; for scrape, [quality assessment](plugins/scrape/quality/README.md). Use the needed log/database/metric reference from diagnostics |
| Full plugin review | The focused-review policies above, plus [architecture](plugins/architecture.md), [runtime](plugins/runtime.md), and the affected type's contract; cover the whole supported integration |
| Device reproduction | [Bootloader](debugging/bootloader.md) |
| Protocol research | [Research guide](development/protocol-research.md) and affected integration notes |
| Nordigen integration | [Shared-provider rules](plugins/scrape/nordigen.md), plus the route for the actual change |
| Git or hosting operations | [Identity](project/workflow.md#repository-identity), [branches](project/workflow.md#branches-and-submission); for MR/PR creation/update, also [submission checks](project/workflow.md#submission-checks) and [completion criteria](project/workflow.md#completion-criteria) |
| Documentation | [Maintenance](project/documentation.md) |

For code changes, also read [working sequence](project/workflow.md#working-sequence), [style](project/style.md), and [verification](project/testing.md#verification-for-code-changes). Test layout and layer-specific matrices are references for the affected tests. Read [fixture rules](project/fixtures.md) before copying source data.

For every scrape development, review, or log-analysis task, start the [quality assessment](plugins/scrape/quality/README.md#required-use), even for authentication/network changes. It defines the assessment scope and selects detailed topics; it does not require every topic for every focused fix.

A focused review covers data quality, sanitization, errors, and authentication within the task's scope and dependencies. A full review covers those areas across the supported integration and adds architecture. Mark absent facilities, such as authentication in a file-only importer, as not applicable. Code changes still follow the applicable architecture boundaries even when a full architectural review was not requested.

## Document responsibilities

- **Contracts** define exported operations, data meaning, and invariants. TypeScript declarations define exact field shapes.
- **Quality rules** define interpretation of bank evidence, decisions, and verification cases.
- **Guides** explain development, investigation, and verification procedures.
- **Integration notes and tests** record bank behavior, supported scope, and local exceptions. Read only those relevant to the task.

`MUST`/`MUST NOT` are mandatory. `SHOULD` is a default requiring a documented reason to depart from. `MAY` is optional. Scope and explicit exceptions take precedence over general wording. [Compatibility limitations](plugins/compatibility.md) record actual gaps; a requirement does not claim that every legacy plugin already complies.
