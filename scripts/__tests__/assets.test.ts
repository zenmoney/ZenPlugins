import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { runInNewContext } from 'vm'
import bundler = require('../bundle')
import { buildProductionScript } from './helpers/webpack'
import assets from './fixtures/bundle/assets'
import source from './fixtures/bundle/assets.ts?format=iife&globalName=BundleScript&bundle'

const fixtures = resolve(__dirname, './fixtures/bundle')
const expected = {
  wasm: 'AGFzbQEAAAAABgF4AID+/w==',
  html: '<section data-label="Ω">\r\n  😀 &amp; {{value}} ` " \\ </section>\r\n',
  htm: '  <span>fragment &amp; text</span>\n',
  json: { label: 'Ω 😀', items: [1, true, null, { value: 'text' }] }
}

// [model] Resource imports have identical values in Jest, Webpack, and embedded bundles.
// The synthetic WASM module contains opaque non-UTF-8 bytes in a custom section.
describe('[model] bundled resource imports', () => {
  it('imports WASM as base64, HTML as text, and JSON as parsed values in Jest', () => {
    expect(assets).toEqual(expected)
    expect(WebAssembly.validate(Uint8Array.from(Buffer.from(assets.wasm, 'base64')))).toBe(true)
  })

  it('embeds the same resource values and tracks their files in script bundles', () => {
    expect(runInNewContext(`${source}\nBundleScript.default`)).toEqual(expected)
    const result = bundler.buildBundle(join(fixtures, 'assets.ts'), '?format=iife&globalName=BundleScript&bundle')
    expect(result.dependencies).toEqual(expect.arrayContaining(['module.wasm', 'template.html', 'fragment.htm', 'data.json'].map(file => join(fixtures, file))))
  })

  it.each([false, true])('matches direct and bundled imports in production Webpack (HTML template: %s)', async withHtmlTemplate => {
    const output = await buildProductionScript(join(fixtures, 'assetConsumer.ts'), withHtmlTemplate)
    const module: { exports: { assets?: typeof assets, source?: string } } = { exports: {} }
    runInNewContext(output, { module, exports: module.exports })
    expect(module.exports.assets).toEqual(expected)
    expect(module.exports.source).toBe(source)
    expect(runInNewContext(`${module.exports.source ?? ''}\nBundleScript.default`)).toEqual(expected)
  }, 20000)

  it('invalidates direct binary transform caches even when UTF-8 decoding hides byte changes', () => {
    const directory = mkdtempSync(join(tmpdir(), 'asset-cache-'))
    const filename = join(directory, 'module.wasm')
    const bytes = Buffer.from(expected.wasm, 'base64')
    try {
      writeFileSync(filename, bytes)
      const content = readFileSync(filename, 'utf8')
      const before = bundler.getCacheKey(content, filename)
      bytes[bytes.length - 1] = 0xfe
      writeFileSync(filename, bytes)
      expect(readFileSync(filename, 'utf8')).toBe(content)
      expect(bundler.getCacheKey(content, filename)).not.toBe(before)
      const module = { exports: '' }
      runInNewContext(bundler.process(content, filename).code, { module })
      expect(Buffer.from(module.exports, 'base64')).toEqual(bytes)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
})
