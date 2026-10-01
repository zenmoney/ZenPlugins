# Testing and verification

Use for executable changes, including runnable documentation examples. Documentation-only verification follows [maintenance](documentation.md#review-checks); every MR/PR also requires [submission checks](workflow.md#submission-checks).

## Verification for code changes

- Every behavior fix or improvement needs a regression test that fails before the fix and passes afterward. Derive expectations from source evidence and contracts, not the current implementation.
- Assert the full converted account/transaction with deep equality, including `fetchParams` and `groupKeys` when emitted. Field assertions may supplement, not replace, the full result.
- Account tests call public `convertAccounts` with the complete relevant graph/statement set under [account quality](../plugins/scrape/quality/accounts.md). Transaction tests cover affected [quality topics](../plugins/scrape/quality/README.md#topics-to-assess), including final grouping. File-specific coverage follows the [file-import contract](../plugins/scrape/file-import.md#evidence-and-verification).
- Include available real expenses, income, and internal transfers; report missing bank examples as evidence gaps.
- Keep dates deterministic. Use fixed dates or freeze the clock; cover relevant interval/time-zone boundaries.
- Preserve an isolated legacy plugin's existing suite/layout. New test files use TypeScript. Use `fetch-mock` for network mocks.
- Run focused Jest tests during development, lint the changed plugin at completion, and type-check changed TypeScript interfaces. Changes to `src/common` require full `yarn test` even without MR submission. Commands are in [workflow](workflow.md#commands).

For bank data, read the evidence rules below and [fixture preservation](fixtures.md). Exact error/auth/log matrices belong to [errors](../plugins/errors.md#verification), [authentication](../plugins/authentication.md#verification), and [sanitization](../debugging/log-sanitization.md#required-sanitization-tests); use those affected by the change.

## Bank data and model tests

### Bank parsing and interpretation

Bank parsing/classification MUST use observed inputs preserved under [fixture rules](fixtures.md). Do not invent formats, separators, fields, values, missing-field variants, or counterparts, even for isolated parsers or robustness tests.

Generalize optimistically within the observed bank format. A real `PYATEROCHKA / MOSCOW / RUS` record can justify a `title / city / country` parser without multiple samples or hypothetical slash-containing counterexamples. Preserve the record and expected result; refine the parser when real contradictory data arrives. Apply the same principle to comments and operation types: retain the most informative supported interpretation. Do not export the grammar to unrelated formats or guess missing amounts, currencies, or field meanings; record actual unresolved ambiguities.

### Model tests

Synthetic data MAY test implementation invariants independently of bank format: timeout/error propagation, canceled input, immediate state persistence followed by failure, scheduling, or a generic grouping algorithm operating on domain objects. Mark the test/suite `[model]` and state in an English comment which invariant is modeled. Mock a failure directly rather than inventing a bank error response to justify its classification.

Keep model tests separate from bank fixtures. They verify generic invariants, not bank-specific parsing/grouping strategies, and cannot replace real-record converter tests. Neither model tests, illustrative documentation examples, nor existing synthetic parsing tests establish bank behavior, reproduce an incident, or fill missing bank coverage.

## Test placement

For new plugins, substantial migrations, and plugins already using this layout:

```text
src/plugins/<PLUGIN_ID>/__tests__/converters/accounts/<type>.test.ts
src/plugins/<PLUGIN_ID>/__tests__/converters/transactions/<type>.test.ts
```

Use one file per account/operation class with cases inside it, such as `card`, `loan`, `purchase`, `innerTransfer`, `outerTransfer`, `cashWithdrawal`, or `refund`. Match the function's actual input contract: a converter may require complete objects from several bank responses plus existing preprocessing context.

## Tests by layer

| Layer | Verify |
| --- | --- |
| `fetchApi` | Endpoint URL/method/query/body/headers, envelope validation, sanitized assertion context, actual request/response log output |
| `api` | Auth/state migration decisions, user interaction, pagination/retries, exact error classification; persistence is modeled through inputs/outputs or callbacks |
| File `parser` | Supported document formats converted to complete bank records; source evidence, format validation, and deterministic parsing under the file-import contract |
| `converters` | Complete accounts/transactions and fetch plans when applicable, relationships and domain invariants; real bank records for interpretation |
| `index` | Plan consumption once where applicable, selection/grouping, background/UI boundary, immediate persistence of each confirmed auth update despite later failure, nonempty accounts, original unexpected errors propagated |
