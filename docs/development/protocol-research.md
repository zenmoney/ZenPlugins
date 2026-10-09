# Researching a service protocol

Read when implementing a new integration, migrating an API, or investigating changed authorization/data formats. The deliverable is evidence for the requests, state transitions, field meanings, and supported scenarios needed by the plugin.

## Choose evidence sources

| Source | Useful for | Limits |
| --- | --- | --- |
| Official API documentation and sample responses | Supported endpoints, authentication, pagination, field semantics | Confirm that the API exposes the user's actual products/history |
| Current official mobile APK | Endpoint strings, models, serializers, auth transitions, signing/encryption calls | Decompiled code may be incomplete; code presence does not prove a path is active |
| Current web client and browser traffic | Web login, cookies, requests, response relationships | Web and mobile endpoints/auth can differ |
| Authorized traffic dump/HAR from a known scenario | Actual request order, fields, headers, errors and pagination | One successful capture does not describe all states |
| User-selected statements | File schema, dates, balances, transaction interpretation | Export language/version and available fields can vary |
| Existing plugin | Prior hypotheses and reusable mechanisms | It may describe an obsolete protocol or contain the defect being investigated |

Obtain the application from its official distribution or an authorized installed copy. Record package/application version, platform, capture date, artifact hash where available, and scenario. Keep APKs, raw HARs, decrypted bodies, and device/session state under ignored local storage such as `.local/research/<plugin-id>/`; publish selected sanitized evidence instead of full captures.

## Static inspection

[Android APK Analyzer](https://developer.android.com/studio/debug/apk-analyzer) can inspect package contents and manifests. [JADX](https://github.com/skylot/jadx) provides APK/Dex decompilation and code navigation, with possible decompilation gaps.

Start from observed endpoint paths, request field names, error codes, or model names. Trace their callers to determine which UI/auth state selects that path. Follow serialization and transport construction to identify required headers, body encoding, device metadata, and validation. If a value is signed/encrypted, determine the input bytes, encoding, key provenance, nonce/time behavior, and output format rather than copying a captured output as a constant.

Separate confirmed observations from hypotheses. Unused endpoints, old API versions, fallback classes, and misleading field names must be verified against current traffic before becoming implementation requirements.

## Dynamic observation

Capture the current application's behavior for an account/device you are authorized to use. Browser DevTools or an HTTP inspection proxy such as [mitmproxy](https://docs.mitmproxy.org/stable/overview/features/) can help inspect traffic when the test environment permits it. Certificate pinning, device attestation, and non-HTTP protocols may limit ordinary proxy visibility; establish the observation method rather than interpreting absent traffic as absent behavior.

Record the user action, initial state, ordered requests/responses, and resulting persistent state. Keep enough correlation data to connect requests while applying the [log masking policy](../debugging/log-sanitization.md) to shared examples. Never treat a replay with copied live tokens as an implemented authentication flow.

Compare successful and rejected cases: correct/incorrect credentials and OTP, expired authorization, transport failure, no products, no history, several pages, and unusual operations. Do not classify a generic HTTP status by guessing its user meaning.

## Trusted devices and applications

Treat trusted-device registration as a protocol lifecycle. Determine which artifacts are created by login, which confirmation makes the device trusted, which keys/tokens bind later requests, where the official app persists them, and what revokes them. Distinguish device ID, registration ID, session ID, and secret signing material by their use, not their names.

Observe cold registration, successful hot login/refresh, a confirmed expired or revoked state, and recovery. A captured trusted session may explain the hot path while omitting the cold path entirely. Follow [authentication](../plugins/authentication.md): transient/unknown hot failures preserve state; confirmed unusable authorization triggers cold recovery. Background runs stop before the first request known to initiate the bank's interaction with the user.

When protected device keys or a required host capability cannot be reproduced through the supported runtime, record that constraint and investigate a supported alternative such as an official API, WebView flow, or statement import. Do not disguise an unimplemented authorization state as a temporary outage or successful empty result.

## Research record and handoff to code

Keep the relevant findings in existing integration notes, test provenance, or the MR; general procedures remain here. Record:

- Application/version/date and source of each claim.
- Auth state transitions and artifact lifecycle.
- Endpoint method, serialization, headers, pagination, interval boundaries, and termination conditions.
- Account/card relationships and which sources contain overlapping or unique history.
- Operation classes with confirmed signs, currencies, fees, statuses, merchants, comments, and transfer links.
- Known error states and nearby unknown states that must remain reportable.
- Open questions and samples still missing.

Turn confirmed observations into typed validation boundaries and focused tests. A local bank heuristic becomes a shared rule only after its broader applicability is established under [documentation maintenance](../project/documentation.md).
