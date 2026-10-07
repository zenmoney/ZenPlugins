# Shared plugin runtime

Read when using platform facilities or changing an entrypoint, persistence, or interaction. This environment is shared by all plugin types. Exported functions and their argument/result contracts are documented per type: [scrape](scrape/contract.md) and [receipts](receipt-fetchers/contract.md).

## Execution environment and API references

Plugins execute inside the Zenmoney application. Do not depend on Node filesystem/process facilities or browser DOM APIs in plugin code.

The [ZenMoney declarations](../../src/types/index.d.ts) define the global API; the [shared helper index](utilities.md) locates the network APIs.

| Facility | API / source | Usage |
| --- | --- | --- |
| Plugin state | `getData`, `setData`, `saveData`, `clearData` | Connection-scoped persistent plugin data |
| User input | [`ui.readLine`, `ui.alert`](../../src/common/ui.ts) | Asynchronous prompts and alerts |
| Files and camera | [`ui.pickDocuments`, `ui.takePicture`](../../src/common/ui.ts) | User-selected input |
| Cookies | [`cookieJar`, `saveCookies`, `restoreCookies`](../../src/common/network/index.ts) | Shared HTTP cookies and explicit persistence |
| TLS | [Shared TLS options and `addTrustedCertificates`](../../src/common/network/tls.ts) | Required service-specific certificate configuration |
| Environment | `device`, `application`, `locale` | Device/app metadata and plugin language |
| Diagnostics | `console.*`, `ZenMoney.trace`, `logEvent` | Logs and explicitly supported events |
| Networking and WebView | [Shared helper index](utilities.md) | HTTP, TCP, WebSocket and WebView; [sanitization](../debugging/log-sanitization.md) applies |
| Account selection | `isAccountSkipped(id)` | Facility used by the [scrape contract](scrape/contract.md#skipped-accounts) |

Import `ui` from `src/common/ui` for prompts, alerts, file selection and camera capture.

`ui.readLine` and `ui.takePicture` may return `null`. Handle this before using the result; if the input is required, stop with an [error appropriate to the operation](errors.md). For `readLine`, `null` does not distinguish cancellation from timeout.

## State and lifecycle

`getData(name, defaultValue)` reads the stored value or the supplied default. Its result is `unknown`; validate persisted state just as carefully as network input. `setData` changes a key and `saveData` requests persistence. Do not rely on a `setData` call alone surviving the invocation. `clearData` clears plugin state and MUST NOT be used as a generic recovery for a network failure.

Plugin state is saved when a scrape or receipt operation finishes, on both success and failure. Saving state does not turn a failed operation into a success. This final save does not replace immediate [authentication checkpoints](authentication.md). Cookie persistence remains explicit.

Store only data necessary for later invocations. Keep transient handles and live sessions separate. Version state when a migration needs it. The timing and validity of auth persistence are defined once in [authentication](authentication.md).

Cookie persistence follows the same [entrypoint boundary](architecture.md#boundaries); cookie transport belongs to `fetchApi`. Never expose stored state or credentials in ordinary diagnostics.

The exported `cookieJar` shares HTTP cookies with `fetch`. Jar changes affect requests immediately; await `saveCookies()` to persist them. `restoreCookies()` replaces working cookies with the saved set. Invalid saved data fails before replacing working cookies.

The [browser state implementation](../../src/ZPAPI.pluginData.js) tracks whether persistence was requested. [Bootloader state overrides](../debugging/bootloader.md#plugin-data) are development controls, not production persistence guarantees.

Receipt-specific completion and fast code preview follow the [receipt operation contract](receipt-fetchers/contract.md#loader-lifecycle).

## Background execution and UI

`ui.visibilityState` reports whether the application UI is `visible` or `hidden`. The `visibilitychange` event fires only when that value changes; changes in application activity while it remains visible do not trigger listeners, including `once`. Subscriptions follow the shared [event semantics](#event-emitters).

`ui.theme` returns the current application theme (`light` or `dark`). Accessing an unavailable UI capability throws `IncompatibleVersionError`.

`isInBackground: true` means that the plugin is running without access to user interaction. For scrape and [receipt retrieval](receipt-fetchers/contract.md#operations), it is an entrypoint argument. Other types must define how they receive the same execution context. The restriction applies to every UI operation, including prompts, alerts, file selection, camera capture, and interactive WebViews, whether or not authentication is involved.

Continue supported work that does not require interaction. The host rejects unavailable UI with `UserInteractionError`; propagate that signal. A duplicate check solely to reproduce the host's rejection is not required. Do not substitute a guessed answer or return partial data as success. In the foreground, request input when it is needed; absent input follows [required-input validation](#execution-environment-and-api-references).

The purpose of a proactive `new UserInteractionError()` is to prevent earlier steps from initiating user interaction on the server or a third party. Background execution assumes the user is unavailable to notice or complete either the application's or the third party's interaction. Once a known flow would initiate it, throw before the first initiating request or action, even if the plugin's own UI comes later. Challenge-specific timing belongs to [authentication](authentication.md). An uncertain protocol state is not proof that interaction is required: validate it or propagate the underlying failure under [errors](errors.md).

Verify that background runs complete without interaction when supported. Otherwise, verify that `UserInteractionError` propagates without opening UI and assert that no request or action initiating external interaction occurs; a failing UI mock alone does not prove this. Verify the same foreground path reaches the interaction and handles its result.

## Diagnostics and errors

Plugin-authored diagnostics are English; user-facing text and `ZenMoney.locale` follow the [language policy](../project/style.md#language-and-audience). A failed runtime `console.assert` throws an ordinary `Error`; it does not merely print a warning. See [errors](errors.md) and [production logs](../debugging/production-logs.md).

The runtime handles error presentation. Plugins propagate errors according to the shared error policy.

## Event emitters

The shared event API uses a subset of [Node.js EventEmitter](https://nodejs.org/api/events.html#class-eventemitter), defined by the [shared interface](../../src/common/events.ts). The behavioral differences are listener `this` binding to `globalThis` and an unhandled `error` event not throwing automatically. Handle errors explicitly in the owning operation.
