# Plugin architecture

Read for new plugins, substantial service API migrations, structural changes, and full reviews. The responsibility boundaries below are required for new implementations and plugins already following them. Create a layer only when its responsibilities are needed; do not create empty transport or workflow modules. A focused fix in a legacy plugin MUST preserve its established structure unless changing it is necessary for the fix. Do not migrate JavaScript to TypeScript or rewrite unrelated converters incidentally.

```text
index → api → fetchApi
index → converters
```

For service-backed integrations, runtime dependencies MUST follow these directions between applicable layers. Shared DTO definitions MAY live in behavior-free plugin-local `types.ts` or `models.ts`. Converters MUST NOT depend on transport or workflow modules. A file may become a directory with a small public interface when its size warrants it; keep the same responsibility boundaries. The [file-import variant](scrape/file-import.md#module-boundaries) adds a pure document parser and defines orchestration without an HTTP layer.

| Layer | Owns | Must not own |
| --- | --- | --- |
| `fetchApi` | Base URLs, endpoints, methods, query/body serialization, headers, cookie transport, response envelopes, sanitized network logs | Persistent storage, user prompts, authentication transitions, business pagination, domain result construction |
| `api` | Preference validation, authentication transitions, protocol validation, user interaction, pagination, retries, endpoint sequencing and response-dependent recovery | Physical persistent storage, conversion into the exported domain result |
| `converters` | Deterministic conversion from the complete relevant service data into the type's domain objects and declarative fetch parameters | HTTP, storage, user prompts, authentication |
| `index` | Exported operation, physical state/cookie reads and writes, calling workflows and converters, assembling the result | URLs, HTTP headers, cryptography, pagination, protocol state machines, raw payload parsing |

## Boundaries

Unvalidated service responses MUST be `unknown` in TypeScript. Narrow required values with the helpers in [get.ts](../../src/types/get.ts) and assertions with useful sanitized context. Prefer existing helpers from `src/common`; extract new shared code only when it is actually reusable across plugins.

Transport should expose endpoint operations and raw domain payloads. A narrowly defined transport retry is allowed; retrying login or replaying an interaction is a workflow decision. `api` decides whether a recognized service state requires recovery or a user-facing error. Unknown failures propagate unchanged; see [errors](errors.md).

`index` reads state; `api` validates/migrates it and exposes each confirmed auth update. Meet [authentication persistence timing](authentication.md) by splitting workflows at update boundaries or awaiting an entrypoint-owned persistence callback. `api` decides validity; only `index` writes storage. Catch at the entrypoint only for its own persistence/recovery needs, never to reclassify errors.

Use small ordered transaction parsers with explicit recognition conditions where operation types are numerous. Keep classification separate from movement construction when this avoids duplicating signs, fees, and currency logic. A fallback MUST preserve the operation without inventing required fields; unknown unconvertible states MUST fail visibly. Do not use broad cleanup regexes or catch-all omissions.

## Type-specific orchestration

The plugin type owns exports/result shapes. Scrape adds [account sync plans](scrape/account-sync-plans.md) for account-dependent history or the [file-import contract](scrape/file-import.md) for selected statements.

Use the [task route](../README.md#choose-a-task) for affected contracts and verification. Transport logs follow [sanitization](../debugging/log-sanitization.md).
