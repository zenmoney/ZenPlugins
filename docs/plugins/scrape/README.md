# Account and transaction synchronization

A scrape plugin returns Zenmoney accounts and transactions from an API, website, public ledger or selected statement. Implementations live in `src/plugins/`; exact interfaces are in [zenmoney.ts](../../../src/types/zenmoney.ts).

## Develop a new plugin

Follow the [development guide](development.md): define supported data and quality expectations, research the protocol, implement the layers, then verify the complete result. Use the same route for a substantial API migration. Begin the [quality assessment](quality/README.md#required-use) before choosing fields or endpoints.

## Investigate logs and improve a plugin

1. Establish the [review scope](../README.md#review-scope) and collect evidence through [diagnostic triage](../../debugging/README.md#triage-before-implementation).
2. Apply the [quality assessment](quality/README.md#required-use), including available successful runs. Check [errors](../errors.md), [sanitization](../../debugging/log-sanitization.md), and [authentication](../authentication.md) when present, within the selected scope.
3. Select the affected contracts below and [shared facilities](../README.md#shared-topics), then report [findings](../../debugging/README.md#findings-and-next-steps). For requested fixes, use [scrape testing](testing.md) and [code-change policies](../../project/README.md#code-changes).

A full plugin review also reads [architecture](../architecture.md), [runtime](../runtime.md) and the [scrape contract](contract.md).

## Select the affected topic

| Change | Required reading |
| --- | --- |
| Entrypoint, interval or result assembly | [Scrape contract](contract.md); [runtime](../runtime.md) and [architecture boundaries](../architecture.md#boundaries) for state/interaction changes |
| Account conversion or history sources | [Account contract](accounts.md), [account quality](quality/accounts.md); [sync plans](account-sync-plans.md) for account-dependent history; [skips](contract.md#skipped-accounts) for account selection |
| Transaction amounts, dates, statuses or IDs | [Transaction contract](transactions.md), [amounts and statuses](quality/amounts-and-statuses.md) |
| Merchant or comment parsing | [Merchant/comment contract](transactions.md#merchant-and-comment), affected [merchant](quality/merchants.md) or [comment](quality/comments.md) rules |
| Transfer classification or grouping | [Transaction contract](transactions.md), [transfers](quality/transfers.md); affected [amount/fee](quality/amounts-and-statuses.md), [merchant](quality/merchants.md) and [comment](quality/comments.md) rules |
| File-based input | [File import](file-import.md), [scrape contract](contract.md), [runtime UI](../runtime.md#background-execution-and-ui), plus the affected output topics above |
| Settings or packaging | Affected [preferences](preferences.md) or [XML manifest](manifest.md) sections |
| Nordigen integration | [Shared-provider rules](nordigen.md), plus the affected topics above |
| Tests or source evidence | [Scrape testing](testing.md) |

[Complete examples](examples.md) illustrate output; existing integration notes and tests describe the affected provider. They are references, not an additional reading list.
