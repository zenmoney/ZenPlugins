# File-based scrape contract

Applies to scrape plugins whose financial source is a user-selected statement, such as PDF, XLS/XLSX, or CSV. This is a variant of [scrape](contract.md), with the same exported `scrape` function, arguments, account/transaction result, [XML manifest](manifest.md), and [preferences](preferences.md). It needs no additional host export or loader. The module boundaries below apply to new implementations and substantial migrations; focused legacy fixes preserve the existing structure.

## Input and lifecycle

1. Honor the shared [background/UI contract](../runtime.md#background-execution-and-ui). A run requiring file selection cannot proceed in the background; propagate the host's `UserInteractionError` without treating it as an empty selection. Set `codeRequired` to `true` when every run needs that selection.
2. In the foreground, obtain files through `ZenMoney.pickDocuments` using supported MIME types and the integration's single/multiple-file policy. Validate supported format, content, and any documented size limits; filename and MIME type alone do not establish the statement format. Do not assume that a missing MIME type proves the file invalid.
3. Read the selected files, extract their text/rows where needed, and parse all statements before assembling a successful result. File selection is required input under [runtime validation](../runtime.md#execution-environment-and-api-references); an empty selection must not become a successful empty scrape.
4. Convert the complete statement set into accounts and transactions, group transfers, apply account selection, and return the normal scrape result. Do not publish a partial result when another selected file fails to read, parse, or convert. Use the shared [error policy](../errors.md); an unknown format change or parser failure remains reportable.

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `index` | Export `scrape`, set the plugin language, pass execution context, own any physical persistence, call acquisition/conversion, group transactions, apply skips, assemble the result |
| `api`, when needed | File-selection workflow, validation of user choices, reading `Blob` contents, document-library extraction, and sequencing calls to the pure parser |
| `parser` or `parser-<format>` | Deterministic document content → bank-specific statement records; validate the observed format, preserve account identity, statement period, balance date, and operation evidence |
| `converters` | Complete statement records → domain accounts and transactions, including account correlation, balance selection, stable identities, overlap handling, and grouping keys |
| `models` / `types` | Behavior-free local types shared by these modules |

The parser's public boundary is `parseStatement(content): ParsedStatement[]`: one document may describe several accounts. The content type (text, rows, or bytes) and `ParsedStatement` are local to the integration. Keep parsing pure: no host UI, HTTP, storage, implicit current time, or dependence on workflow modules. Pass any required context explicitly. Converters consume parsed records and do not acquire files or repeat document extraction.

The usual dependencies are `index → api → parser` and `index → converters`. A simple host pick/read sequence MAY stay in `index` when it does not need a separate workflow module; parsing still stays outside the entrypoint. Do not add an HTTP `fetchApi`, login flow, or empty `api` solely to match a network plugin's layout.

`convertAccounts(statements)` receives the complete relevant statement set and returns the final `Account[]`. Transaction conversion uses those same records and accounts. Keep relationship/mapping helpers inside converters; `index` must not independently correlate accounts. There is no `fetchParams` plan when the history is already in the selected documents. A hybrid integration that additionally loads account-dependent history follows [sync plans](account-sync-plans.md) for that loading path.

## Import scope and repeated runs

Import every supported operation in the selected files on every run, including the first. `fromDate`, `toDate`, and `isFirstRun` MUST NOT truncate the selected statements or turn the first import into accounts-only synchronization. The required `startDate` preference remains for adapter compatibility; explain in setup that file selection defines the imported period. This exception belongs to the file variant and does not relax remote history-fetching rules.

Merge files for the same account while keeping different accounts/currencies separate. Choose account metadata and balance by the statements' effective dates, not file selection order. A balance describes the latest supplied statement snapshot, not an independently verified present-day balance. Conflicting equally recent snapshots require investigation rather than an arbitrary winner.

Re-importing the same files or overlapping periods must not duplicate financial effects. Apply [movement identity](quality/amounts-and-statuses.md#id-001-keep-movement-identities-stable) and deduplicate confirmed overlaps without collapsing distinct equal-looking operations. Do not use filenames, import time, or selection order as account or movement identity.

Keep discovered accounts under the shared [skip rules](contract.md#skipped-accounts). The selected documents already supply history, so use their available evidence for grouping and omit final operations affecting only skipped accounts. A transfer affecting an included account must remain; no extra request is needed to use a counterpart record already present in the files.

## Evidence and verification

Use complete observed statement records under [fixture rules](../../project/fixtures.md). Parser tests cover source text/rows/bytes; converter tests assert complete accounts and transactions from the parsed statement set. All applicable [quality rules](quality/README.md) still apply. Missing bank examples remain evidence gaps, not invented format variants.

Verify supported formats/languages, several accounts, empty history with valid accounts, overlapping files, repeat imports, file-order independence, latest-snapshot selection, identical-looking distinct rows, transfer grouping, and mixed skipped accounts where supported. Entrypoint tests cover full import despite scrape dates/first-run state, propagation of the host's background rejection, missing required selection, and failure of the whole import after a selected file fails. Generic control-flow cases may use separately marked model tests under [testing](../../project/testing.md#model-tests).

Existing [MBank](../../../src/plugins/mbank-kg/README.md) and [Simbank](../../../src/plugins/simbank-kg/README.md) notes describe their statement formats and full-file import scope; they are evidence references, not proof that every current implementation follows all rules above.
