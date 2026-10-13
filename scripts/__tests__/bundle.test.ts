import { execFileSync } from 'child_process'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { runInNewContext } from 'vm'
import bundler = require('../bundle')
import { buildProductionScript } from './helpers/webpack'
import answer from './fixtures/bundle/entry'
import source from './fixtures/bundle/entry.ts?format=iife&globalName=BundleScript&bundle'
import esm from './fixtures/bundle/entry.ts?format=esm&bundle'
import cjs from './fixtures/bundle/entry.ts?format=cjs&bundle'
import named from './fixtures/bundle/entry.ts?globalName=MyName&bundle'
import qualified from './fixtures/bundle/entry.ts?globalName=MyName.json&format=iife&bundle'
import defaults from './fixtures/bundle/sideEffects.ts?bundle'

const entry = resolve(__dirname, './fixtures/bundle/entry.ts')
const query = '?format=iife&globalName=BundleScript&bundle'

// [model] Only the explicit import query converts a module graph to a source string.
describe('[model] explicit script bundles', () => {
  it('imports modules and their helpers normally without a query', () => {
    expect(answer()).toBe(42)
  })

  it('bundles transitive runtime imports into an executable source string', () => {
    expect(typeof source).toBe('string')
    expect(runInNewContext(`${source}\nBundleScript.default()`)).toBe(42)
    expect(source.trim().split('\n')).toHaveLength(1)
  })

  it('supports arbitrary export names, including names ending with an asset extension', () => {
    expect(runInNewContext(`${named}\nMyName.default()`)).toBe(42)
    expect(runInNewContext(`${qualified}\nMyName.json.default()`)).toBe(42)
  })

  it('defaults to a minified ES2020 IIFE and accepts only format and globalName options', () => {
    expect(bundler.bundleOptions('?bundle')).toEqual({ format: 'iife', globalName: undefined, target: 'es2020', minify: true })
    const log = jest.fn()
    runInNewContext(defaults, { console: { log } })
    expect(log).toHaveBeenCalledWith(42)
    expect(bundler.buildBundle(entry, '?globalName=BundleScript&bundle').source).toBe(source)
  })

  it('preserves ESM exports for a native module loader', () => {
    const url = `data:text/javascript;base64,${Buffer.from(esm).toString('base64')}`
    const result = execFileSync(process.execPath, ['--input-type=module', '--eval', `const module = await import(${JSON.stringify(url)}); console.log(module.default())`], { encoding: 'utf8' })
    expect(result.trim()).toBe('42')
  })

  it('preserves CommonJS exports independently of the other formats', () => {
    const module: { exports: { default?: () => number } } = { exports: {} }
    runInNewContext(cjs, { module, exports: module.exports })
    expect(module.exports.default?.()).toBe(42)
  })

  it.each([
    '?bundle=true', '?bundle&bundle', '?format=iief&bundle', '?format=esm&globalName=Foo&bundle',
    '?globalName=&bundle', '?format=iife&format=esm&bundle', '?minify=false&bundle', '?target=es2015&bundle', '?unknown=yes&bundle',
    '?bundle&format=iife', '?format=iife&bundle&'
  ])('rejects invalid query %s', query => {
    expect(() => bundler.bundleOptions(query)).toThrow()
  })

  it('allows either option order before the final bundle flag', () => {
    expect(bundler.isBundleQuery('?globalName=BundleScript&format=iife&bundle')).toBe(true)
    expect(bundler.buildBundle(entry, '?globalName=BundleScript&format=iife&bundle').source).toBe(source)
    expect(bundler.isBundleQuery('?bundleOther')).toBe(false)
  })

  it.each(['js', 'ts'])('recomputes Jest cache keys and dependency graphs after a transitive %s helper changes', extension => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), 'bundle-cache-')))
    const imported = join(directory, `entry.${extension}`)
    const helper = join(directory, `helper.${extension}`)
    const test = join(directory, 'test.ts')
    const request = `./entry.${extension}?format=iife&globalName=BundleScript&bundle`
    const content = `import script from '${request}'`
    try {
      writeFileSync(imported, "export { answer as default } from './helper'")
      writeFileSync(helper, 'export function answer () { return 1 }')
      const before = bundler.getCacheKey(content, test)
      expect([...bundler.extract(content, test, () => new Set([request]))]).toEqual([`./entry.${extension}`])
      writeFileSync(helper, 'export function answer () { return 2 }')
      const after = bundler.getCacheKey(content, test)
      expect(after).not.toBe(before)
      const compiled = bundler.process(`${content}; globalThis.result = script`, test).code
      const context: { result?: string } = {}
      runInNewContext(compiled, context)
      expect(runInNewContext(`${context.result ?? ''}\nBundleScript.default()`)).toBe(2)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })

  it('rejects nested bundle queries instead of treating source-string imports as modules', () => {
    const directory = mkdtempSync(join(tmpdir(), 'nested-bundle-'))
    try {
      writeFileSync(join(directory, 'entry.ts'), "import source from './helper.ts?bundle'; console.log(source)")
      writeFileSync(join(directory, 'helper.ts'), 'export default () => 42')
      expect(() => bundler.buildBundle(join(directory, 'entry.ts'), '?bundle')).toThrow('Nested bundle imports are not supported')
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })

  it('tracks transitive Webpack dependencies', async () => {
    const dependencies = new Set<string>()
    const result = await new Promise<string>((resolve, reject) => {
      void bundler.call({
        resourcePath: entry,
        resourceQuery: query,
        addDependency: (path: string) => dependencies.add(path),
        addMissingDependency: () => {},
        async: () => (error: Error | null, content?: string) => error !== null ? reject(error) : resolve(content ?? '')
      })
    })
    expect(result).toBe(source)
    expect(dependencies.has(resolve(__dirname, './fixtures/bundle/helper.ts'))).toBe(true)
    expect(dependencies.has(resolve(__dirname, './fixtures/bundle/value.ts'))).toBe(true)
  })

  it('emits the same source through the actual production Webpack pipeline', async () => {
    const output = await buildProductionScript(resolve(__dirname, './fixtures/bundle/consumer.ts'))
    const module: { exports: { answer?: () => number, source?: string, esm?: string, cjs?: string, named?: string, qualified?: string } } = { exports: {} }
    runInNewContext(output, { module, exports: module.exports })
    expect(module.exports.answer?.()).toBe(42)
    expect(module.exports.source).toBe(source)
    expect(module.exports.esm).toBe(esm)
    expect(module.exports.cjs).toBe(cjs)
    expect(module.exports.named).toBe(named)
    expect(module.exports.qualified).toBe(qualified)
  }, 20000)
})
