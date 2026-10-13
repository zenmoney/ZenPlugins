# Receipt fetchers

Receipt plugins retrieve a receipt from a code or provide a local preview. Implementations live in `src/receiptFetchers/`; exact interfaces are in [receiptFetcher.ts](../../../src/types/receiptFetcher.ts).

## Develop a new plugin

Follow the [development guide](development.md): establish provider behavior and quality expectations, research the protocol, implement retrieval/conversion, then verify complete receipts and operation outcomes. Use the same route for a substantial API migration.

## Investigate logs and improve a plugin

1. Establish the [review scope](../README.md#review-scope) and collect evidence through [diagnostic triage](../../debugging/README.md#triage-before-implementation).
2. Compare the observed operation with its [contract](contract.md). Assess conversion through [quality checks](quality.md#required-use); check [errors](../errors.md), [sanitization](../../debugging/log-sanitization.md), and [authentication](../authentication.md) when present, within the selected scope.
3. Select the affected topics below and [shared facilities](../README.md#shared-topics), then report [findings](../../debugging/README.md#findings-and-next-steps). For requested fixes, use [receipt testing](testing.md) and [code-change policies](../../project/README.md#code-changes).

A full plugin review also reads [architecture](../architecture.md) and [runtime](../runtime.md).

## Select the affected topic

| Change | Required reading |
| --- | --- |
| Operation, outcomes or persistence | [Operation contract](contract.md); shared runtime/authentication only for affected state or UI boundaries |
| Provider conversion | [Common values](receipt.md#scope-and-common-values), affected amounts, identity/time or settlement sections, and matching [quality checks](quality.md); the provider's code and tests |
| Registration, identity or code filtering | Affected [manifest and matcher](manifest.md) sections |
| Local build or tests | [Build artifacts](development.md#build-artifacts) or [receipt testing](testing.md), plus the affected manifest/loader contract |

[Model research](research.md) explains the rationale and public sources when those details are needed. Provider-specific behavior and limitations belong beside the implementation or its tests.
