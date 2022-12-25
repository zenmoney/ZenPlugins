# preferences.xml
- [File example](../src/plugins/example/preferences.xml)
- Structure inspired by [Android Preferences](https://developer.android.com/guide/topics/ui/settings.html).
- `key` attribute will be used as key in preferences object for scrape function
    - `startDate` will be `fromDate` for the first run
- `startDate` field is required:
    ```
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
- Supported `EditTextPreference`, `ListPreference`, `CheckBoxPreference`.
- Use ```inputType="textPassword"``` for passwords for example
  ```
  <EditTextPreference
      key="password"
      obligatory="true"
      inputType="textPassword"
      title="Password"
      dialogTitle="Password"
      dialogMessage="Some detauls"
      positiveButtonText="OK"
      negativeButtonText="Cancel"
      summary="||***********"
  />
  ```
