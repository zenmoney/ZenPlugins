# Scrape plugin manifest

Read when registering/building a scrape plugin. Scrape plugins use XML metadata and a JavaScript or TypeScript module. The TS/JS metadata format is described under [build pipelines](../README.md#build-pipelines). All types follow the shared [plugin-name rules](../README.md#plugin-names).

Sources: [example manifest](../../../src/plugins/example/ZenmoneyManifest.xml), [XML parser](../../../scripts/utils.js), and [manifest loader](../../../scripts/plugin-manifest-loader.js). The optional settings file follows the [preferences.xml contract](preferences.md).

```xml
<?xml version="1.0" encoding="utf-8"?>
<provider>
    <id>example</id>
    <company>0</company>
    <description>Synchronize supported accounts and transactions.</description>
    <codeRequired>false</codeRequired>
</provider>
```

| Field | Meaning |
| --- | --- |
| `id` | Plugin identifier matching the directory/build target |
| `company` | Zenmoney company ID; use `0` for a new sample until the real mapping is assigned during review |
| `description` | User-facing explanation of the integration and required setup |
| `codeRequired` | Whether every run requires user input; set explicitly |
| `subscriptionRequired` | When `true`, the scrape wrapper checks the application's subscription state |
| `api` | Loader forwards the supplied value, defaulting to `private` |

Plain-text descriptions may be indented for readability in source XML. Builds and local debugging remove leading/trailing blank lines and all leading indentation from the first text line, whether it follows the opening tag directly or starts on a later line. The remaining nonblank lines determine the minimum indentation removed from those lines, preserving their relative indentation and paragraph breaks. Other manifest fields and settings values are unchanged.

Source XML omits `version` and `build`, following the shared [publication metadata contract](../README.md#publication-metadata).

## Source files and build output

Each plugin MUST have exactly one `index.js` or `index.ts` beside its manifest. An optional `preferences.xml` defines settings by its filename; neither source file is declared in the manifest.

`codeRequired: false` expresses that runs can complete without user interaction; it does not grant UI access in the background. Follow [runtime UI rules](../runtime.md#background-execution-and-ui) and the [authentication challenge boundary](../authentication.md). Do not rely on a missing-value default: older prose said the default was true, while the checked-in loader sets `isUserInputRequiredOnEveryRun` only when the XML value equals the string `true`. Explicit values avoid this discrepancy.

The entrypoint module exports `scrape` or `main`, never both. The loader adapts scrape to the global host API and recognizes optional `makeTransfer`; other exports are not a supported interface merely because they compile. Do not infer a money-moving interface from the scrape contract. Future plugin types must document their own loader/export contract under [documentation ownership](../../project/documentation.md#one-home-for-each-rule).

The shared webpack build writes `build/<source-name>/index.js`, a generated `ZenmoneyManifest.xml` and, when present, an unchanged `preferences.xml`. The generated XML preserves author metadata. The bundle exposes the `main` interface; it does not expose the source `scrape` function.

Local debugging follows the same file conventions. A missing `preferences.xml` means an empty settings form; errors reading an existing file remain failures. Settings required by an operation, including the scrape adapter's [start date](preferences.md#scrape-history-start-date), still need to be supplied.

Validate identifier/path consistency, the entrypoint, optional settings, explicit interaction policy, user-facing language, and the target production build. Keep local credentials and Bootloader overrides out of the manifest.
