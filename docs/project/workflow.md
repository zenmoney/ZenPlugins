# Development workflow and submission criteria

Read the sections selected by the [repository route](README.md). Checks cover changed behavior and dependencies, without authorizing unrelated rewrites.

## Repository identity

Read repository-local `.git/config` before Git/hosting operations. Its `user.name`, `user.email`, `core.sshCommand`, and remotes define the identity; never override them with global defaults, environment/command-line settings, or another SSH key. Verify the hosting CLI/API account matches before using it. Report authorization failures instead of switching accounts.

## Git and hosting access

Use Git + SSH with the repository-configured remote and identity by default for all repository and PR/MR work. For GitLab, use the [SSH operations](gitlab.md), including MR creation, title/description edits and closure when retiring the source branch. Check applicable remote refs and server-supported push options before considering another client. Missing API credentials or a browser session do not block these operations; do not request them in advance. A transient network or sandbox failure does not establish a protocol limitation.

Switch to a browser, HTTP/API or hosting CLI only when a concrete required operation cannot be completed through Git + SSH within the task's constraints. Explain that operation and the missing capability, then obtain authorization for a specific alternative only if it is not already authorized. Do not look up alternative credentials before this need is established, switch accounts, or repeatedly request the same access. Reading public protocol documentation does not require project access.

Git refs expose code, but do not establish PR/MR authorship, open/closed/merged state, reviews, or CI results. Branch names and commit authors do not prove PR/MR ownership; missing refs do not prove that no PR/MR exists. Use evidence already available from the task, Git responses and authorized access. Report unavailable metadata or CI as an evidence gap and continue authorized work; routine reporting gaps alone do not justify requesting another access method. An explicit task to retrieve that information can justify the alternative above.

## Working sequence

1. Inspect the worktree and applicable instructions. Preserve unrelated work.
2. Follow the selected plugin type's task route, including its quality assessment and relevant integration notes.
3. For bugs and plugin/log reviews, follow [diagnostic triage and reporting](../debugging/README.md#triage-before-implementation).
4. For requested changes, establish the focused test baseline, implement under the selected type's testing requirements and complete [code verification](testing.md#verification-for-code-changes). For a new case or changed policy, update its [canonical rule](documentation.md#adding-a-case).
5. Review the diff under [completion criteria](#completion-criteria). For MR/PR submissions, follow [submission checks](#submission-checks).

## Commands

Run from the repository root. Clone the public repository with `git clone git@github.com:zenmoney/ZenPlugins.git` and enter its directory. Use Node.js 24.21.0 from [`.nvmrc`](../../.nvmrc) and Yarn Classic to match CI. Install the locked dependencies with `yarn install --frozen-lockfile`; dependency upgrades must be intentional.

| Command | Purpose |
| --- | --- |
| `yarn install --frozen-lockfile` | Install dependencies without updating the lockfile |
| `yarn jest <PLUGIN_ID>` | Focused tests during development |
| `yarn lint:fix <PLUGIN_ID>` | Final formatting/lint fixes |
| `yarn lint <PLUGIN_ID>` | Check plugin style without modifying files |
| `yarn tsc --noEmit` | Repository TypeScript checking |
| `yarn test` | Full lint, type-check, and Jest suite |
| `yarn test:playwright` | Separate Playwright Test suite in Chromium and WebKit; see [browser test setup](testing.md#browser-tests) |
| `yarn test <PLUGIN_ID>` | Filter the final Jest command; lint and TypeScript checking still cover the repository |
| `yarn build <PLUGIN_ID> [<PLUGIN_ID> ...]` | Production bundles in `build/`; bank and receipt plugins can build together in parallel |
| `yarn start <PLUGIN_ID>` | Bank browser development harness |
| `yarn host <PLUGIN_ID>` | Bank production bundle and Bootloader server on port 5050 |

`lint`, `lint:fix`, `jest`, `test` and `build` accept the same [unique plugin names](../plugins/README.md#plugin-names) from either `src/plugins/` or `src/receiptFetchers/`, without a type prefix. Direct file paths and Jest patterns remain supported for lint/tests. For lint/tests, an argument exactly matching a plugin name expands to its source directory; other arguments pass through unchanged. The wrapper does not parse tool options. Use the equals form when an option value matches a plugin name, for example `--testNamePattern=kofd-kz`.

`yarn build btcscan kofd-kz` uses the shared webpack configuration for both plugins. Each output directory contains `index.js` and its manifest: `build/btcscan/ZenmoneyManifest.xml` or `build/kofd-kz/ZenmoneyManifest.json`. Scrape builds discover optional `preferences.xml` beside the entrypoint under the [source-file contract](../plugins/scrape/manifest.md#source-files-and-build-output). Both local formats omit `version` and `build`; the distribution publisher owns [publication metadata](../plugins/README.md#publication-metadata).

Lint rules, TypeScript configuration and Jest configuration are shared across the repository. `yarn test <PLUGIN_ID>` filters only Jest; lint and type checking still cover the repository. Tooling tests under `scripts/` are part of the full Jest suite. `start` and `host` use the bank browser harness.

Build/start/host currently invoke `yarn` before the command; review any resulting lockfile changes. See [package.json](../../package.json) and [wrapper](../../scripts/wrapper.js). Host port ownership and local configuration are described in [Bootloader](../debugging/bootloader.md).

## Submission checks

Run and record the local checks below for each submitted PR/MR revision, including documentation-only changes. Reuse recorded results while the checked revision, code and dependencies remain unchanged; editing only the PR/MR title or description does not require rerunning checks. Their outcomes are verification evidence; publication follows the independent [submission rules](#branches-and-submission).

1. Inspect the branch's CI definitions/includes and `package.json`; use their runtime and locked dependencies. Actual configuration takes precedence over the summary below.
2. Run **`yarn test` without a plugin filter**. A full pass requires all three stages: repository lint, `tsc --noEmit`, and the full Jest suite. The command stops at the first failure; report later stages as not run.
3. Run other locally reproducible CI checks. For plugin implementation, settings, or manifest changes, run `yarn build <PLUGIN_ID>`; for shared code/dependencies/tooling, build consumers covering the changed paths and state the coverage.
4. Fix introduced failures, publishing further updates as needed. Reproduce suspected pre-existing failures with the same command/environment on the base revision in an isolated worktree. Report the command, baseline evidence, and blockers. Record failed, pending, and unavailable checks explicitly; unresolved checks leave verification incomplete.
5. Review the final diff, including generated changes/autofixes. Rerun affected checks when code, dependencies or the checked revision changes, including after rebases, merges or conflict resolution. Record local commands, results, build coverage, and limitations in the PR/MR description. Never disable checks or weaken assertions to pass.

| Current CI | Environment and checks |
| --- | --- |
| [GitHub Actions](../../.github/workflows/test.yml) | Node.js 24.21.0; `yarn install --frozen-lockfile`, then `yarn test` on pushes and pull requests |
| [GitLab](../../.gitlab-ci.yml) | Node.js 24.21.0; [dependency cache setup](../../scripts/setupDependenciesCache.sh) installs with `--frozen-lockfile` on a cache miss; `yarn test` |
| GitLab build/deploy jobs | Invoke external `build` and `deploy` scripts |

After an authorized push, verify required CI jobs on the latest submitted commit using already authorized access under the [access rules](#git-and-hosting-access); wait for completion when results are accessible. Fix introduced failures, repeat affected local checks, and verify the new pipeline. Previous green revisions, pending/skipped jobs, and branch-specific jobs absent from the pipeline are not passes. Report the checked commit, results, and limitations in the task report; inaccessible/unavailable CI leaves verification incomplete without blocking publication or requiring a new access method.

## Branches and submission

These rules apply to both GitHub PRs and GitLab MRs. Create ordinary, non-draft PRs/MRs by default; use Draft only when the user explicitly requests it.

Perform the required [submission checks](#submission-checks), but do not gate authorized branch or PR/MR creation, pushes, or updates on successful results. Pending, failed, or unavailable checks do not justify changing PR/MR state, adding restrictions, or deferring publication. An ordinary PR/MR does not claim that verification passed; successful CI does not itself authorize a merge.

Prefer one open PR/MR per plugin and target branch. Before creating one, inspect available task context, remote branches and PR/MR refs for existing work, checking its scope, commits, and changed files. Reuse a suitable source branch known to belong to the same hosting user; unavailable hosting metadata does not require a browser lookup under the [access rules](#git-and-hosting-access). Preserve existing work. If no suitable source branch is identified, use a dedicated `<plugin>/<issue>` branch for a bank fix; do not combine unrelated banks unless explicitly requested.

For an authorized update to your own unmerged PR/MR, rebasing, amending commits, and force-pushing its source branch are allowed; prefer rebasing onto the latest target before adding changes. Fetch and review the current remote tip first, preserve intended changes, and push with an explicit `--force-with-lease=<ref>:<expected-sha>`; never use an unguarded force push. Establish ownership and unmerged state from task context or accessible hosting evidence before rewriting history. If this evidence is unavailable, preserve history and use additive commits or a dedicated branch within the authorized scope.

Choose the base branch and PR/MR target by the changed code's scope:

| Changed scope | Required base branch and PR/MR target |
| --- | --- |
| New public plugin submitted as a GitHub PR | `master` |
| New plugin submitted as a GitLab MR | `develop` |
| Plugin present in `master`, including a plugin present in both branches | `master` |
| Repository-wide shared code, such as `src/common`, shared types, or build tooling | `master`, including when the change is needed by a develop-only plugin |
| Plugin present only in `develop` | `develop` only |
| Shared repository documentation | `master` |

Check presence in both branches; the current checkout or reproduction branch does not determine the target. A new plugin is absent from both and uses the submission destination above.

If a develop-only plugin fix also requires a repository-wide shared-code change, split the work into linked PRs/MRs: shared code to `master`, plugin-specific code to `develop`. State the dependency and arrange for the shared change to reach `develop` before the plugin fix depends on it. Do not move a private plugin into `master` as part of the shared-code fix.

With an authorized branch push, update the existing PR/MR or create one targeting the correct branch. Capture its URL and verify the source branch and available PR/MR head ref against the submitted commit; report any metadata that could not be read back.

Once the task's work is safely retained remotely and no remaining work requires the extra checkout, remove only the task-created local branch and extra worktree unless the user requested keeping them; preserve uncommitted work and unrelated branches/worktrees. CI status alone does not determine cleanup. Leave the main worktree on an up-to-date `master` or `develop` as appropriate.

Prefer short, single-line commit messages. For plugin commits, use:

```text
[PLUGIN_ID] <imperative phrase starting in lowercase>
```

Examples: `[privatbank] fix missing posInfo handling`, `[tinkoff] parse merchant city from address`. At the end of a plugin fix, offer a commit if committing was not already requested.

`master` is public and `develop` is internal. [Fixture handling](fixtures.md) differs by target; secrets are excluded from both. Documentation published in master always uses public-safe examples.

## Completion criteria

- Confirm the [branch/split rules](#branches-and-submission) and review the diff for unrelated work or data exposure.
- Changed behavior must satisfy applicable contracts, including completeness, unknown failures, language, and sanitization. Report [findings and evidence gaps](../debugging/README.md#findings-and-next-steps).
- Complete [code verification](testing.md#verification-for-code-changes) with passing required checks and report regression coverage. Unresolved/unavailable checks leave verification incomplete. For submitted PRs/MRs, follow the [submission reporting rules](#submission-checks) for the final revision independently of PR/MR state.
- Update new general cases and verify changed documentation under [maintenance](documentation.md); retain provider-specific evidence with the integration.
