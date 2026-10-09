# GitLab operations over SSH

This page covers GitLab-specific mechanics. General authorization and PR/MR policy live in [workflow](workflow.md#git-and-hosting-access).

| Operation | Git + SSH route |
| --- | --- |
| Inspect remote branches and commits | `git ls-remote`, `git fetch`, then local `git log`, `git show`, and `git diff` |
| Inspect an MR's code | Fetch `refs/merge-requests/<iid>/head` when available and compare with the correct target |
| Update an existing MR's code | Push to its source branch |
| Create an MR with a branch push | Use `merge_request.create`, `merge_request.target=<target>`, and `merge_request.title=<title>` push options |
| Change title, description, or target | Use `merge_request.title`, `merge_request.description`, or `merge_request.target` push options on its source branch |
| Remove Draft | Set the title without its Draft prefix through `merge_request.title` |

Pass each [push option](https://docs.gitlab.com/topics/git/commit/#push-options) with `git push -o <option>`, quoting values containing spaces. Options require a ref update; `Everything up-to-date` does not confirm a metadata change. Prefer the next authorized code push for metadata updates. GitLab descriptions can contain paragraphs: pass literal `\n` sequences instead of newline characters in the option value.

Git + SSH does not expose MR authorship, open/closed/merged state, discussions, approvals, or pipeline/job results. Use the general access rules when this information is required.
