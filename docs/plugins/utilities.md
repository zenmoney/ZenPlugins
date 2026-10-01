# Shared utilities

Reference index. Read only the helper involved in your task; behavior and available options are defined by its implementation and declarations.

| Need | Source |
| --- | --- |
| HTTP, JSON, WebView interception | [network declarations](../../src/common/network.d.ts), [implementation](../../src/common/network.js) |
| WebSocket | [protocol helper](../../src/common/protocols/webSocket.js) |
| Request/response masking | [sanitize](../../src/common/sanitize.js), [required masking policy](../debugging/log-sanitization.md) |
| Cookies | [cookie jar](../../src/common/cookie/jar.js), [fetch with cookies](../../src/common/cookie/fetchCookie.js) |
| Retry | [retry](../../src/common/retry.js); use only for understood retryable states |
| Safe property access from unknown | [get.ts](../../src/types/get.ts) |
| Date ranges | [dateUtils](../../src/common/dateUtils.js), [momentDateUtils](../../src/common/momentDateUtils.js) |
| Time zones | [momentTimezoneDateUtils](../../src/common/momentTimezoneDateUtils.js) |
| Transaction grouping | [adjustTransactions](../../src/common/transactionGroupHandler.js), [transfer rules](scrape/quality/transfers.md) |
| PDF input | [pdfUtils](../../src/common/pdfUtils.js) |
| Debug checkpoints | [Debug](../../src/common/debug/index.js), [Bootloader](../debugging/bootloader.md#plugin-debug-api) |
| Prompts and storage | [Runtime](runtime.md), [ZenMoney declarations](../../src/types/index.d.ts) |

Helpers related to accounts and transactions apply to scrape plugins; sharing a runtime does not make those domain concepts mandatory for other plugin types.
