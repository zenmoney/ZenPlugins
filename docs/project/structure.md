# Repository structure

Read when placing files or finding the source of a contract.

```text
docs/                   Canonical documentation
locales/                Common user-facing error translations
scripts/                Build, browser debugging, and Bootloader server
src/
  common/               Cross-plugin helpers and their tests
    receiptFetcher/     Shared receipt helpers and their tests
  types/
    index.d.ts          Global ZenMoney state, UI and lifecycle API
    zenmoney.ts         Scrape domain types and entrypoint signature
    receiptFetcher.ts   Receipt operations, values, manifest and descriptor types
    get.ts              Safe access to unknown values
  UI/                   Browser development interface
  plugins/
    <plugin-id>/        Existing scrape plugin implementation
      index.ts          Exported operation and physical persistence
      api.ts            Service workflows
      fetchApi.ts       Service transport
      converters.ts     Pure domain conversion
      models.ts         Local types and behavior-free DTOs
      preferences.xml   Settings form
      ZenmoneyManifest.xml
      __tests__/        Tests near the plugin
  receiptFetchers/
    <name>-<country>/   Receipt provider
      ZenmoneyManifest.ts # Or .js; declarative named manifest
      index.ts          # Or .js; declared receipt operation exports
      __tests__/        Tests beside raw HTML/JSON inputs
```

The layer layout is defined by [architecture](../plugins/architecture.md). The `src/plugins` subtree above illustrates a network scrape implementation; the [file-import variant](../plugins/scrape/file-import.md#module-boundaries) uses a document parser and omits unneeded transport/workflow layers. Receipt source/build registration follows the [receipt manifest](../plugins/receipt-fetchers/manifest.md) and [development guide](../plugins/receipt-fetchers/development.md). A future type must likewise define its registration without duplicating the runtime.

The [shared utilities index](../plugins/utilities.md) locates runtime adapters and network helpers.

## Placement rules

- Use TypeScript for all new code files under [style](style.md#type-safety). Preserve the language and public structure when editing an existing legacy file during an isolated fix.
- Keep bank-specific parsers, crypto/protocol details, fixtures, and DTOs inside that plugin. Keep existing plugin-local documentation in place; do not create a README for every plugin as part of general documentation work.
- Add code to `src/common` only when its behavior is reusable across integrations. A similarly named bank field is not sufficient evidence that two protocols are interchangeable.
- Keep scrape domain types in `src/types/zenmoney.ts`, receipt types in `src/types/receiptFetcher.ts`, native transport constructors and their types together in `src/common`, and the remaining global host API declarations in `src/types/index.d.ts`. Keep service response validation close to the consuming layer.
- Use the existing test layout for a focused legacy fix. For new implementations use the type's [test layout](testing.md#verification-for-code-changes).
- Put raw local logs in `logs/<plugin-id>.log` or `logs/<plugin-id>/`. Keep captures/APKs in an ignored local directory such as `.local/research/<plugin-id>/`; publish only selected safe examples.
- Plugin build output is `build/<source-name>/index.js` beside `ZenmoneyManifest.xml` for scrape or `ZenmoneyManifest.json` for receipts. Scrape output also includes optional `preferences.xml` under the [source-file contract](../plugins/scrape/manifest.md#source-files-and-build-output). Receipt [artifact requirements](../plugins/receipt-fetchers/development.md#build-artifacts) apply within the shared build. Browser files such as `zp_preferences.json` and Bootloader configuration contain local state and belong outside Git.

## Sources of truth

| Subject | Primary source |
| --- | --- |
| Exact TypeScript field shapes | [Scrape declarations](../../src/types/zenmoney.ts), [receipt declarations](../../src/types/receiptFetcher.ts), [runtime declarations](../../src/types/index.d.ts) |
| Meaning and required behavior | The corresponding contract and quality document |
| Actual adapter/build behavior | [adapters](../../src/common/adapters.js), [manifest loader](../../scripts/plugin-manifest-loader.js), [webpack configuration](../../scripts/webpack.config.js) |
| Commands | [package.json](../../package.json), [wrapper](../../scripts/wrapper.js) |
| Evidence for a bank-specific decision | Its tests and existing integration notes beside the affected plugin |

A discrepancy between code and a requirement is a defect or an unresolved policy question. Do not silently turn an accidental implementation detail into a general requirement.
