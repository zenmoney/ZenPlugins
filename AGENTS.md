# Repository instructions

Start at [docs](docs/README.md), choose the plugin type or shared area, then follow its task route. Read required sections once and existing notes for the affected integration; do not recursively load reference links or unrelated plugin notes.

- Use Git + SSH by default, including PR/MR work. Before Git or hosting operations, read repository-local `.git/config` and follow the [Git workflow](docs/project/workflow.md#repository-identity) sections selected by the task route. Preserve unrelated work.
- Keep changes focused. A legacy fix does not authorize an architecture or language migration.
- For scrape development, review, and log analysis, start with the [quality assessment](docs/plugins/scrape/quality/README.md#required-use). Assess data correctness alongside authentication, errors, and sanitization; full reviews also assess architecture. Report evidence gaps.
- Unexpected failures must remain visible and reportable. Never return successful partial data after an unknown error.
- Follow [fixture rules](docs/project/fixtures.md) when copying source data and [sanitization](docs/debugging/log-sanitization.md) when changing logs. Never commit credentials or reusable secrets.
- Follow [style and language](docs/project/style.md). Communicate in the user's language.
- Before writing, changing, or reviewing tests, you MUST read and apply the [mandatory test requirements](docs/project/testing.md#required-use).
- For executable changes, follow [testing](docs/project/testing.md#verification-for-code-changes). For MR/PR submission, follow [submission checks](docs/project/workflow.md#submission-checks) for the checked revision; after pushing, verify and report CI for the latest revision.

Shared documentation is maintained in `master`. Preserve type-specific scope and explicit legacy exceptions. Update the canonical rule rather than duplicating it; remove superseded documents after fixing incoming links. Do not create per-plugin READMEs as part of general documentation work.
