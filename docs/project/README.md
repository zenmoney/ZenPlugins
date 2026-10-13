# Repository work

Use the route matching the repository task. Plugin behavior and investigation routes belong to the relevant plugin type.

| Task | Required reading |
| --- | --- |
| Locate or place files | [Structure](structure.md) |
| Set up the environment or run builds/tests | [Commands](workflow.md#commands); the affected type's manifest/build contract when changing packaging |
| Plugin naming | [Names and identity](../plugins/README.md#plugin-names) |
| Build tooling or script string imports | [Build formats](../plugins/README.md#build-pipelines), [script bundles](bundles.md) |
| Copy source data into fixtures | [Fixture rules](fixtures.md) |
| Git or hosting operations | [Identity](workflow.md#repository-identity), [access](workflow.md#git-and-hosting-access), [branches and PR/MR state](workflow.md#branches-and-submission); for GitLab, [SSH operations](gitlab.md) |
| Create or update a PR/MR | Git/hosting route above, [submission checks](workflow.md#submission-checks), [completion criteria](workflow.md#completion-criteria) |
| Change documentation | [Maintenance](documentation.md) |

## Code changes

Read [working sequence](workflow.md#working-sequence), [style](style.md), and shared [test tools and verification](testing.md#verification-for-code-changes). Select coverage and evidence requirements in the [scrape](../plugins/scrape/testing.md) or [receipt](../plugins/receipt-fetchers/testing.md) branch. Before copying source data, read [fixture rules](fixtures.md).
