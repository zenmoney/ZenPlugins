# Plugin development documentation

Start with the plugin type. Each branch has two routes: **develop a new plugin** and **investigate logs and improve an existing plugin**. Shared requirements are maintained in `master`.

## Plugin types

| Type | Purpose and source | Start here |
| --- | --- | --- |
| Account and transaction synchronization | `scrape` loads financial products and history from APIs, websites, public ledgers or selected statements; `src/plugins/` | [Scrape](plugins/scrape/README.md) |
| Receipt retrieval and code preview | `fetchReceipt` retrieves a receipt; `parseReceiptCode` previews a code locally; plugins may implement either or both; `src/receiptFetchers/` | [Receipt fetchers](plugins/receipt-fetchers/README.md) |

## Shared sections

| Need | Start here |
| --- | --- |
| Sessions and storage, logging, errors, network APIs or architecture | [Shared plugin facilities](plugins/README.md) |
| Obtain/read logs, sanitize diagnostics, interpret metrics or reproduce a problem | [Debugging](debugging/README.md) |
| Repository layout, environment, tests, Git or documentation changes | [Repository work](project/README.md) |

## Reading rules

Follow the selected route, reading its required sections once. Read linked references only when their condition applies or a detail needs clarification; do not load the whole tree or unrelated plugin notes. Type-specific routes select domain rules; shared sections own common behavior.

For code changes, also follow [code-change policies](project/README.md#code-changes). Before Git/hosting operations or documentation changes, use the corresponding [repository route](project/README.md).

`MUST`/`MUST NOT` are mandatory. `SHOULD` is a default requiring a documented reason to depart from. `MAY` is optional. Scope and explicit exceptions take precedence over general wording. [Compatibility limitations](plugins/compatibility.md) record actual gaps; a requirement does not claim that every legacy plugin already complies.
