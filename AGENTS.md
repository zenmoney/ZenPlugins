# Repository instructions

Start with the task route in [docs](docs/README.md), the single reading map. Read its required sections once and existing notes for the affected integration; do not recursively load reference links or unrelated plugin notes.

- Before Git or hosting operations, read repository-local `.git/config` and [workflow](docs/project/workflow.md#repository-identity). Use its identity/remotes and the documented base branch and MR target. Preserve unrelated work.
- Keep changes focused. A legacy fix does not authorize an architecture or language migration.
- For scrape development, review, and log analysis, start with the [quality assessment](docs/plugins/scrape/quality/README.md#required-use). Assess data correctness alongside authentication, errors, and sanitization; full reviews also assess architecture. Report evidence gaps.
- Unexpected failures must remain visible and reportable. Never return successful partial data after an unknown error.
- Follow [fixture rules](docs/project/fixtures.md) when copying bank data and [sanitization](docs/debugging/log-sanitization.md) when changing logs. Never commit credentials or reusable secrets.
- Follow [style and language](docs/project/style.md). Communicate in the user's language.
- For executable changes, follow [testing](docs/project/testing.md#verification-for-code-changes). Before any MR/PR submission or update, complete [submission checks](docs/project/workflow.md#submission-checks), including full `yarn test`; after pushing, verify CI for the latest revision.

Shared documentation is maintained in `master`. Preserve type-specific scope and explicit legacy exceptions. Update the canonical rule rather than duplicating it; remove superseded documents after fixing incoming links. Do not create per-plugin READMEs as part of general documentation work.
