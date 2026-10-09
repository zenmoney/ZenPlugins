# Authentication and background interaction

Read when implementing or changing authentication for a service-backed plugin. These rules apply wherever the service uses persisted authorization and interactive login, regardless of the exported operation. Host facilities are in [runtime](runtime.md); classes and masking are in [errors](errors.md) and [sanitization](../debugging/log-sanitization.md).

- **Hot authentication (`hotAuth`)** covers all non-interactive flows using artifacts from previous successful cold authentication: tokens, cookies, registered-device keys, or other persisted bank state. Refresh is part of `hotAuth`, not a peer fallback stage. Sequence only mechanisms used by the current bank application
- **Cold authentication (`coldAuth`)** starts a new login or device-registration flow from user credentials and may initiate OTP, confirmation calls, card verification, or other user interaction
- With compatible persisted state, try `hotAuth` first. Fall back to `coldAuth` only when a stable bank code/state or deterministic local validation proves the complete supported hot flow unusable: confirmed expiry/revocation, missing required artifacts, or incompatible/unmigratable state. Always take that fallback when confirmed
- Changing login/password preferences alone MUST NOT invalidate working persisted authorization or force `coldAuth`. Continue `hotAuth` with the saved session until the supported hot flow is confirmed unusable; when `coldAuth` is needed, use the current preferences, including the newly entered credentials. To synchronize a different bank customer, create a new connection rather than changing the login of an active connection
- Never use a broad `catch` around `hotAuth` for fallback. Timeouts, network/generic HTTP errors, malformed/unknown responses, and other unclassified failures propagate unchanged under [errors](errors.md), preserving the latest confirmed state without starting `coldAuth`
- Log a deliberately sanitized English summary when a confirmed hot-auth rejection causes a cold-auth fallback
- Persist each confirmed auth update immediately: initial authorization, token rotation, device state, and auth cookies. Do not wait for account/history loading, conversion, or workflow completion. Later failures propagate without undoing the latest valid update; unvalidated/unusable candidates must not replace it
- Follow the shared [background/UI contract](runtime.md#background-execution-and-ui). In the background, throw `new UserInteractionError()` before the first request known to make the bank initiate user interaction, such as sending an OTP, push approval, or confirmation call. This may happen before the plugin reaches its own prompt: waiting for the host to reject that prompt is too late to prevent the bank's interaction. The same foreground state executes the full flow and requests input when needed

## Verification

- Test that a background run throws `UserInteractionError` before the first request that would initiate the bank's user interaction, and assert that this request was not sent; a failing UI mock alone does not prove this. Test that the same foreground state sends the request and continues through the interaction flow
- Test hot success including refresh, confirmed cold fallback, unchanged propagation of transient/malformed/unknown failures, and missing/legacy/incompatible state
- Test preference changes with a working hot session and after confirmed rejection: session preserved in the former, current credentials used for cold auth in the latter
- Test entrypoint persistence before further work: refresh then history/conversion failure, a later auth update then failure, and hot failure without any update. Assert the latest confirmed state survives and the original failure propagates

Physical persistence belongs to the entrypoint; transition decisions belong to `api`. See [architecture](architecture.md).
