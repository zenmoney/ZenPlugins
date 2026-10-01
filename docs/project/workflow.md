# Development workflow and submission criteria

Read the sections selected by the [task route](../README.md#choose-a-task). Checks cover changed behavior and dependencies, without authorizing unrelated rewrites.

## Repository identity

Read repository-local `.git/config` before Git/hosting operations. Its `user.name`, `user.email`, `core.sshCommand`, and remotes define the identity; never override them with global defaults, environment/command-line settings, or another SSH key. Verify the hosting CLI/API account matches. Report authorization failures instead of switching accounts.

## Working sequence

1. Inspect the worktree and applicable instructions. Preserve unrelated work.
2. Follow the [task route](../README.md), including relevant integration notes and the scrape quality assessment.
3. Establish the focused test baseline.
4. For bugs and plugin/log reviews, complete [diagnostic triage](../debugging/README.md#triage-before-implementation) before edits.
5. Add a regression fixture and expected behavior, make the minimal fix, and run focused tests.
6. Complete [code verification](testing.md#verification-for-code-changes) and, when submitting/updating an MR/PR, [submission checks](#submission-checks).
7. For a new case or changed policy, update its [canonical rule](documentation.md#adding-a-case).
8. Review the diff and report evidence under [completion criteria](#completion-criteria).

## Commands

Run from the repository root. Clone the public repository with `git clone https://github.com/zenmoney/ZenPlugins.git` and enter its directory. Use Node.js 20 and Yarn Classic to match the current CI, with a Node patch version satisfying dependency engines (webpack-cli 7.2.1 requires >=20.9.0). Install the locked dependencies with `yarn install --frozen-lockfile`; dependency upgrades must be intentional.

| Command | Purpose |
| --- | --- |
| `yarn install --frozen-lockfile` | Install dependencies without updating the lockfile |
| `yarn jest src/plugins/<PLUGIN_ID>` | Focused tests during development |
| `yarn lint:fix src/plugins/<PLUGIN_ID>` | Final formatting/lint fixes |
| `yarn lint src/plugins/<PLUGIN_ID>` | Check plugin style without modifying files |
| `yarn tsc --noEmit` | Repository TypeScript checking |
| `yarn test` | Full lint, type-check, and Jest suite |
| `yarn test src/plugins/<PLUGIN_ID>` | Filter the final Jest command; lint and TypeScript checking still cover the repository |
| `yarn build <PLUGIN_ID> [<PLUGIN_ID> ...]` | Production bundles in `build/`; multiple plugins build in parallel |
| `yarn start <PLUGIN_ID>` | Browser development harness |
| `yarn host <PLUGIN_ID>` | Production bundle and Bootloader server on port 5050 |

Build/start/host currently invoke `yarn` before the command; review any resulting lockfile changes. See [package.json](../../package.json) and [wrapper](../../scripts/wrapper.js). Host port ownership and local configuration are described in [Bootloader](../debugging/bootloader.md).

## Submission checks

Before creating or updating any MR/PR, including documentation-only changes:

1. Inspect the branch's CI definitions/includes and `package.json`; use their runtime and locked dependencies. Actual configuration takes precedence over the summary below.
2. Run **`yarn test` without a plugin filter**. It must complete all three stages: repository lint, `tsc --noEmit`, and the full Jest suite. The command stops at the first failure; later stages cannot be reported as passed.
3. Run other locally reproducible CI checks. For plugin implementation, settings, or manifest changes, run `yarn build <PLUGIN_ID>`; for shared code/dependencies/tooling, build consumers covering the changed paths and state the coverage.
4. Fix introduced failures. Reproduce suspected pre-existing failures with the same command/environment on the base revision in an isolated worktree. Report the command, baseline evidence, and blockers. Unresolved/unavailable required checks mean verification is incomplete and the MR is not ready.
5. Review the final diff, including generated changes/autofixes. Rerun affected checks after edits, dependency changes, merges, or conflict resolution. Record commands, results, build coverage, and limitations in the MR. Never disable checks or weaken assertions to pass.

| Current CI | Environment and checks |
| --- | --- |
| [GitHub Actions](../../.github/workflows/test.yml) | Node.js 20; `yarn install --frozen-lockfile`, then `yarn test` on pushes and pull requests |
| [GitLab](../../.gitlab-ci.yml) | Node.js 20; [dependency cache setup](../../scripts/setupDependenciesCache.sh) installs with `--frozen-lockfile` on a cache miss; `yarn test` |
| GitLab build job | Runs `/opt/ZenPlugins/bin/build` only on `master`, `develop`, and branch names ending in `_beta` without `/`. The runner script is outside this repository; local `yarn build` does not prove this job passes |

After an authorized push, wait for required CI jobs on the latest submitted commit. Fix introduced failures, repeat affected local checks, and verify the new pipeline. Previous green revisions, pending/skipped jobs, and branch-specific jobs absent from the pipeline are not passes. Report inaccessible/unavailable CI as incomplete verification.

## Branches and submission

For a bank fix, use a dedicated `<plugin>/<issue>` branch. Do not combine unrelated banks in one MR unless explicitly requested. Choose the base branch and MR target by the changed code's scope:

| Changed scope | Required base branch and PR/MR target |
| --- | --- |
| New public plugin submitted as a GitHub PR | `master` |
| New plugin submitted as a GitLab MR | `develop` |
| Plugin present in `master`, including a plugin present in both branches | `master` |
| Repository-wide shared code, such as `src/common`, shared types, or build tooling | `master`, including when the change is needed by a develop-only plugin |
| Plugin present only in `develop` | `develop` only |
| Shared repository documentation | `master` |

Check presence in both branches; the current checkout or reproduction branch does not determine the target. A new plugin is absent from both and uses the submission destination above.

If a develop-only plugin fix also requires a repository-wide shared-code change, split the work into linked MRs: shared code to `master`, plugin-specific code to `develop`. State the dependency and arrange for the shared change to reach `develop` before the plugin fix depends on it. Do not move a private plugin into `master` as part of the shared-code fix.

When an authorized branch push to GitLab is performed, create its MR targeting the correct branch after local submission checks. After the latest MR revision passes the applicable CI checks, remove only the task-created local branch and extra worktree unless the user requested keeping them; preserve uncommitted work and unrelated branches/worktrees. Leave the main worktree on an up-to-date `master` or `develop` as appropriate. Do not perform a destructive cleanup when task work is not safely retained.

Plugin commit convention:

```text
[PLUGIN_ID] <imperative phrase starting in lowercase>
```

Examples: `[privatbank] fix missing posInfo handling`, `[tinkoff] parse merchant city from address`. At the end of a plugin fix, offer a commit if committing was not already requested.

`master` is public and `develop` is internal. [Fixture handling](fixtures.md) differs by target; secrets are excluded from both. Documentation published in master always uses public-safe examples.

## Completion criteria

- Confirm the [branch/split rules](#branches-and-submission) and review the diff for unrelated work or data exposure.
- Changed behavior must satisfy applicable contracts, including completeness, unknown failures, language, and sanitization. Report checked cases, defects, and evidence gaps under the [quality procedure](../plugins/scrape/quality/README.md#development-and-review-procedure) for scrape.
- Complete [code verification](testing.md#verification-for-code-changes) with passing required checks and report regression coverage. Unresolved/unavailable checks leave verification incomplete. Submitted MR/PRs also require passing [submission checks](#submission-checks) for the final revision.
- Update new general cases under [documentation maintenance](documentation.md); retain bank-specific evidence with the integration. Verify changed documentation's links, source correspondence, moved-rule coverage, and examples without claiming untested legacy compliance.
