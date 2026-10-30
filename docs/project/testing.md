# Test tools and verification

Use for executable changes, including runnable documentation examples. Documentation-only verification follows [maintenance](documentation.md#review-checks); every MR/PR also requires [submission checks](workflow.md#submission-checks).

## Required use

Before adding, changing, or reviewing tests, you MUST read the design and scope rules below and the affected [scrape](../plugins/scrape/testing.md) or [receipt](../plugins/receipt-fetchers/testing.md) requirements; for provider data, also read [fixtures](fixtures.md). These are mandatory acceptance criteria for every new or changed test, including test-only work. Check compliance in the final diff: passing Jest or a `[model]` label does not waive them. Missing required source evidence leaves verification incomplete and MUST be reported.

## Verification for code changes

- Apply the [mandatory test requirements](#required-use). Shared-library/tooling changes use the affected contracts and their verification cases.
- Keep dates deterministic. Use fixed dates or freeze the clock; cover relevant interval/time-zone boundaries.
- Preserve an isolated legacy plugin's existing suite/layout. New test files use TypeScript. Use `fetch-mock` for network mocks.
- Run focused Jest tests during development, lint the changed plugin at completion, and type-check changed TypeScript interfaces. Changes to `src/common` require full `yarn test` even without MR submission. Commands are in [workflow](workflow.md#commands).

Error/auth/log verification cases belong to [errors](../plugins/errors.md#verification), [authentication](../plugins/authentication.md#verification), and [sanitization](../debugging/log-sanitization.md#required-sanitization-tests); select them under the scope below. Copy source data under [fixture rules](fixtures.md).

## Test value and placement

- Each test MUST detect a concrete regression or verify an observable guarantee. Name it, check existing coverage, and extend an appropriate case before adding another test of the same behavior.
- Assertions MUST check the result or effect at the boundary where the defect can occur. The test's own transformations are not evidence: checking an array's length after `map(convertTransaction)` does not detect transactions converted to `null`.
- Shared SDK, adapter, validator, and helper behavior MUST be tested beside the shared implementation. Plugin tests cover provider behavior and necessary integration guarantees; they MUST NOT copy the shared module's validation matrix.
- Parameterized cases MUST cover distinct behavior or observed regressions. Do not multiply equivalent HTTP statuses, account positions, or workflow steps into a Cartesian product without a distinct failure to detect in each case.

## Focused tests outside conversion

Authentication, transport, orchestration, persistence, and logging tests MUST cover only concrete regressions or important guarantees affected by the work. Documentation verification lists identify risks to assess, not mandatory scenario matrices. Conversion and HTML, statement, and receipt parsing retain their type-specific coverage and [complete-source requirements](fixtures.md#preserve-the-source).

Use the smallest boundary and [minimal fixtures](fixtures.md#minimal-fixtures-outside-conversion) that demonstrate the guarantee, such as saving confirmed auth before a later failure or preventing a background SMS request. Do not replay a complete login and synchronization merely to reach it. Assert request details, counts, and ordering only when they establish that guarantee; do not freeze incidental steps or repeat the same check across layers. Preserve unrelated existing tests during a focused change.

A historical flow replay does not prove current server compatibility. Report observed source cases separately from model/runtime checks; test counts alone do not establish data quality.

## Model tests

Synthetic local state or domain objects MAY test provider-independent behavior: timeouts, absent local input, error propagation, persistence, scheduling, generic grouping, or shared validation. Inject local/transport failures at the dependency boundary. Mark the test/suite `[model]` and state the invariant in an English comment; the scope and placement rules above still apply.

The boundary is the input's meaning, not the test label: bank-shaped records passed to a converter or parser remain provider data under [fixture rules](fixtures.md#observed-evidence), even when produced by a factory or called a DTO/model. Model tests operate independently of bank interpretation; mocked internal results MAY use domain objects after that boundary. Keep them separate from source-backed cases. Models, illustrative examples, and legacy synthetic parsing tests do not establish provider behavior or fill missing source coverage.

## Browser tests

Place browser tests in the tested module's `__tests__` directory and name them `<subject>.playwright.test.ts`. This repository convention separates runners: Jest excludes that suffix, and [Playwright Test](../../scripts/playwright.config.ts) selects it across the repository. Import `test` and `expect` from `playwright/test`, provided by the existing `playwright` dependency.

Before the first browser run or after a Playwright upgrade, install matching binaries and system dependencies with `yarn playwright install --with-deps chromium webkit`. Run all browser tests with `yarn test:playwright`, or pass a path to select a module, for example `yarn test:playwright src/common/webview`. Add `--project=chromium` or `--project=webkit` to select one engine.

Browser tests run separately from `yarn test` and the current CI jobs. Playwright creates a fresh browser context for each scenario and saves failure traces under `node_modules/.cache/playwright-results`.
