# Scrape plugin preferences

Read when changing a scrape plugin's `preferences.xml`, referenced by its [manifest](manifest.md). This page defines the settings format and behavior for scrape plugins. Other plugin types define their own settings structure and semantics.

Example source: [preferences.xml](../../../src/plugins/example/preferences.xml). The format is inspired by Android preferences, but Zenmoney adapters define the supported attributes; do not assume every Android preference feature is supported.

## Controls and values

Supported controls are `EditTextPreference`, `ListPreference`, and `CheckBoxPreference`. A control's `key` identifies the value in plugin preferences. Keep keys stable across versions or explicitly handle a migration. Validate malformed or unsupported values in `api` using the [error policy](../errors.md); an input widget does not replace validation.

Use `obligatory="true"` for required text settings, `inputType` for the appropriate input (for example `textPassword` or `date`), and `defaultValue` where supported. Keep titles, explanations, prompts, and plugin-authored errors in the same language as `ZenMoney.locale`; see [style](../../project/style.md).

```xml
<EditTextPreference
    key="password"
    obligatory="true"
    inputType="textPassword"
    title="Password"
    dialogTitle="Password"
    dialogMessage="Enter the password used by your bank"
    positiveButtonText="OK"
    negativeButtonText="Cancel"
    summary="||***********"
/>
```

The password summary masks the display; it does not sanitize network/diagnostic output. Follow [log sanitization](../../debugging/log-sanitization.md) separately. Do not commit real preference values in local JSON configuration.

## Lists

`entries` contains displayed labels separated by `|`; `entryValues` contains their corresponding saved values in the same order. `defaultValue` selects one saved value, not its display label. The arrays must have equal lengths. Keep values stable and validate accepted values in `api`, including previously saved settings after a choice changes.

This shortened format example is based on `src/plugins/vrbank-de/preferences.xml` in `develop`. The source path is branch-scoped; no internal implementation needs to be copied into master.

```xml
<ListPreference
    key="district"
    title="Geschäftsviertel"
    dialogTitle="Geschäftsviertel"
    entries="BIC manuell angeben|Berliner Volksbank Abteilung BIT"
    entryValues="BIC|BERLINER_VOLKSBANK_ABTEILUNG_BIT_BEVODEBBXXX"
    defaultValue="BIC"
    positiveButtonText="OK"
    negativeButtonText="Abbrechen"
    summary="||{@s}"
/>
```

The first choice stores `district: 'BIC'`; the second stores `district: 'BERLINER_VOLKSBANK_ABTEILUNG_BIT_BEVODEBBXXX'`. The preference key selects the destination property. Verify native display/default/saved-value behavior in the target app; the browser reader does not implement this control.

## Checkboxes

Use `checked="true"` or `checked="false"` for the initial state. The documented Android/iOS behavior carried from develop does not use `defaultValue` for checkboxes; an existing user value overrides `checked`.

Use `summaryOn` and `summaryOff`. Set both to the same text when the description applies in either state. Legacy screens select the description by state; the documented current Android/iOS adapters use a nonempty `summaryOff` as the checkbox description. They do not use generic `summary` for this purpose. `inputType`, dialog title/message, and positive/negative button text are ignored for checkboxes.

```xml
<CheckBoxPreference
    key="includeSavings"
    title="Include savings accounts"
    checked="true"
    summaryOn="Load supported savings accounts"
    summaryOff="Load supported savings accounts"
/>
```

Native adapter implementations are outside this repository. Verify new control behavior in the target application rather than inferring it from the browser harness.

## Scrape history start date

The current scrape adapter requires `startDate`:

```xml
<EditTextPreference
    key="startDate"
    obligatory="true"
    inputType="date"
    title="From what date to load transactions"
    defaultValue="2018-01-01T00:00:00.000Z"
    dialogTitle="From what date to load transactions"
    positiveButtonText="OK"
    negativeButtonText="Cancel"
    summary="|startDate|{@s}"
/>
```

The adapter uses it to derive `fromDate`, then removes it from the settings passed to `scrape`. Repeated-run overlap is defined by the [scrape contract](contract.md#dates-and-repeated-runs). In the [file-import variant](file-import.md#import-scope-and-repeated-runs), file selection defines the imported period; keep `startDate` for adapter compatibility and explain its limited role in setup.

## Local verification

The [browser schema reader](../../../scripts/utils.js) currently extracts `EditTextPreference` keys, obligation flags, and defaults only. Supply representative local settings explicitly when testing lists/checkboxes. Check absent values, defaults, saved overrides, invalid values, and the actual native settings screen. [Bootloader](../../debugging/bootloader.md) uses its own local configuration without changing the production preference schema.
