# Developing receipt fetchers

Use for a new receipt provider or substantial API migration. Follow [code-change policies](../../project/README.md#code-changes).

## Establish provider behavior

Read the [operation contract](contract.md), [receipt semantics](receipt.md) and applicable [quality checks](quality.md#required-use) before choosing fields or endpoints. Define supported code formats, retrieval/preview capabilities, recognized outcomes and available receipt data. Choose the [base branch](../../project/workflow.md#branches-and-submission) before creating a branch or copying fixtures.

Use [protocol research](../protocol-research.md) to establish requests, encodings, redirects, state transitions and source field meanings. Derive complete expected receipts from observed responses; record missing cases beside the implementation/tests. An HTTP success or a matching total alone does not establish correct conversion.

## Implement a provider

Create `src/receiptFetchers/<name>-<country>/` under the [manifest registration rules](manifest.md#source-declaration). New files use TypeScript; keep only the layers required by the integration:

```text
ZenmoneyManifest.ts
index.ts
api.ts
fetchApi.ts
converters.ts
types.ts                    # Only when local DTOs are needed
__tests__/
  convertReceipt.test.ts
  convertReceipt-01.html    # Or .json
```

Follow [architecture](../architecture.md), [runtime](../runtime.md), [errors](../errors.md), and [authentication](../authentication.md) when present. Set user-facing text and `ZenMoney.locale` under the [language policy](../../project/style.md#language-and-audience). No receipt settings-file schema is defined. Shared receipt helpers/tests live in `src/common/receiptFetcher/`.

Use named imports; alias colliding functions locally (`fetchReceipt as fetchReceiptRaw` in `api`, `fetchReceipt as fetchReceiptApi` in `index`). `fetchApi` exposes directly mockable transport functions. Use `fetch`/`fetchJson` from [common/network](../../../src/common/network/index.ts), without a receipt-wide request wrapper or blanket numeric-token rewriting. Provider responses enter as `unknown` and are narrowed before conversion.

Preserve supported redirects, form encodings, locale labels, source scaling, identity and date precision. Decimal conversion follows [common values](receipt.md#scope-and-common-values). Network changes use the shared [logging rules](../README.md#shared-topics).

## Build artifacts

Use the shared [commands](../../project/workflow.md#commands), for example `yarn build kofd-kz` or a mixed build `yarn build btcscan kofd-kz`.

```text
build/kofd-kz/
  index.js
  ZenmoneyManifest.json
```

The [webpack configuration](../../../scripts/webpack.config.js) compiles the [module format](../README.md#build-pipelines) into a self-contained classic ES2020 script with public operation names preserved. It uses the shared polyfills, environment setup, minimization and obfuscation. The artifact MUST require no Node/DOM APIs, external module loader, additional runtime chunks or assets. Only scrape bundles include the bank result adapter.

Validation and bundling MUST complete before replacing the artifact pair. Failure retains the last valid pair and reports failure. Replacement is atomic per provider, not across a batch; subset builds preserve unrelated outputs. Cleanup stays within the selected output and its temporary staging directory.

Manifest contents and runtime metadata follow the [descriptor contract](manifest.md#generated-descriptor). Local builds do not implement application installation or publication.

## Verification

Verify supported receipts and operation outcomes under [receipt testing](testing.md), then follow [completion criteria](../../project/workflow.md#completion-criteria).
