import wasm from './fixtures/bundle/module.wasm'
import html from './fixtures/bundle/template.html'
import htm from './fixtures/bundle/fragment.htm'
import json from './fixtures/bundle/data.json'

import defaults from './fixtures/bundle/entry.ts?bundle'
import named from './fixtures/bundle/entry.ts?globalName=MyName&bundle'
import qualified from './fixtures/bundle/entry.ts?globalName=MyName.json&format=iife&bundle'

declare function expectType<T> (value: T): void

// [model] Compile-only checks of the shared resource and script import contract.
export function checkImportTypes (): void {
  expectType<string>(defaults)
  expectType<string>(named)
  // The final bundle suffix keeps names ending in .json separate from JSON imports.
  expectType<string>(qualified)
  // @ts-expect-error Compiled scripts are strings, not their module exports.
  defaults()

  expectType<string>(wasm)
  expectType<string>(html)
  expectType<string>(htm)
  // @ts-expect-error WASM imports contain base64 text, not decoded bytes.
  expectType<Uint8Array>(wasm)
  // @ts-expect-error HTML imports contain text, not DOM elements.
  expectType<Element>(html)
  // @ts-expect-error HTM uses the same text contract as HTML.
  expectType<Element>(htm)

  expectType<unknown>(json)
  // @ts-expect-error JSON values must be narrowed before accessing properties.
  void json.label
  // @ts-expect-error JSON imports are parsed values, not source strings.
  expectType<string>(json)
  if (typeof json === 'string') {
    expectType<string>(json)
  }
}
