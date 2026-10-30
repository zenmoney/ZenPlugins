# Scrape testing

Use for scrape behavior changes together with the shared [mandatory test requirements](../../project/testing.md#required-use).

## Required coverage

Every conversion behavior fix or improvement needs a regression test that fails before the fix and passes afterward. Other changes follow [focused tests outside conversion](../../project/testing.md#focused-tests-outside-conversion). Derive expectations from source evidence and contracts, not the current implementation. Organize converter cases around observed accounts/operations and their complete conversion; reference affected quality rule IDs as supporting context, not as a reason to split one conversion into field-level tests.

Account tests call public `convertAccounts` with the complete relevant graph/statement set under [account quality](quality/accounts.md). Transaction tests cover affected [quality topics](quality/README.md#topics-to-assess), including final grouping. Include available real expenses, income and internal transfers; missing bank examples remain evidence gaps. File-specific coverage follows the [file-import contract](file-import.md#evidence-and-verification).

## Complete input and output in each case

Each new or changed account/transaction converter case MUST show its complete raw bank input and explicit full expectation together in one test block or table entry in the same file. Follow [fixture rules](../../project/fixtures.md) and the actual converter input contract, including multi-response/preprocessing context when needed.

Tests MUST assert the entire returned account(s)/transaction(s) with deep equality, including nested fields, `fetchParams`, and `groupKeys` when emitted. Partial matchers or field assertions MAY supplement but MUST NOT replace the full expectation. Do not derive it from converter output, shared defaults, or other expectations. For an observed rejection case, assert the intended error under [error verification](../errors.md#verification).

Readers MUST NOT need other files, cases, factories, spreads, or snapshots to reconstruct either side. Separate fixture/expectation registries such as `expect(convertTransaction(fixtures[7])).toEqual(expectations[15])` are forbidden; named lookups have the same problem.

For a regression, add the observed failing source and its full corrected expectation together, or update that exact case if it already exists. Helper-only tests or changed-field assertions do not suffice. Preserve unrelated legacy cases; existing layout/language exceptions do not exempt new or changed cases from this format.

### Transfers

A single bank-side case MAY expect a complete transfer half with its `groupKeys`; it need not invent or load an unobserved counterpart. For a case covering both sides, place both complete raw records and each side's full expected conversion together in the same case. Then verify matching non-null `groupKeys` at the applicable strategy position, or pass the converted sides to `adjustTransactions({ transactions })` and assert the complete result containing one merged transfer. When final grouping behavior is affected, the latter check is required under [transfer quality](quality/transfers.md#transfer-004-verify-the-final-financial-effect). A grouping assertion does not replace the visible raw-to-converted pair for each side.

## Bank data and model tests

### Bank parsing and interpretation

Bank parsing/classification, including helper tests, follows the shared [observed-evidence rule](../../project/fixtures.md#observed-evidence).

Generalize optimistically within the observed bank format. A real `PYATEROCHKA / MOSCOW / RUS` record can justify a `title / city / country` parser without multiple samples or hypothetical slash-containing counterexamples. Preserve the record and expected result; refine the parser when real contradictory data arrives. Apply the same principle to comments and operation types: retain the most informative supported interpretation. Do not export the grammar to unrelated formats or guess missing amounts, currencies, or field meanings; record actual unresolved ambiguities.

### Model boundary

Use the shared [model boundary](../../project/testing.md#model-tests) for provider-independent invariants, including generic grouping over domain objects.

## Test placement

For new plugins, substantial migrations, and plugins already using this layout:

```text
src/plugins/<PLUGIN_ID>/__tests__/converters/accounts/<type>.test.ts
src/plugins/<PLUGIN_ID>/__tests__/converters/transactions/<type>.test.ts
```

Use one file per account/operation class with cases inside it, such as `card`, `loan`, `purchase`, `innerTransfer`, `outerTransfer`, `cashWithdrawal`, or `refund`. Focused legacy fixes keep their existing layout, with new or changed cases following the [complete input/output format](#complete-input-and-output-in-each-case).

## Tests by layer

Select affected boundaries under the shared [test design and placement rules](../../project/testing.md#test-value-and-placement).

| Layer | Verify |
| --- | --- |
| `fetchApi` | Endpoint URL/method/query/body/headers, envelope validation, sanitized assertion context; affected [logging checks](../../debugging/log-sanitization.md#required-sanitization-tests) |
| `api` | Auth/state migration decisions, user interaction, pagination/retries, exact error classification; persistence is modeled through inputs/outputs or callbacks |
| File `parser` | Supported document formats converted to complete bank records; source evidence, format validation, and deterministic parsing under the file-import contract |
| `converters` | Complete accounts/transactions and fetch plans when applicable, relationships and domain invariants; real bank records for interpretation |
| `index` | Plan consumption once where applicable, selection/grouping, background/UI boundary, immediate persistence of each confirmed auth update despite later failure, nonempty accounts, original unexpected errors propagated |
