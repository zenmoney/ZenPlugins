# Source fixtures

Read before copying logs, captures, or statements into tests, documentation, or an MR. This page owns source evidence and fixture scope; type-specific [testing requirements](testing.md#required-use) own coverage and placement. Runtime logs follow [sanitization](../debugging/log-sanitization.md).

## Observed evidence

All provider-specific test inputs MUST come from observed source data. Do not invent formats, separators, fields, values, missing-field variants, counterpart records, or protocol states, including for parser helpers and robustness tests. Do not reconstruct bank responses from application transactions or interpreted text. Combine records from different responses only when they belong to the same observed case. Sanitization below is the explicit exception for replacing sensitive values.

Record source log/capture/statement provenance and the relevant response/event beside the fixture, plus plugin/build when known. Label partial or projected captures and their missing evidence; they do not satisfy complete-source coverage. Do not fill gaps with guesses. Missing samples remain evidence gaps.

## Preserve the source

Account/transaction conversion and HTML, statement, and receipt parsing tests MUST retain complete source records/documents and the context needed by the case. Do not trim unused fields, array items, text, or whitespace: they may explain a later defect. Select the relevant records rather than copying an entire multi-user log, but keep each selected record whole. Account relationship cases need the complete relevant account/card graph; document parsing needs the complete document.

## Minimal fixtures outside conversion

Other tests MUST reduce observed inputs to the fields, nesting, entries, and steps needed for the selected [regression or guarantee](testing.md#focused-tests-outside-conversion). Do not retain full auth sessions, customer profiles, or financial responses merely to exercise control flow. Preserve everything that determines the tested outcome; removing an irrelevant field is not evidence that the provider omits it. Never remove a required field to manufacture a malformed-response case. Note the reduction beside provenance, then sanitize the retained data below.

## Bank data by target branch

Choose full or minimal fixture scope above independently of the target branch.

- `master` is public. Replace personal names, phone numbers, and account/card identifiers with consistent public-safe values, including in comments and metadata. Preserve formats, relationships, collisions, field presence, separators, and significant whitespace.
- `develop` is internal. Copy retained bank data exactly, including names, comments, masked identifiers, and phone-like values. Do not anonymize ordinary bank data.

In both branches, replace or redact real credentials, authentication/session secrets, cookies, full PANs, private keys, and other reusable secrets without dropping the surrounding structure. Sanitization never permits other fixture cleanup or a different test case.

Documentation is maintained in `master`, so its examples are always public-safe. Keep raw logs/captures in ignored local storage. Do not paste full fixtures into task context unless their complete content is needed; preserve them in files and inspect relevant portions during investigation.

## Public receipt data

Public receipt data needs no anonymization, for existing or new samples in fixtures or documentation. Retain original amounts, product/company names, company identifiers, receipt numbers, and public lookup URLs; a public receipt URL is not an authentication secret. In parsing/conversion fixtures, HTML MUST remain byte-identical and JSON MUST retain every field and value, subject only to secret redaction above. Other tests follow the minimal-fixture rule, preserving retained public values. Expected objects follow the receipt contract; never change inputs to match expectations.
