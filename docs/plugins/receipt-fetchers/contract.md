# Receipt operation contract

Scope: provider operations and their loader lifecycle. [receiptFetcher.ts](../../../src/types/receiptFetcher.ts) defines exact inputs/results; [manifest](manifest.md#source-declaration) defines declared/exported correspondence.

## Operations

| Operation | Input | Result |
| --- | --- | --- |
| `fetchReceipt` | Code and required `isInBackground: boolean` | Promise of a full receipt or a recognized lookup outcome |
| `parseReceiptCode` | Code only | Promise of an explicitly partial local preview or `notApplicable` |

Code uses `format: 'qr'` and its original `value`. Plugins MAY implement either or both operations. Receipt operations MUST return their own typed results, without bank `scrape`, `main` or account/transaction submission. Batch retrieval is outside this contract.

`parseReceiptCode` MUST complete quickly without network requests or prompts, even though it returns a promise. A preview MUST NOT invent items, currency or defaults to become a full receipt.

`fetchReceipt` follows shared [background execution and UI](../runtime.md#background-execution-and-ui).

## Results and errors

| Evidence | Required outcome |
| --- | --- |
| Valid retrieved document | `found` with a validated [Receipt](receipt.md) |
| Input deterministically unsupported by this provider | `notApplicable`; no unrelated requests |
| Supported lookup with confirmed absence | `notFound` |
| Provider explicitly reports unfinished processing | `pending` |
| Code supplies local preview data | `parsed` with `ReceiptPreview`, from `parseReceiptCode` only |
| UI required but unavailable | Propagate `UserInteractionError` |
| Unexpected transport, status, payload or conversion problem | Reject with the original reportable error |

Confirmed user-facing conditions use the shared [error hierarchy](../errors.md). Unknown failures MUST remain observable; catch-all invalid-code wrappers and numeric status throws are not compatibility requirements.

Converters MUST construct `Receipt` directly from provider data. [assertReceipt](../../../src/common/receiptFetcher/receipt.ts) validates without recalculation, balancing entries or inferred fields. Optional monetary detail follows the [completeness rule](receipt.md#reconciliation-is-optional-evidence-not-validation-of-the-dto).

## Loader lifecycle

The [module loader](../README.md#build-pipelines) exposes only declared operations and provides the generated metadata as `ZenMoney.manifest` under the shared [publication metadata rule](../README.md#publication-metadata). Loading MUST NOT initiate retrieval, authentication or prompts. Each operation completes by resolving its promise with a typed result or rejecting it with an error.

Every operation follows the shared [error policy](../errors.md) and [state persistence](../runtime.md#state-and-lifecycle). Receipt error handling is independent of scrape history.

## Verification

Cover affected results, absence/pending states, original errors, background interaction, preview behavior and persistence, including checkpoints followed by failure. [Receipt testing](testing.md#verification) locates tests. Conversion changes additionally use the applicable [quality rule](quality.md).
