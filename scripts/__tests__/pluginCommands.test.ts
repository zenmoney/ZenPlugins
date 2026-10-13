import fs from 'fs'
import os from 'os'
import path from 'path'

interface Selection {
  family: 'plugins' | 'receiptFetchers'
  name: string
  directory: string
}

const { discoverPlugins, resolvePluginSelection, expandPluginArguments } = jest.requireActual<{
  discoverPlugins: (root: string) => Selection[]
  resolvePluginSelection: (selector: string, root: string) => Selection | null
  expandPluginArguments: (args: string[], root: string) => string[]
}>('../pathResolvers')

interface BuildJob {
  name: string
  command: string
  args: string[]
}

const { getBuildJobs } = jest.requireActual<{
  getBuildJobs: (command: string, args: string[], root: string) => BuildJob[]
}>('../wrapper')

let root: string
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-commands-'))
  for (const [family, name, manifest] of [
    ['plugins', 'bank-only', 'ZenmoneyManifest.xml'],
    ['receiptFetchers', 'receipt-ts-ru', 'ZenmoneyManifest.ts'],
    ['receiptFetchers', 'receipt-ru', 'ZenmoneyManifest.js']
  ]) {
    const directory = path.join(root, 'src', family, name)
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, manifest), '')
  }
  fs.mkdirSync(path.join(root, 'src/receiptFetchers/helper'), { recursive: true })
})
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }) })

// Synthetic directories model CLI selection; no upstream provider data is involved.
test('[model] unique names select plugins of either family without a namespace', () => {
  expect(resolvePluginSelection('bank-only', root)).toEqual({ family: 'plugins', name: 'bank-only', directory: path.join(root, 'src/plugins/bank-only') })
  expect(resolvePluginSelection('receipt-ts-ru', root)).toEqual({ family: 'receiptFetchers', name: 'receipt-ts-ru', directory: path.join(root, 'src/receiptFetchers/receipt-ts-ru') })
  expect(resolvePluginSelection('receipt-ru', root)).toEqual({ family: 'receiptFetchers', name: 'receipt-ru', directory: path.join(root, 'src/receiptFetchers/receipt-ru') })
})

test('[model] helpers, unknown names, paths and namespaced selectors cannot become plugins', () => {
  expect(resolvePluginSelection('helper', root)).toBeNull()
  expect(resolvePluginSelection('missing', root)).toBeNull()
  for (const selector of ['receiptFetchers:receipt-ru', 'plugins:bank-only', '../receipt-ru']) {
    expect(resolvePluginSelection(selector, root)).toBeNull()
  }
})

test('[model] lint and test arguments expand exact plugin names without parsing runner options', () => {
  expect(expandPluginArguments(['--fix', 'bank-only', 'receipt-ts-ru', 'src/types'], root)).toEqual([
    '--fix', path.join(root, 'src/plugins/bank-only') + '/', path.join(root, 'src/receiptFetchers/receipt-ts-ru') + '/', 'src/types'
  ])
  expect(expandPluginArguments(['--errorOnDeprecated', 'receipt-ru', '--testNamePattern=bank-only', '--config', './jest.config.js'], root)).toEqual([
    '--errorOnDeprecated', path.join(root, 'src/receiptFetchers/receipt-ru') + '/', '--testNamePattern=bank-only', '--config', './jest.config.js'
  ])
  expect(expandPluginArguments(['--testNamePattern=bank-only', '--', 'receipt-ru'], root)).toEqual([
    '--testNamePattern=bank-only', '--', path.join(root, 'src/receiptFetchers/receipt-ru') + '/'
  ])
  expect(expandPluginArguments(['src/receiptFetchers/receipt-ru', 'bank.*', '--listTests'], root)).toEqual(['src/receiptFetchers/receipt-ru', 'bank.*', '--listTests'])
})

// Build dispatch uses the same webpack configuration for every plugin family.
test('[model] mixed builds dispatch every plugin through webpack without receipt-specific arguments', () => {
  const beforePlugin = ['build', '--config', './scripts/webpack.config.js', '--mode=production', '--env']
  expect(getBuildJobs('webpack', [...beforePlugin, 'PLUGIN=', 'bank-only', 'receipt-ts-ru', 'receipt-ru'], root)).toEqual([
    { name: 'bank-only', command: 'webpack', args: [...beforePlugin, 'PLUGIN=bank-only'] },
    { name: 'receipt-ts-ru', command: 'webpack', args: [...beforePlugin, 'PLUGIN=receipt-ts-ru'] },
    { name: 'receipt-ru', command: 'webpack', args: [...beforePlugin, 'PLUGIN=receipt-ru'] }
  ])
  expect(getBuildJobs('webpack', [...beforePlugin, 'PLUGIN=', 'receipt-ru'], root)).toEqual([
    { name: 'receipt-ru', command: 'webpack', args: [...beforePlugin, 'PLUGIN=receipt-ru'] }
  ])
})

test('[model] invalid build batches are rejected before any child process starts', () => {
  for (const selectors of [
    [], ['missing'], ['receiptFetchers:helper'], ['bank-only', 'missing'],
    ['receiptFetchers:receipt-ru'], ['receipt-ru', 'receipt-ru'], ['bank-only', 'bank-only'],
    ['receipt-ru', '--build', '42'], ['receipt-ru', '--build=42']
  ]) {
    expect(() => getBuildJobs('webpack', ['build', '--env', 'PLUGIN=', ...selectors], root)).toThrow()
  }
})

test('[model] duplicate names fail discovery, commands and builds before dispatch', () => {
  const directory = path.join(root, 'src/plugins/receipt-ru')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.xml'), '<provider><id>receipt-ru</id></provider>')
  expect(() => discoverPlugins(root)).toThrow('Duplicate plugin name: receipt-ru')
  expect(() => resolvePluginSelection('receipt-ru', root)).toThrow('Duplicate plugin name: receipt-ru')
  // An unrelated selection or full lint/test must also catch an invalid repository.
  expect(() => expandPluginArguments([], root)).toThrow('Duplicate plugin name: receipt-ru')
  expect(() => getBuildJobs('webpack', ['build', '--env', 'PLUGIN=', 'bank-only'], root)).toThrow('Duplicate plugin name: receipt-ru')
})

test('[model] helper directories do not reserve plugin names', () => {
  fs.mkdirSync(path.join(root, 'src/plugins/receipt-ru'))
  expect(resolvePluginSelection('receipt-ru', root)?.family).toBe('receiptFetchers')
  fs.rmSync(path.join(root, 'src/plugins'), { recursive: true })
  expect(discoverPlugins(root).map(plugin => plugin.name).sort()).toEqual(['receipt-ru', 'receipt-ts-ru'])
})

test('all checked-in plugins have globally unique source names', () => {
  expect(() => discoverPlugins(path.resolve(__dirname, '../..'))).not.toThrow()
})

interface PluginPaths {
  name: string
  family: Selection['family']
  path: string
  manifest: string
}

interface PluginConfig {
  entry: unknown
  output: { path: string, filename: string }
}

const webpackConfig = jest.requireActual<((env: { PLUGIN: string, WEBPACK_SERVE?: boolean }, argv: { mode: string }) => PluginConfig) & {
  generatePluginConfig: (production: boolean, server: boolean, paths: PluginPaths, output: string) => PluginConfig
}>('../webpack.config')

function fixturePaths (family: Selection['family']): PluginPaths {
  const plugin = discoverPlugins(root).find(plugin => plugin.family === family)
  assert(plugin != null, 'Expected a fixture plugin of this family')
  const manifest = fs.readdirSync(plugin.directory).find(file => /^ZenmoneyManifest\.(xml|[jt]s)$/.test(file))
  assert(manifest != null, 'Expected plugin manifest')
  return { name: plugin.name, family, path: plugin.directory, manifest: path.join(plugin.directory, manifest) }
}

// Synthetic plugins keep the tooling introduction testable before any receipt provider is added.
test.each<Selection['family']>(['plugins', 'receiptFetchers'])('[model] %s builds from its manifest into its own artifact directory', family => {
  const plugin = fixturePaths(family)
  const output = path.join(root, 'build', plugin.name)
  const config = webpackConfig.generatePluginConfig(true, false, plugin, output)
  expect(config.entry).toEqual({ index: fs.realpathSync(plugin.manifest) })
  expect(config.output.path).toBe(output)
  expect(config.output.filename).toBe('[name].js')
})

test('every checked-in plugin is selectable and builds into its own artifact directory', () => {
  const project = path.resolve(__dirname, '../..')
  for (const plugin of discoverPlugins(project)) {
    expect(resolvePluginSelection(plugin.name, project)).toEqual(plugin)
    const config = webpackConfig({ PLUGIN: plugin.name }, { mode: 'production' })
    expect(config.output.path).toBe(path.join(project, 'build', plugin.name))
    expect(config.output.filename).toBe('[name].js')
  }
})

test('[model] scrape browser and Bootloader entries keep their existing URLs', () => {
  const project = path.resolve(__dirname, '../..')
  const bank = discoverPlugins(project).find(plugin => plugin.family === 'plugins')
  assert(bank != null, 'Expected an existing bank plugin')
  const development = webpackConfig({ PLUGIN: bank.name, WEBPACK_SERVE: true }, { mode: 'development' })
  expect(development.entry).toEqual({
    windowLoader: [path.join(project, 'src/windowLoader.jsx')],
    workerLoader: [path.join(project, 'src/workerLoader.js')]
  })
  const host = webpackConfig({ PLUGIN: bank.name, WEBPACK_SERVE: true }, { mode: 'production' })
  expect(host.output.path).toBe(path.join(project, 'build'))
  expect(host.output.filename).toBe('[name].js')
  expect(() => webpackConfig.generatePluginConfig(true, true, fixturePaths('receiptFetchers'), path.join(root, 'build'))).toThrow('browser harness')
})
