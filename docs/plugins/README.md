# Shared plugin facilities

All plugin types share the execution environment, platform facilities, and engineering conventions. Each type defines its exported operations, argument/result contracts, manifest fields, and settings structure.

## Shared topics

Read only the row matching the affected behavior, alongside the selected type's contracts.

| Change | Required reading |
| --- | --- |
| New implementation, structural change or full review | [Architecture](architecture.md), [runtime](runtime.md) |
| Sessions, state or cookies | [Runtime state](runtime.md#state-and-lifecycle), [persistence boundaries](architecture.md#boundaries); [authentication](authentication.md) for auth state |
| Authentication | [Authentication](authentication.md), [runtime state/input](runtime.md), [errors](errors.md), [sanitization](../debugging/log-sanitization.md) |
| User interaction or background execution | [Runtime UI](runtime.md#background-execution-and-ui); [authentication](authentication.md) for login challenges |
| Error handling | [Error classes and propagation](errors.md), [sanitization](../debugging/log-sanitization.md); [authentication](authentication.md) only for auth transitions |
| Logging or network requests | [Logging behavior](../debugging/production-logs.md#logging-path), [sanitization](../debugging/log-sanitization.md); [architecture boundaries](architecture.md#boundaries) and [errors](errors.md) for request changes |
| WebView, TCP or WebSocket | [Event semantics](runtime.md#event-emitters), affected [WebView](webview/README.md), [Socket](socket.md) or [WebSocket](websocket.md) contract; [permissions](webview/permissions.md) for page-level overrides, plus affected network/authentication rules above |
| Find a reusable helper | [Utilities](utilities.md) |
| Research a service protocol | [Protocol research](protocol-research.md) and relevant existing integration notes |

## Review scope

A focused fix or review covers affected behavior and dependencies: data quality, errors, sanitization, and authentication when present. Inspect available output for other quality defects and report them in the same backlog; keep unrelated fixes separate. Missing evidence is a gap, not a pass.

General log analysis assesses all applicable quality topics across the supported integration, including successful runs. A full plugin review additionally assesses architecture, runtime use, and the type's operation contract. Mark genuinely absent facilities, such as authentication in a file-only importer, as not applicable. Code changes always follow applicable architecture boundaries; a focused legacy fix does not authorize a migration.

## Build pipelines

The shared [webpack configuration](../../scripts/webpack.config.js) supports two entrypoint formats through the [manifest loader](../../scripts/plugin-manifest-loader.js):

- Scrape plugins in `src/plugins/` use `ZenmoneyManifest.xml` and an `index.ts` or `index.js` module. The bundle adapts `scrape` to the host's `main` entrypoint; modules can also export `main` directly. Entrypoints and optional settings follow the [scrape file conventions](scrape/manifest.md#source-files-and-build-output).
- The general module format uses `ZenmoneyManifest.ts` (or `.js`) for metadata and `index.ts` (or `.js`) for named operation functions. The runtime receives metadata and exposes every declared operation through the same asynchronous lifecycle. The source family selects its domain manifest parser: `src/receiptFetchers/` uses the [receipt parser](../../src/common/receiptFetcher/manifest.ts), shared by builds and tests. The loader checks source files and matches exported operations to `capabilities`.

Receipt fetchers are the current consumer of the general module format. Their descriptor validation and operation contracts remain receipt-specific. Future types can reuse this pipeline after adding their discovery, metadata and operation contracts; they do not need a separate builder solely because they are not receipt plugins.

## Publication metadata

Source manifests and local build manifests MUST NOT contain `version` or `build`. These fields identify published packages and are assigned outside local builds; publication procedures are outside this repository's documentation.

Bundles MUST NOT embed `version` or `build` in `ZenMoney.manifest`. Local development has no publication build.

## Plugin names

A plugin name is its source directory name and command-line build target. Names MUST be unique across all plugin types, including `src/plugins/` and `src/receiptFetchers/`. Only directories with a type-specific manifest declare plugins; helper directories do not reserve names. Shared commands reject duplicate plugin names before running a build, lint or test command, including when an unrelated plugin is selected.

New plugin manifest IDs MUST equal the source name and remain unchanged in generated artifacts. No type namespace or generated prefix is added. Receipt IDs MUST also avoid existing bank manifest IDs, including legacy IDs that differ from their directories. Existing bank identities remain unchanged. Use `yarn build <PLUGIN_ID> [<PLUGIN_ID> ...]` for either type; the builder selects the manifest and loader from the source location. See [commands](../project/workflow.md#commands) for outputs.
