# Scrape testing

Use for scrape behavior changes. Shared runner setup and commands follow [code verification](../../project/testing.md#verification-for-code-changes).

## Required coverage

Every behavior fix or improvement needs a regression test that fails before the fix and passes afterward. Derive expectations from source evidence and contracts, not the current implementation; reference affected quality rule IDs.

Assert the full converted account/transaction with deep equality, including `fetchParams` and `groupKeys` when emitted. Field assertions may supplement, not replace, the full result. Account tests call public `convertAccounts` with the complete relevant graph/statement set under [account quality](quality/accounts.md). Transaction tests cover affected [quality topics](quality/README.md#topics-to-assess), including final grouping. Include available real expenses, income and internal transfers; missing bank examples remain evidence gaps. File-specific coverage follows the [file-import contract](file-import.md#evidence-and-verification).

## Bank data and model tests

### Bank parsing and interpretation

Bank parsing/classification MUST use observed inputs preserved under [fixture rules](../../project/fixtures.md). Do not invent formats, separators, fields, values, missing-field variants, or counterparts, even for isolated parsers or robustness tests.

Generalize optimistically within the observed bank format. A real `PYATEROCHKA / MOSCOW / RUS` record can justify a `title / city / country` parser without multiple samples or hypothetical slash-containing counterexamples. Preserve the record and expected result; refine the parser when real contradictory data arrives. Apply the same principle to comments and operation types: retain the most informative supported interpretation. Do not export the grammar to unrelated formats or guess missing amounts, currencies, or field meanings; record actual unresolved ambiguities.

### Model boundary

Shared [model-test rules](../../project/testing.md#model-tests) allow synthetic invariants, including generic grouping over domain objects. They do not establish bank-specific parsing/grouping strategies or replace real-record converter tests.

## Test placement

For new plugins, substantial migrations, and plugins already using this layout:

```text
src/plugins/<PLUGIN_ID>/__tests__/converters/accounts/<type>.test.ts
src/plugins/<PLUGIN_ID>/__tests__/converters/transactions/<type>.test.ts
```

Use one file per account/operation class with cases inside it, such as `card`, `loan`, `purchase`, `innerTransfer`, `outerTransfer`, `cashWithdrawal`, or `refund`. Match the function's actual input contract: a converter may require complete objects from several bank responses plus existing preprocessing context. Focused legacy fixes keep their existing layout.

## Tests by layer

| Layer | Verify |
| --- | --- |
| `fetchApi` | Endpoint URL/method/query/body/headers, envelope validation, sanitized assertion context; affected [logging checks](../../debugging/log-sanitization.md#required-sanitization-tests) |
| `api` | Auth/state migration decisions, user interaction, pagination/retries, exact error classification; persistence is modeled through inputs/outputs or callbacks |
| File `parser` | Supported document formats converted to complete bank records; source evidence, format validation, and deterministic parsing under the file-import contract |
| `converters` | Complete accounts/transactions and fetch plans when applicable, relationships and domain invariants; real bank records for interpretation |
| `index` | Plan consumption once where applicable, selection/grouping, background/UI boundary, immediate persistence of each confirmed auth update despite later failure, nonempty accounts, original unexpected errors propagated |
