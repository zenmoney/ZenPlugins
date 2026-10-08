# Shared utilities

Reference index. Read only the helper involved in your task; behavior and available options are defined by its implementation and declarations.

| Need | Source |
| --- | --- |
| HTTP, JSON, WebView interception | [typed network helpers](../../src/common/network/index.ts) |
| TLS configuration | `addTrustedCertificates`, shared `TlsOptions` and defaults in [network/tls.ts](../../src/common/network/tls.ts) |
| WebSocket | [protocol helper](../../src/common/protocols/webSocket.js) |
| TCP transport | [Socket contract](socket.md), [constructor and types](../../src/common/network/socket.ts) |
| Request/response masking | [sanitize](../../src/common/sanitize.js), [required masking policy](../debugging/log-sanitization.md) |
| Cookies | Global `cookieJar` and persistence functions in [network](../../src/common/network/index.ts); [fetch with a separate jar](../../src/common/cookie/fetchCookie.js) |
| Retry | [retry](../../src/common/retry.js); use only for understood retryable states |
| Safe property access from unknown | [get.ts](../../src/types/get.ts) |
| Date ranges | [dateUtils](../../src/common/dateUtils.js), [momentDateUtils](../../src/common/momentDateUtils.js) |
| Time zones | [momentTimezoneDateUtils](../../src/common/momentTimezoneDateUtils.js) |
| Transaction grouping | [adjustTransactions](../../src/common/transactionGroupHandler.js), [transfer rules](scrape/quality/transfers.md) |
| PDF input | [pdfUtils](../../src/common/pdfUtils.js) |
| Debug checkpoints | [Debug](../../src/common/debug/index.js), [Bootloader](../debugging/bootloader.md#plugin-debug-api) |
| Prompts and storage | [Runtime](runtime.md), [ZenMoney declarations](../../src/types/index.d.ts) |

Helpers related to accounts and transactions apply to scrape plugins; sharing a runtime does not make those domain concepts mandatory for other plugin types.

## Network headers

HTTP responses use [NetworkHeaders](../../src/common/network/logging.ts). Their header names are lowercase; accessor methods are non-enumerable, and name lookup ignores case. Normalization applies even with logging disabled and never masks caller-visible values.

`fetch` forwards request headers unchanged. `fetchJson` combines its JSON defaults with the supplied headers using object spread: exact-key overrides replace defaults, while differently cased keys remain distinct. To disable its JSON transformations, explicitly pass `parse: undefined` or `stringify: undefined`.

Intercepted requests receive the original headers. Request logs preserve names and values apart from explicit masks. When applying an object mask to a `Headers` collection, repeated values with the same name are joined with `, ` before masking, as in response normalization; pair arrays keep their separate entries. Header names in object masks ignore case; function masks receive the original request headers. Logging controls and masking defaults are defined in [production logs](../debugging/production-logs.md#what-is-and-is-not-captured).
