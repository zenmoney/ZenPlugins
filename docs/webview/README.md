# WebView

Use Playwright [Page](https://playwright.dev/docs/api/class-page) and [JSHandle](https://playwright.dev/docs/api/class-jshandle) as references for navigation and page JavaScript. The supported API is defined by [WebView](../../src/common/webView.ts). The differences and plugin-specific behavior are below. Page-level overrides are covered by the [permissions contract](permissions.md).

## Session and page behavior

- Sessions start hidden; only one can be visible per plugin execution. Close owned sessions in `finally`, since a live WebView can keep execution pending. `close` also covers renderer failure and presentation dismissal. Subscriptions use the shared [event semantics](../plugins/runtime.md#event-emitters).
- Showing a session and opening an external application follow the [background interaction rules](../plugins/runtime.md#background-execution-and-ui). Hidden page work does not require presentation.
- Loading timeouts default to 30 seconds. `setContent` uses `about:blank` unless given an absolute HTTP(S) `baseURL`.
- Value copying supports object graphs, dates and byte arrays; unsupported values reject. `JSHandle.getProperties` includes own enumerable data properties and skips accessors.
- `addInitScript` snapshots its argument and does not accept handles. Disposing a script registration stops future runs without undoing prior effects. `exposeFunction` registrations can also be disposed.
- Cookies are separate from the HTTP `cookieJar`; synchronize them explicitly. The jar works with `makeFetchCookie(fetch, webView.cookieJar)`. Concurrent WebViews may share cookies, so do not assume session isolation.

TLS uses the shared [certificate defaults](../plugins/utilities.md#tls-defaults) for trusted CA. WebView does not support client certificates.

## Page scripts

Use the [script string import helper](../project/bundles.md) for browser code that will execute in a WebView:

```ts
import script from './page.ts?format=iife&globalName=WebViewScript&bundle'
```

Files named `*.webview.ts` or `*.webview.js` are optional naming conventions. The consuming code executes the generated source in the WebView realm using a loading mechanism appropriate to its format. Page code and its dependencies must use browser APIs and must not rely on plugin closures or plugin-only globals.

WebView-only page modules may use JavaScript or TypeScript; choose JavaScript when page-local types add little value. Both retain syntax highlighting and linting; TypeScript retains type checking.

## Navigation policy

`navigationPolicy` has a separate 30-second deadline. Blocking or externally opening an explicit `goto` rejects it. Policy errors reject the associated loading operation or are logged when no such operation exists.

App/deep links reach the policy as external redirects; LOAD resumes loading in that session. Only one external navigation may be pending per plugin execution.

While a policy is pending, presentation, navigation, cookie writes and closing are rejected, including on other WebViews in the same execution. Return the decision before starting these operations.

## Request logging

Navigation is logged automatically, including with a plain policy callback or `null`. `createNavigationPolicy` attaches base logging options. Logs contain navigation requests and their source, without response bodies or HTTP status; shared [header handling](../plugins/utilities.md#network-headers) and [logging controls](../debugging/production-logs.md#what-is-and-is-not-captured) apply.

Per-`goto` options override the policy defaults until that call settles. Nested masks merge; explicit values replace their counterparts, while `undefined` inherits. Overlapping calls use only the latest call's overrides; each new call starts from policy defaults. Overrides are isolated per WebView, including when a policy is shared.
