# Maintaining documentation

Use ordinary Markdown in `docs`. Plugin types share runtime rules; each owns its exports, arguments/results, manifest, and settings.

## One home for each rule

Ownership follows [document responsibilities](../README.md#document-responsibilities): TypeScript owns shapes, contracts/quality pages own semantics and decisions, guides own procedures, and existing integration notes/tests own bank observations. Type comments stay short and link to the rule.

Each page states its scope. [The index](../README.md#choose-a-task) owns conditional reading routes; `AGENTS.md` is a short entrypoint. Do not duplicate routes or make reference links recursively required.

Keep one full statement of each rule. Elsewhere, link to its section and state only when it applies. Avoid repeating a decision table unless the repetition adds a distinct verification condition. Preserve requirement strength, scope, exceptions, counterexamples, and unique examples when shortening; do not create a second summary document that can drift.

## Requirement format

Quality rules use stable topic IDs such as `ACCOUNT-001` or `TRANSFER-003`. Keep an ID when wording is clarified without changing the subject; do not recycle retired IDs for unrelated behavior.

```markdown
## TOPIC-001 Descriptive rule name

Applies to: the relevant plugin type, input format, or migration scope.

Requirement: the converter MUST ... when ...

| Case | Input evidence | Expected result |
| --- | --- | --- |
| Supported case | ... | ... |
| Nearby counterexample | ... | ... |
| Missing/ambiguous data | ... | ... |

Verification: link to the regression test, or state that this case
is required coverage for an implementation that supports it.
```

Use the index's normative terms. Define observable output and uncertainty handling, not incidental regexes/helper names. Label illustrative examples; they are not fixtures. Follow [bank/model evidence rules](testing.md#bank-data-and-model-tests); never label unimplemented or unobserved scenarios as verified coverage.

## Adding a case

1. Check whether an existing rule already determines the result. If so, fix the implementation and add a regression test.
2. Inspect real bank evidence and its distinguishing fields under [fixture rules](fixtures.md).
3. Extend the relevant rule, decision table, and test. Keep bank-specific recognition details in the bank profile.
4. If the change modifies general behavior, document the decision, affected integrations, migration scope, and known gaps in the MR. Do not silently broaden a local heuristic into a global rule.
5. If evidence is insufficient, record the unresolved question and safe current behavior. Do not invent a required amount, currency, identity, error meaning, or permission to omit data.

Tables should cover meaningful dimensions without mechanically enumerating impossible combinations. For transfers, consider account availability, direction, currency, fees, duplicate records, dates, and hold status. For text parsing, include missing values, structure, significant whitespace, and misleading lookalikes.

## Branch maintenance

`master` is the canonical editing branch for shared documentation. Bring the same documentation changes into `develop` after the master change is committed. Include documentation comments in that reconciliation: replace conflicting long rules in `src/types/zenmoney.ts` and the old `AGENTS.md` with short semantics and links to the canonical pages. Do not change declarations or copy internal implementations as part of that documentation-only step. Verify the destination branch has one consistent rule set. When a develop-only fix needs a general rule, make the matching docs change in master and link the reviews.

Do not merge internal implementation files merely to make a documentation link resolve. Label branch-specific paths explicitly. When moving a page, update incoming links and remove the old file; do not leave placeholder redirect documents.

## Review checks

Check relative file links and section anchors, references from types and source README files, canonical ownership of each rule, public-safe examples, and correspondence with actual APIs. Recheck affected SQL against the local schema in a read-only transaction when available; mark schema snapshots and metric semantics explicitly.

Run relevant checks for changed runnable examples. Before deleting superseded documents, verify that their still-applicable rules and incoming links are covered. Keep the repository focused on current guidance: no historical migration inventories or redirect stubs. Current implementation limitations belong in [compatibility](../plugins/compatibility.md), with links from the affected contract; remove them when fixed.
