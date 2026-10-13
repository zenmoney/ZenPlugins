# Test tools and verification

Use for executable changes, including runnable documentation examples. Documentation-only verification follows [maintenance](documentation.md#review-checks); every MR/PR also requires [submission checks](workflow.md#submission-checks).

## Verification for code changes

- Select requirements by plugin type: [scrape tests and bank evidence](../plugins/scrape/testing.md) or [receipt tests and source evidence](../plugins/receipt-fetchers/testing.md). Shared-library/tooling changes use the affected contracts and their verification cases.
- Keep dates deterministic. Use fixed dates or freeze the clock; cover relevant interval/time-zone boundaries.
- Preserve an isolated legacy plugin's existing suite/layout. New test files use TypeScript. Use `fetch-mock` for network mocks.
- Run focused Jest tests during development, lint the changed plugin at completion, and type-check changed TypeScript interfaces. Changes to `src/common` require full `yarn test` even without MR submission. Commands are in [workflow](workflow.md#commands).

Exact error/auth/log matrices belong to [errors](../plugins/errors.md#verification), [authentication](../plugins/authentication.md#verification), and [sanitization](../debugging/log-sanitization.md#required-sanitization-tests); use those affected by the change. Copy source data under [fixture rules](fixtures.md).

## Model tests

Synthetic data MAY test implementation invariants independently of a provider's format: timeout/error propagation, absent input handling, immediate state persistence followed by failure, scheduling, or a generic algorithm operating on domain objects. Mark the test/suite `[model]` and state in an English comment which invariant is modeled. Mock a failure directly rather than inventing a provider error response to justify its classification.

Keep model tests separate from source fixtures. Neither model tests, illustrative documentation examples, nor existing synthetic parsing tests establish provider behavior, reproduce an incident, or fill missing source coverage. Type-specific testing pages define the required source evidence.

## Browser tests

Place browser tests in the tested module's `__tests__` directory and name them `<subject>.playwright.test.ts`. This repository convention separates runners: Jest excludes that suffix, and [Playwright Test](../../scripts/playwright.config.ts) selects it across the repository. Import `test` and `expect` from `playwright/test`, provided by the existing `playwright` dependency.

Before the first browser run or after a Playwright upgrade, install matching binaries and system dependencies with `yarn playwright install --with-deps chromium webkit`. Run all browser tests with `yarn test:playwright`, or pass a path to select a module, for example `yarn test:playwright src/common/webview`. Add `--project=chromium` or `--project=webkit` to select one engine.

Browser tests run separately from `yarn test` and the current CI jobs. Playwright creates a fresh browser context for each scenario and saves failure traces under `node_modules/.cache/playwright-results`.
