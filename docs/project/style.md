# Types and language

Read for new code and changes to diagnostics, user-facing text, or TypeScript models. These conventions apply to every plugin type.

## Type safety

- All new code files MUST use TypeScript, including new plugins, provider wrappers, helpers, and tests. This applies to every plugin type. A focused change inside an existing JavaScript file keeps that file's language; it does not authorize new JavaScript modules or an unrelated migration
- Never use `any` in TypeScript
- Bank API responses should be typed as `unknown`
- Use helper functions from `src/types/get.ts` for safe property access
- Do not insert `unknown`/`any` directly into template strings — narrow the type first or use `String(...)`
- Keep discriminated-union literals narrow in test fixtures. For example, a deposit fixture must retain `AccountType.deposit` rather than widening `type` to the full `AccountType` enum

## Language and audience

- **Code and developer-facing text**: Always use English for variable/function names, comments, commit messages, test descriptions, plugin-authored `console.*` messages, assertion messages, ordinary `Error` messages, internal control-flow error messages, and other diagnostics intended for logs or developers
- Do not translate raw bank payloads, bank-authored error text, transaction descriptions, merchant data, or other source values merely for logging. The English-only rule applies to text authored by the plugin
- **User-facing text**: Use one plugin language consistently for `preferences.xml`, `ZenMoney.readLine` prompts and choices, plugin-authored account titles or labels, and plugin-authored messages passed through user-facing `ZPAPIError` subclasses
- Prefer the language of the bank's country, following the language the current bank application uses for customers in that country. This is a product-language choice, not a limitation imposed by currently available common translations
- Set `ZenMoney.locale` explicitly in the plugin entrypoint to the same language chosen for plugin-authored user-facing text. `ZenMoney.locale` may contain any locale value; missing common resources for that value do not require choosing a different language and can be added later if needed
- A verbatim bank-authored `BankMessageError` is an explicit exception to the plugin-language rule and remains in the language returned by the bank
- Never expose an internal English diagnostic by copying `error.message` into a user-facing error. Keep unexpected errors ordinary and reportable under the [error classification rules](../plugins/errors.md)
- Tests for changed text must verify the boundary: internal diagnostics are English, plugin-authored user-facing strings use the chosen country language, verbatim `BankMessageError` text is preserved, and `ZenMoney.locale` matches the plugin-authored language
- **Communication with the user while developing**: Use the language the user started the dialog in
