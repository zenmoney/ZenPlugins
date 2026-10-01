# Creating a plugin

Use the [creation route](../README.md#choose-a-task) for required reading. For scrape, begin the [quality assessment](../plugins/scrape/quality/README.md#required-use) before choosing source fields/endpoints.

## Define the supported behavior

Choose the exported operation contract first. For account/history synchronization use [scrape](../plugins/scrape/contract.md), including its [file-import variant](../plugins/scrape/file-import.md) for user-selected statements. Define the supported products, currencies, account relationships, history limits, operation classes, and interactive/background behavior. Do not assume every integration has a login: public ledgers, authorized APIs, and user-selected statements have different data sources.

Choose the submission destination and [base branch](../project/workflow.md#branches-and-submission) before creating a branch or copying fixtures.

Identify missing evidence before implementation: initial and repeated authorization, no-account/empty-history cases, multiple accounts/cards, pagination, transfers, fees, foreign currency, and statuses. Record known scope limits explicitly. A successful initial request is not evidence that the whole plugin flow is implemented.

For scrape, derive expected output and tests with the [quality procedure](../plugins/scrape/quality/README.md#development-and-review-procedure).

## Obtain protocol evidence

Use an official API where suitable; otherwise examine the current service application/web client and authorized traffic. For statement imports, collect representative formats/languages and the user's selection workflow. Follow [protocol research](protocol-research.md).

Document endpoint and field meanings from observed behavior, including failure states. Keep authentication material and raw captures local. Before publishing fixtures or examples, follow [public-data rules](../project/fixtures.md).

## Implement the integration

1. Create a TypeScript plugin directory named for the bank/service and country where relevant, for example `service-cc`. For scrape, use the [example plugin](../../src/plugins/example) as a packaging/sample-data reference, while following the canonical architecture rather than copying known legacy shortcuts.
2. Configure registration and settings according to the selected type's contract. For scrape, use the [XML manifest](../plugins/scrape/manifest.md) and [preferences.xml](../plugins/scrape/preferences.md). A new type must define its own manifest/settings formats and loader support. Set one consistent user-facing language and `ZenMoney.locale`.
3. Implement acquisition, workflows, conversion, and entrypoint assembly under [architecture](../plugins/architecture.md), or the [file-import boundaries](../plugins/scrape/file-import.md#module-boundaries). Include applicable [authentication](../plugins/authentication.md), [UI](../plugins/runtime.md#background-execution-and-ui), [errors](../plugins/errors.md), and [network sanitization](../debugging/log-sanitization.md).
4. For scrape with account-dependent history, implement [account sync plans](../plugins/scrape/account-sync-plans.md); file importers convert selected statements without `fetchParams`.
5. Implement the planned [full-result tests](../project/testing.md#verification-for-code-changes), including completeness and observed failure cases.

The sample has [known legacy limitations](../plugins/compatibility.md); it does not replace these contracts.

## Verify and submit

Complete [code verification](../project/testing.md#verification-for-code-changes), type-check and build the new plugin, and reproduce host-dependent behavior through [Bootloader](../debugging/bootloader.md). Follow [completion criteria](../project/workflow.md#completion-criteria) for submission and general rule changes.
