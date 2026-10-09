# Plugin model

All plugin types share the execution environment, platform facilities, and engineering conventions. Each type defines its exported operations, argument/result contracts, manifest format, and settings structure.

## Shared documentation

- [Runtime](runtime.md): platform API, state, interaction, networking, capabilities.
- [Architecture](architecture.md): placement of transport, workflows, conversion, and persistence.
- [Errors](errors.md): error classes and application behavior.
- [Authentication](authentication.md): persisted authorization and interactive login for service-backed plugins.
- [Utilities](utilities.md): reusable repository helpers.

## Plugin types

| Type | Exported operation | Documentation |
| --- | --- | --- |
| Account and transaction synchronization | `scrape` | [Scrape](scrape/README.md): contracts, XML manifest, preferences, and quality rules |

Scrape includes [remote history loading](scrape/contract.md) and [file import](scrape/file-import.md). These variants share the exported interface and domain result, with different acquisition and history-scope rules.

Add another type here when its interface exists. Give it its own directory with its exported functions, argument/result types, operation lifecycle, error conditions, manifest and settings formats, loader/application contract, and examples. Link to the shared runtime instead of copying it. Scrape's XML packaging, history interval, account/transaction output, and result adapter apply only to that type.

See existing integration notes beside the affected plugin for integrations; they are read only for the affected plugin or shared provider.
