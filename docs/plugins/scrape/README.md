# Account and transaction synchronization

A scrape plugin reads supported financial products and their history and returns Zenmoney accounts and transactions. It can use an API, a website, a statement, or a public ledger; its data source does not change the shared runtime. User-selected statements follow the [file-import variant](file-import.md), with the same scrape interface and separate input/parsing lifecycle.

The [task map](../../README.md#choose-a-task) selects the entrypoint, account, transaction, and quality contracts for each change.

The [XML manifest](manifest.md) defines registration and packaging; [preferences.xml](preferences.md) defines the settings form. These formats belong to scrape plugins. Other plugin types may use different manifest and settings structures.

[Complete examples](examples.md) illustrate output. Shared facilities and policies belong to the [plugin model](../README.md).
