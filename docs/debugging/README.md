# Debugging workflow

Use this route for production incidents, data-quality reviews, and local reproduction. Collect evidence before changing behavior.

Use the [task map](../README.md#choose-a-task) for review scope and the [quality assessment](../plugins/scrape/quality/README.md#required-use) for scrape evidence.

## Select the source

| Need | Source |
| --- | --- |
| Understand a reported failure | User message and full [production log](production-logs.md) |
| Find more builds/users or older examples | [Local logs database](local-database.md) |
| Prioritize impact or inspect aggregate outcomes | [Metrics](metrics.md) |
| Reproduce in a browser | `yarn start <plugin>` and browser DevTools |
| Reproduce native UI, state, certificates, or device behavior | [Bootloader](bootloader.md) |
| Understand a changed service protocol | [Protocol research](../development/protocol-research.md) |

## Triage before implementation

1. Define the relevant plugin, builds, users/cohorts, and reported behavior. Collect and read all logs in that relevant set before code edits; do not fix only the first representative failure.
2. Read user comments, then locate the first protocol/fetch/conversion failure, if present, and its request/response context. Record missing-data indicators, not only exceptions.
3. For scrape, apply the [quality procedure](../plugins/scrape/quality/README.md#development-and-review-procedure). Keep quality and operational findings in one backlog, including defects in successful runs.
4. Choose the sample interval by coverage, not a fixed number of days. Start recent, then widen it, including to 3–6 months when needed, to capture rare operation classes and both transfer sides.
5. For scrape plugin or log reviews, include real expenses, income, and internal transfers whenever those classes exist. A dataset containing only purchases cannot validate transfer matching.
6. Reproduce findings and make the smallest fix under [testing](../project/testing.md#verification-for-code-changes), observing its bank/model evidence boundary and [fixture rules](../project/fixtures.md).

Report unavailable logs/classes as evidence gaps under the quality procedure. Metadata can group suspected issues; inspect bodies before concluding they share a cause.

## Local artifacts

The repository convention is `logs/<PLUGIN_ID>.log` or `logs/<PLUGIN_ID>/*.log`. These files are local and ignored. The directory and the local PostgreSQL database are both named `logs`. Bootloader sessions are separate under `.local/bootloader/<plugin>`.

Browser settings/state include `zp_preferences.json`, `zp_data.json`, `zp_cookies.json`, and `zp_pipe.txt` in the plugin directory. Bootloader uses `bootloader_config.json`. They are local artifacts, not fixtures to commit. A raw capture and a sanitized production log provide different evidence; consult [log sanitization](log-sanitization.md) before sharing extracted examples.
