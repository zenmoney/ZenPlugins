# Scrape plugin manifest

Read when registering/building a scrape plugin. This XML format belongs to the checked-in scrape/legacy-main pipeline. Other plugin types define their own manifest format and loader contract.

Sources: [example manifest](../../../src/plugins/example/ZenmoneyManifest.xml), [XML parser](../../../scripts/utils.js), and [manifest loader](../../../scripts/plugin-manifest-loader.js). Settings referenced by the manifest are described in [preferences.xml](preferences.md).

```xml
<?xml version="1.0" encoding="utf-8"?>
<provider>
    <id>example</id>
    <company>0</company>
    <description>Synchronize supported accounts and transactions.</description>
    <version>1.0</version>
    <build>1</build>
    <modular>true</modular>
    <files>
        <js>index.js</js>
        <preferences>preferences.xml</preferences>
    </files>
    <codeRequired>false</codeRequired>
</provider>
```

| Field | Meaning |
| --- | --- |
| `id` | Plugin identifier matching the directory/build target |
| `company` | Zenmoney company ID; use `0` for a new sample until the real mapping is assigned during review |
| `description` | User-facing explanation of the integration and required setup |
| `version`, `build` | Existing metadata; preserve the template convention unless the release process requires a change |
| `modular` | `true` for the modular loader |
| `files` | For this loader, exactly the `index.js` and `preferences.xml` entries shown; TypeScript source is resolved by the build |
| `codeRequired` | Whether every run requires user input; set explicitly |
| `subscriptionRequired` | When `true`, the scrape wrapper checks the application's subscription state |
| `api` | Loader forwards the supplied value, defaulting to `private` |

`codeRequired: false` expresses that runs can complete without user interaction; it does not grant UI access in the background. Follow [runtime UI rules](../runtime.md#background-execution-and-ui) and the [authentication challenge boundary](../authentication.md). Do not rely on a missing-value default: older prose said the default was true, while the checked-in loader sets `isUserInputRequiredOnEveryRun` only when the XML value equals the string `true`. Explicit values avoid this discrepancy.

For this packaging path, the entrypoint exports `scrape` or the legacy `main`, never both. The loader adapts scrape to the global host API and recognizes optional `makeTransfer`; other exports are not a supported interface merely because they compile. Do not infer a money-moving interface from the scrape contract. Future plugin types must document their own loader/export contract under [plugin types](../README.md#plugin-types).

Validate identifier/path consistency, the files section, explicit interaction policy, user-facing language, and the target production build. Keep local credentials and Bootloader overrides out of the manifest.
