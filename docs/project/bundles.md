# Script string imports

Build tooling supports importing JavaScript and TypeScript modules as compiled JavaScript source strings. Append `?bundle`, or `&bundle` after other query parameters, to an import to build the entrypoint and its statically resolved runtime dependencies into one string:

```ts
import script from './entry.ts?bundle'
import moduleScript from './entry.ts?format=esm&bundle'
import namedScript from './entry.ts?format=iife&globalName=BundleScript&bundle'
```

The default export is a string. Importing it does not execute the bundled code. Without the query, the file is an ordinary module; file names do not select compilation behavior. Dependencies inside a bundle use ordinary imports and need no special suffix.

## Options and output

The `bundle` flag takes no value and must be the final query parameter. Other options can appear in either order. The only options are `format` and `globalName`:

| Option | Meaning |
| --- | --- |
| `format` | `iife`, `esm`, or `cjs`; defaults to `iife` |
| `globalName` | Optional name for IIFE exports; invalid with other formats |

Every bundle is minified and targets ES2020. Unknown, duplicate, or incompatible options fail the build. The result must be one JavaScript file without external module imports.

An IIFE initializes when its source executes. With `globalName`, its exports are assigned to that name in the surrounding scope; an exported function still needs an explicit call. ESM retains exports for a module loader. CommonJS output requires `module`/`exports`. The consumer chooses how to store or execute the source and supplies the runtime environment it needs. A module imported both normally and through a bundle has separate instances when the bundled source executes.

## Resource imports

Use explicit file extensions for resource imports. Ordinary Webpack/Jest modules and modules inside `?bundle` receive the same default-export values:

| Resource | Imported value | TypeScript type |
| --- | --- | --- |
| `.wasm` | Base64 string of the original bytes, without a data URL prefix | `string` |
| `.html`, `.htm` | UTF-8 text with an initial BOM removed; other whitespace and markup are preserved | `string` |
| `.json` | Parsed JSON value | `unknown` |

Resources are embedded in the resulting code, with no separate asset files to fetch. WASM is not instantiated automatically: the consumer decodes the base64 and initializes it in the target runtime. Resource changes invalidate the relevant build and test caches.

The shared [import declarations](../../src/types/imports.d.ts) apply to plugin sources and tests. The root `tsconfig.json` includes them; any separate TypeScript program that checks plugin files must include them too. JSON imports require narrowing before property access, for example with the [safe access helpers](../../src/types/get.ts).

Declarations describe imports to TypeScript; they do not load files or configure Jest, Webpack, or esbuild. Each tool loads resources independently. JSON uses their native JSON support. `yarn test` checks the declarations with `tsc --noEmit` before running Jest; Jest does not read `.d.ts` files.

## Build integration

Webpack and Jest use the shared [bundle builder](../../scripts/bundle.ts). It invokes a separate esbuild build with browser dependency resolution. The nested build does not inherit Webpack aliases, loaders, or plugins. The supported resource formats are shared explicitly across the builders. The resulting source string is preserved through production obfuscation. Webpack tracks nested source/configuration dependencies; Jest includes bundled helpers in its dependency graph and transform cache key.

A nested `?bundle` import inside a bundle is currently rejected. Import dependencies as ordinary modules inside that graph.

TypeScript permits only one wildcard in an ambient module declaration. The shared import declarations use `*?bundle` and `*&bundle`, which support arbitrary `globalName` values without additional declarations. Resource patterns end in their file extensions, so they do not overlap with the final bundle suffixes; their order in the file does not select the import type. The shared builder validates the query parameters and resolves the real entrypoint.
