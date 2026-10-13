# GitLab operations over SSH

Use these Git + SSH routes for GitLab work under the [access and authorization rules](workflow.md#git-and-hosting-access).

| Operation | Git + SSH route |
| --- | --- |
| Inspect remote branches and commits | `git ls-remote`, `git fetch`, then local `git log`, `git show`, and `git diff` |
| Inspect an MR's code | Fetch `refs/merge-requests/<iid>/head` when available and compare with the correct target |
| Update an existing MR's code | Push to its source branch |
| Create an MR with a branch push | Use `merge_request.create`, `merge_request.target=<target>`, `merge_request.title=<title>`, and `merge_request.description=<description>` push options |
| Change title, description, or target | Use `merge_request.title`, `merge_request.description`, or `merge_request.target` push options on its source branch |
| Remove Draft | Set the title without its Draft prefix through `merge_request.title` |
| Close an MR while retiring its source branch | Delete the remote source branch; GitLab closes associated open MRs when the pushing user has permission to close them |

Pass each [push option](https://docs.gitlab.com/topics/git/commit/#push-options) with `git push -o <option>`, quoting values containing spaces. Options require a ref update; `Everything up-to-date` does not confirm a metadata change. Prefer the next authorized code push for metadata updates. GitLab descriptions can contain paragraphs: pass literal `\n` sequences instead of newline characters in the option value.

Closing through branch deletion uses GitLab's [missing-source-branch handling](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/services/merge_requests/refresh_service.rb). Use this route when retiring that source branch is within the requested scope, accounting for all MRs that share it. Fetch and retain its tip first, then delete with `git push <remote> --force-with-lease=refs/heads/<source>:<expected-sha> :refs/heads/<source>`. A close request that requires keeping the source branch cannot use this route; GitLab has no documented close push option.

Inspect push responses for errors and MR URLs, then verify available branch/MR refs against the submitted commit. A successful push does not prove that every metadata option was applied. Report anything that could not be read back under the [access rules](workflow.md#git-and-hosting-access); that limitation alone does not require a browser or API session.
