import { execFileSync, spawnSync } from 'child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { runInNewContext } from 'vm'
import { buildProductionScript } from './helpers/webpack'
import packageJson from '../../package.json'

const { jest: { moduleFileExtensions } } = packageJson as { jest: { moduleFileExtensions: string[] } }

function exportedSource (code: string): string {
  const module = { exports: { default: '' } }
  runInNewContext(code, { module, exports: module.exports })
  return module.exports.default
}

function transformInNode (filename: string): string {
  // Jest virtualizes createRequire inside test modules; its transformer runs in Node.
  return execFileSync(process.execPath, ['-e', `
    const bundler = require(process.argv[1])
    const filename = process.argv[2]
    process.stdout.write(bundler.process(require('fs').readFileSync(filename, 'utf8'), filename).code)
  `, resolve(__dirname, '../jest-raw-loader.js'), filename], { encoding: 'utf8' })
}

// [model] Build caches and test discovery preserve the bundled module graph.
describe('[model] bundle integration regressions', () => {
  let directory: string
  beforeEach(() => { directory = realpathSync(mkdtempSync(join(tmpdir(), 'bundle-regression-'))) })
  afterEach(() => { rmSync(directory, { recursive: true, force: true }) })

  const runJest = (directory: string, ...args: string[]): ReturnType<typeof spawnSync> => spawnSync(process.execPath, [
    require.resolve('jest/bin/jest'), '--runInBand', '--config', JSON.stringify({
      rootDir: directory,
      cacheDirectory: join(directory, 'jest-cache'),
      testEnvironment: 'node',
      moduleFileExtensions,
      transform: { '^.+\\.[jt]sx?$': resolve(__dirname, '../jest-raw-loader.js') },
      dependencyExtractor: resolve(__dirname, '../jest-raw-loader.js')
    }), ...args
  ], { encoding: 'utf8' })

  it('invalidates persistent Webpack bundles after a transitive tsconfig change', async () => {
    mkdirSync(join(directory, 'page'))
    writeFileSync(join(directory, 'page/tsconfig.json'), '{ "extends": "../middle.json" }')
    writeFileSync(join(directory, 'middle.json'), '{ "extends": "./shared.json" }')
    const shared = join(directory, 'shared.json')
    writeFileSync(shared, '{ "compilerOptions": { "useDefineForClassFields": true } }')
    writeFileSync(join(directory, 'page/index.ts'), `
      class Base { set value (value) { this.setterCalled = true } }
      class Child extends Base { value = 42 }
      export default new Child().setterCalled === true
    `)
    const consumer = join(directory, 'consumer.ts')
    writeFileSync(consumer, "export { default } from './page/index.ts?globalName=BundleScript&bundle'")
    const cache = join(directory, 'webpack-cache')
    const before = exportedSource(await buildProductionScript(consumer, false, cache))
    expect(runInNewContext(`${before}\nBundleScript.default`)).toBe(false)

    writeFileSync(shared, '{ "compilerOptions": { "useDefineForClassFields": false } }')
    const after = exportedSource(await buildProductionScript(consumer, false, cache))
    expect(runInNewContext(`${after}\nBundleScript.default`)).toBe(true)
    expect(after).toBe(exportedSource(await buildProductionScript(consumer)))
  }, 20000)

  it.each(['js', 'jsx', 'ts', 'tsx'])('resolves directory index.%s bundles identically in Jest and Webpack', async extension => {
    mkdirSync(join(directory, 'page'))
    writeFileSync(join(directory, `page/index.${extension}`), 'export default 42')
    const consumer = join(directory, 'consumer.ts')
    const content = "import source from './page?globalName=BundleScript&bundle'; export default source"
    writeFileSync(consumer, content)
    const production = exportedSource(await buildProductionScript(consumer))
    const transformed = exportedSource(transformInNode(consumer))
    expect(transformed).toBe(production)
    expect(runInNewContext(`${transformed}\nBundleScript.default`)).toBe(42)
  }, 20000)

  it('prefers a source file to a directory index in both builders', async () => {
    mkdirSync(join(directory, 'page'))
    writeFileSync(join(directory, 'page/index.js'), 'export default 0')
    writeFileSync(join(directory, 'page.ts'), 'export default 42')
    const consumer = join(directory, 'consumer.ts')
    const content = "import source from './page?globalName=BundleScript&bundle'; export default source"
    writeFileSync(consumer, content)
    const production = exportedSource(await buildProductionScript(consumer))
    const transformed = exportedSource(transformInNode(consumer))
    expect(transformed).toBe(production)
    expect(runInNewContext(`${transformed}\nBundleScript.default`)).toBe(42)
  }, 20000)

  it('defers errors in unrelated bundles until their consumer is tested', () => {
    writeFileSync(join(directory, 'unrelated.test.ts'), "test('unrelated', () => expect(1).toBe(1))")
    writeFileSync(join(directory, 'consumer.ts'), "export { default } from './broken.ts?bundle'")
    writeFileSync(join(directory, 'broken.ts'), 'export default ;')
    writeFileSync(join(directory, 'broken.test.ts'), "import source from './consumer'; test('broken', () => expect(typeof source).toBe('string'))")
    const unrelated = runJest(directory, 'unrelated.test.ts')
    expect({ status: unrelated.status, error: unrelated.error }).toEqual({ status: 0, error: undefined })
    const broken = runJest(directory, 'broken.test.ts')
    expect(broken.status).toBe(1)
    expect(String(broken.stderr)).toContain('Unexpected ";"')
  }, 20000)

  it.each(['js', 'jsx', 'ts', 'tsx'])('finds consuming tests through directory bundles and transitive .%s helpers', extension => {
    mkdirSync(join(directory, 'page'))
    const helper = join(directory, `page/helper.${extension}`)
    writeFileSync(helper, 'export default 42')
    writeFileSync(join(directory, `page/index.${extension}`), "export { default } from './helper'")
    const test = join(directory, 'consumer.test.ts')
    writeFileSync(test, "import source from './page?bundle'; test('bundle', () => expect(typeof source).toBe('string'))")
    writeFileSync(join(directory, 'unrelated.test.ts'), "test('unrelated', () => expect(1).toBe(1))")
    const result = runJest(directory, '--findRelatedTests', helper, '--listTests', '--json')
    expect(result.status).toBe(0)
    expect(JSON.parse(String(result.stdout))).toEqual([test])
  }, 20000)
})
