# Errors and application behavior

Applies to failure handling in all plugin types; entity omission rules apply to scrape. The [`ZPAPIError` hierarchy](../../src/errors.js) controls application UI and the **Send log** action. Diagnostic context follows [sanitization](../debugging/log-sanitization.md).

## Default: ordinary `Error`

Unexpected responses, malformed/missing fields, network/HTTP failures, pagination limits, converter defects, and other unclassified failures MUST remain ordinary errors. This also applies during unfinished API migrations. The application shows a generic error and allows log submission; technical details stay in the log.

Validate required payloads, protocol states, and converter invariants with `console.assert(condition, message, sanitizedContext)`. In the plugin runtime it throws an ordinary `Error`. Select useful safe context rather than passing a potentially sensitive whole response.

Preserve underlying error objects with `throw error` where practical. Internal control-flow classes such as `SessionExpiredError` may extend `Error`, never `ZPAPIError`. The entrypoint must neither wrap these errors in UI errors nor assert that every failure is a `ZPAPIError`.

Any unclassified failure MUST stop the whole synchronization, including failures of one account, card, history source, or page. Never return successful partial data. The only permitted omissions are [user skips](scrape/contract.md#skipped-accounts) and the terminal-entity exception below.

## `ZPAPIError` subclasses

Use only existing subclasses for their documented UI semantics; never instantiate `ZPAPIError` directly or define plugin-specific subclasses. Credential/OTP rejection requires a stable bank code/state or an exact previously investigated response; incidental words or generic HTTP status codes do not establish it.

| Class | Required meaning |
| --- | --- |
| `InvalidPreferencesError` | Malformed/unsupported settings the user must correct; redirects to preferences and suppresses log submission |
| `InvalidLoginOrPasswordError` | Confirmed login/password/PIN rejection; generic 400/401 is insufficient |
| `InvalidOtpCodeError` | Entered OTP is incorrect or expired; expiry requires requesting/entering a new code. Delivery failure, missing confirmation state, or text containing `OTP` is insufficient |
| `TemporaryError` | Stable, recognized condition with a precise reason it will clear itself or a concrete action the user can take; explain the action/retry timing where relevant |
| `BankMessageError` | Verbatim human-facing bank instruction or confirmed global terminal message, under the rules below |
| `UserInteractionError` | Background control signal, without a custom message; follow [runtime](runtime.md#background-execution-and-ui) and [authentication](authentication.md) for proactive guards |

Known maintenance/throttling may qualify as temporary; unknown network/5xx errors, changed payloads, or unrecognized auth states do not. An unimplemented video/liveness check, captcha, or auth strategy remains a reportable assertion failure. Repeated observation does not turn a plugin limitation into a temporary outage or terminal bank condition. Absent prompt input follows [runtime input validation](runtime.md#execution-environment-and-api-references).

### Bank messages and terminal scope

`BankMessageError` identifies text as authored by the bank. Use it only for a bank-required action needed to synchronize, or a previously investigated terminal condition leaving no supported continuation. Prefer the most specific existing error class when the plugin interprets a known code/state.

Select text by its observed human-facing purpose, not a field name such as `message`. Never construct, translate, summarize, or alter it. It must already be safe to display and log under [sanitization](../debugging/log-sanitization.md): no secrets, unmasked personal data, technical reasons, traces, challenge IDs, or raw bodies. If unsafe, choose another applicable class from a stable code/state or retain an ordinary error with sanitized context; do not sanitize text and call it verbatim.

Terminal behavior requires prior analysis of real logs and an exact stable code/state or known response:

| Proven scope | Outcome |
| --- | --- |
| Nothing can be done for one entity; other entities and their data remain unaffected and at least one is fully syncable | Omit only that entity and log sanitized English context |
| Whole customer profile is blocked, or known entity conditions collectively leave nothing syncable | `BankMessageError` with safe human-facing bank text; otherwise ordinary error |
| Newly observed, unknown, network, or ordinary loading failure | Stop the whole synchronization under the default rule |

The global terminal exception permits `BankMessageError` even without a recovery action. It never permits broad per-entity catches or hiding an unsupported plugin flow.

## Verification

Assert classes, not just messages: ordinary failures must be `Error` but not `ZPAPIError`; deliberate UI failures use the intended subclass. Verify original transport/HTTP/runtime errors reach the exported operation unchanged where practical, while invalid received states fail the corresponding sanitized assertion.

Cover each implemented classification with its confirmed positive case and observed nearby counterexamples:

- Credential rejection versus other failures; incorrect/expired OTP versus delivery/protocol failure or an unknown strategy mentioning SMS/OTP.
- Every temporary branch's self-resolution or user action.
- Verbatim human-facing bank text versus technical/unsafe text; real fixtures for terminal scope, both one entity and nothing syncable.
- Unknown per-entity and network/loading failures; every deliberately swallowed server condition versus an unexpected one that must propagate.
- Unsupported flows, assertions, and required absent input as ordinary errors; optional input's supported continuation.

Evidence rules and missing samples follow [testing](../project/testing.md#bank-data-and-model-tests). Authorization-specific coverage is in [authentication](authentication.md#verification); scrape completeness and skips are in the [scrape contract](scrape/contract.md).
