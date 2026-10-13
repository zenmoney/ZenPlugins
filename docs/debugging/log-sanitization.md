# Log sanitization

Read whenever a request, response, assertion, or diagnostic log changes. Applies to all plugin types. See [production logs](production-logs.md) for the logging path and [errors](../plugins/errors.md) for user-visible text.

Sanitization must protect real secrets and personal identity data while preserving enough payload structure to diagnose API changes. Mask fields selectively; a log containing only `<object>` or a fully masked `data` array is usually not actionable.

Runtime log masks do not define fixture cleanup; copying source data follows the separate [fixture rules](../project/fixtures.md).

## Always redact

- Login phone/email where it identifies the customer; passwords, PINs, OTPs, CVV, full PAN, and answers to authentication questions
- Access, refresh, ID, bearer, and session tokens; authorization cookies; private keys; reusable signatures; encrypted credential/PIN/card payloads
- A `sid`, hash, nonce, or similar value when it can authenticate/authorize a request or derive credential material, even if it is short-lived. Apply the same mask in request and response URLs, headers, and bodies
- The customer's/cardholder's full name, passport/identity-document data, avatar/photo, personal phone, and registration/residential home address
- `Authorization`, `Cookie`, and `Set-Cookie` headers and equivalent token-bearing fields, including camelCase/snake_case variants used by the provider

## Keep visible unless proven sensitive

- Request/correlation IDs, challenge IDs, operation IDs, confirmation IDs, trace/error codes, pagination cursors, transaction IDs, `hashPan`, and one-time technical `sid` values that cannot authorize a request
- Source payload fields needed by converters, such as products, accounts, balances, transactions, items and amounts; masked card/account identifiers; merchant names, terminal addresses, MCC, purposes, statuses, and dates
- Generated non-auth device/request identifiers and protocol metadata when they are needed to compare the plugin with the current bank application
- Bank error codes and technical messages after required secret/personal-data masking. They belong in the log; [error classification rules](../plugins/errors.md) prevent them from being displayed to the user

## Implementation rules

- Prefer field-level masks for nested objects and arrays. Do not mask an entire `data`, `client_data`, accounts, cards, or transactions response when only a few nested fields are sensitive
- Whole-body masking is acceptable only when the body itself is a credential/secret payload or selective masking cannot make it safe
- A custom endpoint mask must retain the common auth/token mask. Do not replace a default response mask in a way that exposes tokens in response URLs or headers
- Sanitize both request and response logs. Remember that the logged response URL may contain the original request query
- Distinguish authorization state from diagnostic identifiers by how the value is used, not by its field name. A session `sid` used with an access token is sensitive; an operation-local one-time `sid` may remain visible
- Never hide values merely because they look technical. Over-sanitizing replay timestamps, request references, operation IDs, hashes with no authorization value, or complete bank payloads prevents diagnosis

## Required sanitization tests

Capture actual emitted diagnostics for the changed logging path:

| Logging path | Output to verify |
| --- | --- |
| HTTP helpers | `console.debug('request', ...)` and `console.debug('response', ...)` |
| WebView navigation | Navigation request logs |
| WebSocket | Handshake logs and request/reply logs when using the request client |
| Raw TCP, assertions, or manual diagnostics | The messages and context emitted by the changed code |

Assert that sensitive fields present in the case are masked and representative diagnostic fields remain visible, including relevant IDs, provider errors and converter source data. Cover the affected URLs, headers, bodies, nested objects and arrays that this logging path emits. Inspect the output itself; checking only options passed to a helper such as `fetchJson` is insufficient.
