# Bank fixtures and public data

Read before copying logs, captures, or statements into tests, documentation, or an MR. [Testing](testing.md#bank-data-and-model-tests) defines which behavior requires bank evidence. Runtime logs follow the separate [sanitization policy](../debugging/log-sanitization.md).

## Preserve the source

Use complete original bank records and the associated response context needed by the case. Do not trim fields, array items within a record, text, whitespace, or other apparently unused details to make a fixture smaller. A field unused by today's converter can explain a future parsing defect. Selecting the actual operation(s) for a test does not require copying an entire multi-user log, but each selected object must remain complete. Account relationship tests need the complete relevant account/card graph.

Record source log/capture/statement provenance and the relevant response/event beside the fixture, plus plugin/build when known. Combine records from different responses only when they belong to the same observed case. Do not manufacture bank responses from saved application transactions or copy interpreted application text into an assumed API field.

## Target branch

`master` is public. Sanitize personal data and secrets while preserving the bank's format, relationships, collisions, field presence, separators, and significant whitespace. Replace names, personal phone numbers, and account/card identifiers with consistent public-safe values. Apply sanitization to comments and metadata too. Sanitization is not permission to simplify the payload or invent a different case.

`develop` is internal. Copy bank data exactly, including all fields, names, comments, masked identifiers, and phone-like values. Do not anonymize ordinary bank data or remove unused fields. The sole security exception in either branch is real credentials, authentication/session secrets, cookies, full PANs, private keys, and other reusable secrets: replace or redact these without dropping the surrounding record structure. This exception never authorizes other fixture cleanup.

Documentation is maintained in `master`, so its examples are always public-safe. Keep raw logs/captures in ignored local storage. Do not paste full fixtures into task context unless their complete content is needed; preserve them in files and inspect relevant portions during investigation.
