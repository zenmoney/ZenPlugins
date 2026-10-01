# Production logs

Read when investigating requests, responses, failures, or log sanitization. Production logs are application diagnostics; Bootloader network capture is a separate development mechanism.

## Logging path

The shared [network helper](../../src/common/network.js) logs a request with `console.debug('request', ...)` before `global.fetch`. It logs a response or transport failure under the same generated request ID. `fetchJson` adds JSON serialization/parsing and default headers on top of that helper.

[consoleAdapter](../../src/consoleAdapter.js) formats console arguments and forwards supported methods to `ZenMoney.trace(message, methodName)` when installed. A native console can use a host-specific implementation; [polyfills](../../src/polyfills.js) choose the runtime path. A failed `console.assert` throws. Application log collection/submission is outside the network helper; the shared [error policy](../plugins/errors.md) controls whether failures retain the send-log path.

The scrape [adapter](../../src/common/adapters.js) also logs function arguments/results/errors through `traceFunctionCalls`, masking preferences in arguments. Do not assume that masking request payloads automatically masks every returned object or unrelated diagnostic.

| Event | Fields/evidence |
| --- | --- |
| Request | `id`, URL, method, headers, body when supplied |
| Response | Same `id`, elapsed `ms`, response URL, HTTP status, headers, parsed/text/binary body |
| Transport failure | Same `id`, elapsed `ms`, request URL, underlying error |
| Parse failure | Response diagnostics followed by a parse failure; transport success does not imply valid domain data |

Request IDs correlate events within the log/run; they are not bank transaction identifiers. Elapsed `ms` is helper-side request/response-read timing, not server processing time. Do not infer duration from unrelated console formatting.

## What is and is not captured

`log: false` disables this helper's request/response events. Calls directly to `global.fetch`, service-specific sockets, and manually written diagnostics do not automatically inherit this logging/masking path. WebView interception has its own logged request path in the same network module.

`sanitizeRequestLog` and `sanitizeResponseLog` are explicit mask options. The helper passes `false` when a mask is absent; it is not a universal automatic secret detector. A plugin may define a shared endpoint wrapper with defaults, but custom masks must preserve those defaults. Inspect actual emitted logs in tests.

Masking policy and test cases belong to [sanitization](log-sanitization.md); user-visible text follows [errors](../plugins/errors.md).

## Reading a report

Read the user message, plugin/build, invocation interval, auth path, request sequence, pagination, raw bank records, converted result, and final error/result together. Pair requests and responses by helper ID. For missing transfers, find both source records before concluding the converter failed to match them.

Assess source/output quality and report evidence gaps under the [quality procedure](../plugins/scrape/quality/README.md#development-and-review-procedure), including when the reported issue is authorization or another failure.

Logs may contain Russian text in cp1251. Determine the encoding before extracting fixtures; do not silently replace undecodable bytes or normalize significant whitespace. Keep original captures local and produce separate selected fixtures.

The local collection can be queried through [mail_inbound](local-database.md#mail_inbound). For native reproduction and unsanitized fetch capture, see [Bootloader](bootloader.md#network-capture).
