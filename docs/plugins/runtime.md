# Shared plugin runtime

Read when using platform facilities or changing an entrypoint, persistence, or interaction. This environment is shared by all plugin types. Exported functions and their argument/result contracts are documented per type; the account/transaction adapter is specific to [scrape](scrape/contract.md).

## Execution environment and API references

Production bundles execute inside the Zenmoney application on the user's device. The browser development harness emulates that environment; it is not proof of native compatibility. Do not depend on Node filesystem/process facilities or browser DOM APIs simply because they exist on a development machine.

The checked-in [ZenMoney declarations](../../src/types/index.d.ts) describe the typed global API. [Polyfills](../../src/polyfills.js), [browser API implementation](../../src/ZPAPI.js), and [network helpers](../../src/common/network.js) document additional implementation details. Some host APIs and feature flags used by existing code are not in the declarations; an observed browser method is not automatically a guarantee on every native build.

| Facility | API / source | Usage |
| --- | --- | --- |
| Plugin state | `getData`, `setData`, `saveData`, `clearData` | Connection-scoped persistent plugin data |
| User input | `readLine`, `alert` | Asynchronous UI; `readLine` may return `null`, including timeout |
| Files and camera | `pickDocuments`, `takePicture` | User-selected input; do not assume support on every host |
| Cookies | `getCookies`, `setCookie`, `restoreCookies`, `saveCookies`, `clearCookies` | Session transport and its persistence |
| TLS | `setClientPfx`, `trustCertificates` | Required service-specific certificate configuration |
| Environment | `device`, `application`, `locale` | Device/app metadata and plugin language |
| Diagnostics | `console.*`, `ZenMoney.trace`, `logEvent` | Logs and explicitly supported events |
| Networking | Shared `fetch`, `fetchJson`, WebView and WebSocket helpers | See [utilities](utilities.md) and [sanitization](../debugging/log-sanitization.md) |
| Account selection | `isAccountSkipped(id)` | Facility used by the [scrape contract](scrape/contract.md#skipped-accounts) |

`readLine` accepts text and optional `inputType`, image, and timeout in milliseconds. It returns `null` on timeout and does not provide a typed reason distinguishing cancellation from timeout. `takePicture` may also return `null`. Handle absent input according to the plugin's workflow: if the input is optional or a supported continuation exists, continue. If the plugin cannot continue without the input, fail validation with `console.assert(input !== null, 'Required input was not provided')` (or `assert`) and let the ordinary error propagate. Do not send absent input as an unchecked credential or return incomplete data as success. Do not invent a cancellation reason the host did not provide. Test both optional continuation and required-input termination where supported.

## State and lifecycle

`getData(name, defaultValue)` reads the stored value or the supplied default. Its result is `unknown`; validate persisted state just as carefully as network input. `setData` changes a key and `saveData` requests persistence. Do not rely on a `setData` call alone surviving the invocation. `clearData` clears plugin state and MUST NOT be used as a generic recovery for a network failure.

Store only data necessary for later invocations. Keep transient handles and live sessions separate. Version state when a migration needs it. The timing and validity of auth persistence are defined once in [authentication](authentication.md).

Cookie persistence follows the same [entrypoint boundary](architecture.md#boundaries); cookie transport belongs to `fetchApi`. Never expose stored state or credentials in ordinary diagnostics.

The [browser state implementation](../../src/ZPAPI.pluginData.js) tracks whether persistence was requested. [Bootloader state overrides](../debugging/bootloader.md#plugin-data) are development controls, not production persistence guarantees.

## Background execution and UI

`isInBackground: true` means that the plugin is running without access to user interaction. For scrape it is an entrypoint argument; another plugin type must define how it receives the same execution context. The restriction applies to every UI operation, including prompts, alerts, file selection, camera capture, and interactive WebViews, whether or not authentication is involved.

Continue supported work that does not require interaction. The host rejects unavailable UI with `UserInteractionError`; propagate that signal. A duplicate check solely to reproduce the host's rejection is not required. Do not substitute a guessed answer or return partial data as success. In the foreground, request input when it is needed; absent input follows [required-input validation](#execution-environment-and-api-references).

The purpose of a proactive `new UserInteractionError()` is to prevent earlier steps from initiating user interaction on the server or a third party. Background execution assumes the user is unavailable to notice or complete either the application's or the third party's interaction. Once a known flow would initiate it, throw before the first initiating request or action, even if the plugin's own UI comes later. Challenge-specific timing belongs to [authentication](authentication.md). An uncertain protocol state is not proof that interaction is required: validate it or propagate the underlying failure under [errors](errors.md).

Verify that background runs complete without interaction when supported. Otherwise, verify that `UserInteractionError` propagates without opening UI and that no request or action initiating external interaction occurs. Verify the same foreground path reaches the interaction and handles its result.

## Diagnostics and errors

Plugin-authored diagnostics are English; user-facing text and `ZenMoney.locale` follow the [language policy](../project/style.md#language-and-audience). A failed runtime `console.assert` throws an ordinary `Error`; it does not merely print a warning. See [errors](errors.md) and [production logs](../debugging/production-logs.md).

## Capabilities and compatibility

Check the specific capability used by an existing shared helper. For example, the network helper checks `ZenMoney.features.binaryResponseBody` before binary requests. Do not infer feature support solely from OS or application version, or invent a new feature-flag name without a host contract.

Use `IncompatibleVersionError` only for a confirmed required capability/version mismatch. Unsupported protocol behavior is an ordinary reportable failure, not a platform version error. Verify host-dependent behavior in the application using Bootloader; browser mocks cannot validate native certificate handling, UI availability, or device-bound authentication.
