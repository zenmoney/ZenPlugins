# Maintaining documentation

Use ordinary Markdown in `docs`. Plugin types share runtime rules; each owns its exports, arguments/results, manifest, and settings.

## One home for each rule

TypeScript owns exact shapes. Contracts own exported operations, data meaning and invariants; quality pages own interpretation of source evidence, decisions and verification cases. Guides own procedures; existing integration notes/tests own provider behavior, supported scope and local exceptions. Type comments stay short and link to the rule.

Document the current public API, without migration history or explanations of omitted internal APIs. Describe plugin operations through their inputs, outputs and failures; keep internal argument preparation and host result delivery out of plugin contracts. For APIs modeled on a standard or library, link to its documentation and describe only meaningful differences and plugin-specific behavior; leave signatures and field shapes to TypeScript. Do not link to host repositories or native implementation files. Plugin documentation MUST be understandable from this repository alone: describe plugin-facing runtime contracts and behavior implemented here. Client receipt processing, catalogs, external build/publication procedures and delivery status are outside its scope.

Each page states its scope. [The root index](../README.md) selects a plugin type or shared area; each branch owns its task routes. Plugin type READMEs route new development and investigation of existing plugins, then select affected topics. Keep type-specific guides in that branch; keep runtime mechanisms and diagnostic tools shared. `AGENTS.md` is a short entrypoint. Do not copy branch routes into the root or make reference links recursively required.

Add a plugin type to the root only when its interface exists. Its branch owns exported operations, argument/result semantics, lifecycle, errors, manifest/settings and examples. Reuse [shared facilities and build formats](../plugins/README.md) where applicable; scrape packaging, history intervals and account/transaction adaptation remain scrape-specific.

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

Use the index's normative terms. Define observable output and uncertainty handling, not incidental regexes/helper names. Label illustrative examples; they are not fixtures. Follow the type's [testing and evidence requirements](testing.md#verification-for-code-changes); never label unimplemented or unobserved scenarios as verified coverage.

## Adding a case

1. Check whether an existing rule already determines the result. If so, fix the implementation and add a regression test.
2. Inspect real source evidence and its distinguishing fields under [fixture rules](fixtures.md).
3. Extend the relevant rule, decision table, and test. Keep provider-specific recognition details beside the implementation/tests.
4. If the change modifies general behavior, document the decision, affected integrations, migration scope, and known gaps in the MR. Do not silently broaden a local heuristic into a global rule.
5. If evidence is insufficient, record the unresolved question and safe current behavior. Do not invent a required amount, currency, identity, error meaning, or permission to omit data.

Tables should cover meaningful dimensions without mechanically enumerating impossible combinations. For transfers, consider account availability, direction, currency, fees, duplicate records, dates, and hold status. For text parsing, include missing values, structure, significant whitespace, and misleading lookalikes.

## Review checks

Check relative file links and section anchors, references from types and source README files, canonical ownership of each rule, public-safe examples, and correspondence with actual APIs. Recheck affected SQL against the local schema in a read-only transaction when available; mark schema snapshots and metric semantics explicitly.

Run relevant checks for changed runnable examples. When moving or deleting a page, preserve applicable rules, update incoming links and remove the old file. Do not merge internal implementations to resolve a link; label branch-specific paths explicitly. Keep the repository focused on current guidance: no historical migration inventories or redirect stubs. Shared infrastructure limitations belong in [compatibility](../plugins/compatibility.md); remove them when fixed. Keep provider-specific behavior, unsupported source cases and extraction gaps in comments beside the implementation or relevant tests, not in shared documentation inventories.
