# Logs, metrics and debugging

Shared tools and evidence collection for all plugin types. Domain diagnosis and quality checks belong to the selected type's investigation route. Collect evidence before changing behavior.

## Select the source

| Need | Source |
| --- | --- |
| Understand a reported failure | User message and full [production log](production-logs.md) |
| Change logging or share extracted examples | [Logging behavior](production-logs.md#logging-path), [sanitization](log-sanitization.md) |
| Find more builds/users or older examples | [Local logs database](local-database.md) |
| Prioritize impact or inspect aggregate outcomes | [Metrics](metrics.md) |
| Reproduce a scrape plugin in a browser | `yarn start <plugin>` and browser DevTools |
| Reproduce scrape UI, state, certificates, or device behavior | [Bootloader](bootloader.md) |
| Understand a changed service protocol | [Protocol research](../plugins/protocol-research.md) |

The [browser WebSocket proxy](../../scripts/debugServers/webServer.js) disables upstream certificate verification and does not apply native TLS options. Verify certificate configuration on a device with [Bootloader](bootloader.md).

## Triage before implementation

1. Define the [review scope](../plugins/README.md#review-scope), plugin, builds, users/cohorts and reported behavior. Start with recent log metadata to identify distinct problem groups; do not load every log body into task context.
2. Select complete representative logs for each relevant group/build/cohort and include successful runs for quality assessment. Read user comments and the first protocol/fetch/conversion failure with its request/response context; check missing-data indicators too. Metadata suggests groups, but bodies establish whether they share a cause.
3. Expand the sample or interval when a new failure, protocol variant or missing operation class requires it. Stop when the selected scope has representative evidence, or record the remaining access/sample limits. Exhaustive reading of all reports is not required.
4. Compare source data and output using the selected type's quality checks. Tie evidence to its plugin/build. If output is absent or a cause needs confirmation, reproduce it with the corresponding implementation under the type's [testing requirements](../project/testing.md#verification-for-code-changes) and applicable [fixture scope](../project/fixtures.md). Distinguish logged output, local reproduction and hypotheses.

Use only tools supporting the affected plugin type; the current browser harness and Bootloader target scrape. An offline reproduction does not prove device-dependent behavior.

## Findings and next steps

Report checked builds/cohorts and cases, defects with supporting log/fixture references, and evidence gaps. Keep operational and quality findings together; for a full review, account for every applicable quality topic. Do not count missing examples or untested device behavior as verified. Retain source artifacts under [fixture rules](../project/fixtures.md), not as full payloads in the report.

An analysis/review request ends with findings. Change code only when the task also requests fixes; then use the selected type's testing requirements and [code-change policies](../project/README.md#code-changes).

## Local artifacts

The repository convention is `logs/<PLUGIN_ID>.log` or `logs/<PLUGIN_ID>/*.log`. These files are local and ignored. The directory and the local PostgreSQL database are both named `logs`. Bootloader sessions are separate under `.local/bootloader/<plugin>`.

Browser settings/state include `zp_preferences.json`, `zp_data.json`, `zp_cookies.json`, and `zp_pipe.txt` in the plugin directory. Bootloader uses `bootloader_config.json`. They are local artifacts, not fixtures to commit. A raw capture and a sanitized production log provide different evidence; consult [log sanitization](log-sanitization.md) before sharing extracted examples.
