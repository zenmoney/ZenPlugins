# Receipt manifests and matchers

Scope: source registration, metadata and code filtering. [receiptFetcher.ts](../../../src/types/receiptFetcher.ts) defines author/compiled types; the [development guide](development.md#build-artifacts) owns local build procedures.

## Source declaration

Discover direct children of `src/receiptFetchers/` under the shared [unique-name rules](../README.md#plugin-names). Exactly one `ZenmoneyManifest.ts` or `.js` exports only named `manifest`; exactly one `index.ts` or `.js` exports only supported operation functions. Metadata MUST NOT be exported/re-exported by `index`. New files follow [TypeScript policy](../../project/style.md#type-safety); existing JS is supported and the two source roles may use different languages. Example: [kofd-kz metadata](../../../src/receiptFetchers/kofd-kz/ZenmoneyManifest.ts).

A directory without a manifest is an importable helper, even with an `index`; explicitly building it as a plugin fails. Ambiguous extensions, malformed/missing metadata and missing entrypoints MUST fail rather than selecting silently or treating a broken plugin as a helper.

The local builder compiles/imports author metadata. Imports, helpers and expressions are allowed, but metadata MUST be deterministic and independent of provider execution, login, network, connection state and `ZenMoney`. Keep its dependencies separate from runtime operation modules. Builds and domain tests share the receipt metadata parser.

Each capability is an optional configuration object named for its operation. Presence declares support; absence means unsupported. `{}` is valid, Boolean/null capability values are not. Declare at least one operation; every declared operation MUST have a callable export and every exported operation MUST be declared. Direct declarations, export lists, aliases and reexports are equivalent; type-only exports do not declare runtime operations. Metadata contains no function references.

## Settings

V1 has no receipt-specific settings file or bank XML preferences. Interaction uses shared runtime facilities and connection state under the [operation contract](contract.md).

## Identity and countries

ID MUST equal the `<name>-<country>` directory, with kebab-case provider name and lowercase country suffix, following the shared [name contract](../README.md#plugin-names). Preserve it in generated/runtime metadata and logs. Source location selects the compilation family; capabilities identify supported operations.

`countryCodes` contains unique uppercase ISO 3166-1 alpha-2 codes. Missing/null arrays and duplicates are invalid; `[]` leaves countries unspecified. Multi-country providers list actual codes such as `['DE', 'FR', 'NL']`, never `EU`. Country metadata does not establish receipt currency, merchant jurisdiction or time zone.

## Matcher semantics

Each operation has its own matcher. Evaluate original text without trimming, case conversion, URL decoding or other normalization.

| Form | Meaning |
| --- | --- |
| Absent capability | Unsupported operation |
| Capability with omitted/null matcher | Matches every supported-format code |
| Nonempty string | Case-sensitive literal substring |
| `RegExp` | ECMAScript search; anchors are needed for whole-input matching |
| `all` / `any` | Every child / at least one child matches |
| `not` | Negation of a successfully evaluated child |

`shop.example` also matches `https://other.example/?next=shop.example`. A matcher is a conservative filter, not URL validation or proof of receipt availability. Providers MUST validate applicability and request targets. All positive supported inputs, including alternate hosts and embedded/query-only forms, MUST pass their operation's filter.

Reject empty strings/lists, multiple operators per node, cycles, nested null, unexpected values and unsupported regex syntax/flags. Null is valid only at capability matcher level. V1 permits flags `i`, `m`, `s`, `u`; reject `g`/`y` because eligibility cannot depend on mutable `lastIndex`.

Serialize regexes recursively as `{ "regex": { "source": "^receipt-[0-9]+$", "flags": "i" } }`; plain JSON serialization of `RegExp` is invalid. Each matcher has at most 256 nodes (substrings, regexes and composite operators) and depth below 32, with root depth zero. Validate limits independently per operation.

## Generated descriptor

`ZenmoneyManifest.json` preserves identity/countries and serialized capabilities; identical inputs/toolchain MUST produce identical bytes. It is generated from author metadata and embedded as `ZenMoney.manifest`. [Publication metadata rules](../README.md#publication-metadata) apply; no bank company or XML is required.

## Verification

The [verification matrix](testing.md#verification) maps metadata and artifact requirements to local tests.
