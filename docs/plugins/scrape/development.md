# Developing a scrape plugin

Use for a new scrape plugin or substantial API migration. Begin the [quality assessment](quality/README.md#required-use) before choosing source fields/endpoints, and follow [code-change policies](../../project/README.md#code-changes).

## Define the supported behavior

Read the [scrape contract](contract.md), including the [file-import variant](file-import.md) for user-selected statements. Define supported products, currencies, account relationships, history limits, operation classes, and interactive/background behavior. Do not assume every integration has a login: public ledgers, authorized APIs, and selected statements have different data sources.

Choose the submission destination and [base branch](../../project/workflow.md#branches-and-submission) before creating a branch or copying fixtures.

Identify missing evidence before implementation: initial and repeated authorization, no-account/empty-history cases, multiple accounts/cards, pagination, transfers, fees, foreign currency, and statuses. Record known scope limits explicitly. A successful initial request is not evidence that the whole plugin flow is implemented.

Derive expected output and tests with the [quality procedure](quality/README.md#development-and-review-procedure).

## Obtain protocol evidence

Use an official API where suitable; otherwise examine the current service application/web client and authorized traffic. For statement imports, collect representative formats/languages and the user's selection workflow. Follow [protocol research](../protocol-research.md).

Document endpoint and field meanings from observed behavior, including failure states. Keep authentication material and raw captures local. Before publishing fixtures or examples, follow [public-data rules](../../project/fixtures.md).

## Implement the integration

1. Choose a [globally unique plugin name](../README.md#plugin-names) and create `src/plugins/<plugin-id>/` in TypeScript, named for the bank/service and country where relevant, for example `service-cc`. Use the [example plugin](../../../src/plugins/example) for packaging/sample data, while following the canonical architecture rather than copying known legacy shortcuts.
2. Configure the [XML manifest](manifest.md) and [preferences.xml](preferences.md). Set one consistent user-facing language and `ZenMoney.locale` under the [language policy](../../project/style.md#language-and-audience).
3. Implement acquisition, workflows, conversion, and entrypoint assembly under [architecture](../architecture.md) and [runtime](../runtime.md), or the [file-import boundaries](file-import.md#module-boundaries). Include applicable [authentication](../authentication.md), [errors](../errors.md), and [network sanitization](../../debugging/log-sanitization.md).
4. For account-dependent history, implement [account sync plans](account-sync-plans.md); file importers convert selected statements without `fetchParams`.
5. Implement the planned [full-result tests](testing.md#required-coverage), including completeness and observed failure cases.

The sample has [known legacy limitations](../compatibility.md); it does not replace these contracts.

## Verify and submit

Complete [code verification](../../project/testing.md#verification-for-code-changes), type-check and run `yarn build <PLUGIN_ID>`, and reproduce supported host-dependent behavior through [Bootloader](../../debugging/bootloader.md). Follow [completion criteria](../../project/workflow.md#completion-criteria) for submission and general rule changes.
