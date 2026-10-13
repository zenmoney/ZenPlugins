# Receipt testing

Use for receipt behavior changes. Shared runner setup and commands follow [code verification](../../project/testing.md#verification-for-code-changes).

## Source evidence

Derive provider parsing and complete expected receipts from observed responses under [fixture rules](../../project/fixtures.md#public-receipt-data). Preserve actual formats and field meanings; record missing cases beside the implementation/tests instead of fabricating provider responses. Synthetic invariants follow the shared [model-test distinction](../../project/testing.md#model-tests).

Every behavior fix or improvement needs a regression test that fails before the fix and passes afterward. Assert full expected receipts against the applicable [quality cases](quality.md). Do not preserve swallowed failures, guessed quantities or truthiness-based removal of zero as expectations.

## Fixtures

Keep complete inputs beside tests as `<testName>-NN.html` or `.json`; import them through shared [resource imports](../../project/bundles.md#resource-imports), for example `import html from './convertReceipt-01.html'`. Avoid escaped HTML in JSON, expectation wrappers, fixture registries and modules that only assemble case arrays.

## Verification

A focused provider run is `yarn jest kofd-kz --runInBand`; all receipt and tooling tests run with `yarn jest src/common/receiptFetcher src/receiptFetchers scripts/__tests__ --runInBand`. Select the affected boundaries:

| Boundary | Evidence |
| --- | --- |
| Conversion | Complete source responses and expected receipts beside the provider; applicable [quality cases](quality.md) |
| Workflow/transport | Lookup variants, encoding, redirects; results, errors, background interaction, preview and persistence under the [operation contract](contract.md#verification); shared [logging checks](../../debugging/log-sanitization.md#required-sanitization-tests) |
| Metadata | [Domain tests](../../../src/common/receiptFetcher/manifest.test.ts): matcher/country/identity validation and serialization; [module tests](../../../scripts/__tests__/pluginManifestLoader.test.ts): exports and source correspondence |
| Build/lifecycle | [Artifact tests](../../../scripts/__tests__/pluginBuild.test.ts): JS/TS imports, minimal host execution, no initial requests, metadata, both operation wrappers, checkpoints/failures and failed-build preservation |
| Bank compatibility when changing shared builds | Same artifact suite: JS/TS scrape entrypoints, XML file lists, optional preferences and adapted `main` |
| Types/values | [Type fixtures](../../../src/types/receiptFetcher.typecheck.ts), [runtime validation](../../../src/common/receiptFetcher/receipt.test.ts), provider tests |

The builder checks TypeScript before emission using the root configuration. Lint, TypeScript and Jest settings are shared with scrape plugins. Offline checks establish only the tested local behavior.
