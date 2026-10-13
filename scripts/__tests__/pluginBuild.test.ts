import fs from 'fs'
import os from 'os'
import path from 'path'
import vm from 'vm'
import type { FetchReceipt, ParseReceiptCode } from '../../src/types/receiptFetcher'
import assets from './fixtures/bundle/assets'

interface PluginPaths {
  name: string
  family: 'plugins' | 'receiptFetchers'
  path: string
  manifest: string
}

const { generatePluginConfig } = jest.requireActual<{
  generatePluginConfig: (production: boolean, server: boolean, paths: PluginPaths, output: string) => Record<string, unknown>
}>('../webpack.config')

interface Stats {
  hasErrors: () => boolean
  toString: (options: { all: boolean, errors: boolean }) => string
}

const webpack = jest.requireActual<(config: unknown) => {
  run: (callback: (error?: Error | null, stats?: Stats) => void) => void
  close: (callback: (error?: Error | null) => void) => void
}>('webpack')

jest.setTimeout(60000)
let temporary: string
beforeEach(() => { temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-build-')) })
afterEach(() => { fs.rmSync(temporary, { recursive: true, force: true }) })

async function build (directory: string, extension: string, cacheDirectory?: string): Promise<string> {
  const output = path.join(temporary, 'output', path.basename(directory))
  const config = generatePluginConfig(true, false, {
    name: path.basename(directory),
    family: extension === 'xml' ? 'plugins' : 'receiptFetchers',
    path: directory,
    manifest: path.join(directory, `ZenmoneyManifest.${extension}`)
  }, output)
  config.cache = cacheDirectory == null ? false : { type: 'filesystem', cacheDirectory }
  const compiler = webpack(config)
  try {
    await new Promise<void>((resolve, reject) => compiler.run((error, stats) => {
      if (error != null) return reject(error)
      if (stats == null) return reject(new Error('Missing compilation result'))
      if (stats.hasErrors()) return reject(new Error(stats.toString({ all: false, errors: true })))
      resolve()
    }))
  } finally {
    await new Promise<void>((resolve, reject) => compiler.close(error => error != null ? reject(error) : resolve()))
  }
  return output
}

function loadArtifact (directory: string): {
  context: Record<string, unknown> & { fetchReceipt: FetchReceipt, parseReceiptCode: ParseReceiptCode }
  events: string[]
  logs: Array<{ message: string, level: string }>
  zenmoney: { manifest?: unknown, saveData: () => Promise<void> }
} {
  const events: string[] = []
  const logs: Array<{ message: string, level: string }> = []
  const zenmoney = {
    Headers,
    Blob,
    manifest: undefined,
    fetch: () => { throw new Error('Unexpected network request') },
    application: { platform: 'android', build: '999' },
    trace: (message: string, level: string) => { logs.push({ message, level }) },
    restoreCookies: async () => { events.push('restore') },
    saveCookies: async () => { events.push('cookies') },
    saveData: async () => { events.push('save') },
    setData: () => {},
    openWebView: () => { throw new Error('Unexpected prompt') }
  }
  const context = vm.createContext({ ZenMoney: zenmoney, setTimeout, clearTimeout, console: { log () {}, debug () {}, error () {} } })
  vm.runInContext(fs.readFileSync(path.join(directory, 'index.js'), 'utf8'), context, { timeout: 5000, displayErrors: false })
  return { context: context as ReturnType<typeof loadArtifact>['context'], events, logs, zenmoney }
}

// Synthetic plugins model the shared build and host lifecycle, without provider data.
test('[model] receipt operation traces preserve names, values and errors through the host logging path', async () => {
  const directory = path.join(temporary, 'fixture-ru')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.js'), "export const manifest = { id: 'fixture-ru', countryCodes: [], capabilities: { fetchReceipt: {}, parseReceiptCode: {} } }")
  fs.writeFileSync(path.join(directory, 'index.js'), `
    function run (args) {
      globalThis.operationArgs = args
      if (args.code.value === 'fail') throw globalThis.operationFailure
      return globalThis.operationResult
    }
    async function retrieve (args) { return run(args) }
    function preview (args) { return Promise.resolve(run(args)) }
    export { retrieve as fetchReceipt, preview as parseReceiptCode }
  `)
  const { context, events, logs, zenmoney } = loadArtifact(await build(directory, 'js'))
  expect(logs).toEqual([])
  expect(events).toEqual([])
  for (const name of ['fetchReceipt', 'parseReceiptCode'] as const) {
    const args = {
      code: { format: 'qr' as const, value: 'receipt-reference' },
      isInBackground: false,
      preferences: { password: 'synthetic-secret' }
    }
    const result = name === 'fetchReceipt'
      ? { status: 'notFound' }
      : { status: 'parsed', preview: { completeness: 'preview', totalAmount: '12.34' } }
    context.operationResult = result
    await expect(context[name](args)).resolves.toBe(result)
    expect(context.operationArgs).toBe(args)
    expect(events.splice(0)).toEqual(['save'])
    expect(logs).toHaveLength(2)
    const [call, resolved] = logs.splice(0)
    expect(call.level).toBe('log')
    expect(call.message).toContain(`call ${name} with args:`)
    expect(call.message).toContain('receipt-reference')
    expect(call.message).toContain('isInBackground: false')
    expect(call.message).toContain('<string[16]>')
    expect(call.message).not.toContain(args.preferences.password)
    expect(args.preferences.password).toBe('synthetic-secret')
    expect(resolved.level).toBe('log')
    expect(resolved.message).toContain(`${name} call resolved with`)
    expect(resolved.message).toContain(result.status)
    if (name === 'parseReceiptCode') expect(resolved.message).toContain('12.34')
    expect(resolved.message).toMatch(/\n\(\d+ms\)$/)

    // Retrieval rejects asynchronously; preview throws before returning a promise.
    const failure = new Error('Receipt operation failed')
    context.operationFailure = failure
    await expect(context[name]({ ...args, code: { format: 'qr', value: 'fail' } })).rejects.toBe(failure)
    expect(failure).toMatchObject({ message: '[RUE] Receipt operation failed', fatal: false, allowRetry: false, allow_retry: false })
    expect(events.splice(0)).toEqual(['save'])
    expect(logs).toHaveLength(2)
    const [failedCall, rejected] = logs.splice(0)
    expect(failedCall.message).toContain(`call ${name} with args:`)
    expect(failedCall.message).not.toContain(args.preferences.password)
    expect(rejected.level).toBe('error')
    expect(rejected.message).toContain(`${name} call ${name === 'fetchReceipt' ? 'rejected with' : 'threw'}`)
    expect(rejected.message).toContain('Receipt operation failed')
    expect(rejected.message).not.toContain('[RUE]')
    expect(rejected.message).toMatch(/\n\(\d+ms\)$/)
  }
  const failure = new Error('Storage unavailable')
  zenmoney.saveData = async () => { throw failure }
  await expect(context.fetchReceipt({ code: { format: 'qr', value: 'receipt-reference' }, isInBackground: false })).rejects.toBe(failure)
  expect(events).toEqual([])
  expect(logs).toHaveLength(2)
  expect(logs[1]).toEqual({ level: 'log', message: expect.stringContaining('fetchReceipt call resolved with') })
  expect(logs[1].message).not.toContain('Storage unavailable')

  logs.splice(0)
  const operationFailure = new Error('Receipt operation failed')
  const saveFailure = new Error('Storage unavailable after operation failure')
  context.operationFailure = operationFailure
  zenmoney.saveData = async () => { throw saveFailure }
  await expect(context.fetchReceipt({ code: { format: 'qr', value: 'fail' }, isInBackground: false })).rejects.toBe(operationFailure)
  expect(operationFailure.message).toBe('[RUE] Receipt operation failed')
  expect(logs).toHaveLength(2)
  expect(logs[1]).toEqual({ level: 'error', message: expect.stringContaining('fetchReceipt call rejected with') })
  expect(logs[1].message).toContain('Receipt operation failed')
  expect(logs[1].message).not.toContain('[RUE]')
  expect(saveFailure.message).toBe('Storage unavailable after operation failure')
})

test('[model] receipt wrappers present errors as non-first runs and enforce the runtime subscription flag', async () => {
  const directory = path.join(temporary, 'fixture-ru')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.js'), "export const manifest = { id: 'fixture-ru', countryCodes: [], capabilities: { fetchReceipt: {}, parseReceiptCode: {} } }")
  fs.writeFileSync(path.join(directory, 'index.js'), `
    import { InvalidOtpCodeError } from ${JSON.stringify(path.resolve('src/errors.js'))}
    function fail () {
      const error = new InvalidOtpCodeError()
      globalThis.operationFailure = error
      throw error
    }
    export { fail as fetchReceipt, fail as parseReceiptCode }
  `)
  const { context, events, logs, zenmoney } = loadArtifact(await build(directory, 'js'))
  const getData = jest.fn(() => { throw new Error('Receipt operations must not read scrape state') })
  Object.assign(zenmoney, { locale: 'en', getData })
  const args = { code: { format: 'qr' as const, value: '' }, isInBackground: false, isFirstRun: true }
  for (const name of ['fetchReceipt', 'parseReceiptCode'] as const) {
    await expect(context[name](args)).rejects.toMatchObject({
      message: 'The code is incorrect. Try again — tap "Connect" and enter a new code.',
      fatal: false,
      allowRetry: true,
      allow_retry: true
    })
    expect(events.splice(0)).toEqual(['save'])
    expect(logs).toHaveLength(2)
    expect(logs[1].message).not.toContain('The code is incorrect')
    logs.splice(0)

    // Runtime policy is injected here; this does not add receipt manifest fields.
    Object.assign(zenmoney, { manifest: { isSubscriptionRequired: true }, user: { subscription: { endDate: 0 } } })
    context.operationFailure = undefined
    await expect(context[name](args)).rejects.toMatchObject({ message: '[SUR]', fatal: false, allowRetry: true, allow_retry: true })
    expect(context.operationFailure).toBeUndefined()
    expect(events.splice(0)).toEqual(['save'])
    expect(logs).toEqual([])
    Object.assign(zenmoney, { manifest: { isSubscriptionRequired: false } })
  }
  expect(getData).not.toHaveBeenCalled()
})

test.each(['js', 'ts'])('[model] %s reexported operations build and run with the normal lifecycle', async extension => {
  const directory = path.join(temporary, 'fixture-ru')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, `ZenmoneyManifest.${extension}`), "export const manifest = { id: 'fixture-ru', countryCodes: [], capabilities: { fetchReceipt: {}, parseReceiptCode: {} } }")
  fs.writeFileSync(path.join(directory, `index.${extension}`), 'export * from "./publicOperations"')
  fs.writeFileSync(path.join(directory, `publicOperations.${extension}`), `
    import { retrieve } from './operations'
    const fetchReceipt = retrieve.bind(undefined)
    export { fetchReceipt }
    export { preview as parseReceiptCode } from './operations'
  `)
  const operations = path.join(directory, `operations.${extension}`)
  fs.writeFileSync(operations, `
    if (typeof ZenMoney === 'undefined') throw new Error('Operation modules must run only in the host')
    export async function retrieve () { return { status: 'notFound' } }
    export async function preview () { return { status: 'notApplicable' } }
  `)
  const cache = path.join(temporary, 'cache')
  const output = await build(directory, extension, cache)
  const { context, events } = loadArtifact(output)
  expect(events).toEqual([])
  await expect(context.fetchReceipt({ code: { format: 'qr', value: '' }, isInBackground: false })).resolves.toEqual({ status: 'notFound' })
  await expect(context.parseReceiptCode({ code: { format: 'qr', value: '' } })).resolves.toEqual({ status: 'notApplicable' })
  expect(events).toEqual(['save', 'save'])
  expect(context.retrieve).toBeUndefined()
  expect(context.preview).toBeUndefined()

  const bytes = fs.readFileSync(path.join(output, 'index.js'))
  fs.writeFileSync(path.join(directory, `publicOperations.${extension}`), 'export * from "./operations"')
  await expect(build(directory, extension, cache)).rejects.toThrow('Capabilities and exported operations differ')
  expect(fs.readFileSync(path.join(output, 'index.js'))).toEqual(bytes)
})

test('[model] receipt operations save state on success and failure without managing cookies', async () => {
  const directory = path.join(temporary, 'fixture-ru')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.js'), "export const manifest = { id: 'fixture-ru', countryCodes: [], capabilities: { fetchReceipt: {}, parseReceiptCode: {} } }")
  const index = path.join(directory, 'index.ts')
  fs.writeFileSync(index, `
    export async function fetchReceipt (args: { code: { value: string } }) {
      ZenMoney.setData('session', args.code.value)
      if (args.code.value === 'checkpoint') { await ZenMoney.saveData(); throw new Error('after checkpoint') }
      if (args.code.value === 'fail') throw new Error('provider failed')
      return { status: 'notFound' }
    }
    export async function parseReceiptCode (args: { code: { value: string } }) {
      ZenMoney.setData('preview', args.code.value)
      if (args.code.value === 'checkpoint') { await ZenMoney.saveData(); throw new Error('after checkpoint') }
      if (args.code.value === 'fail') throw new Error('preview failed')
      return { status: 'parsed', preview: { completeness: 'preview', totalAmount: '1' } }
    }
  `)
  const output = await build(directory, 'js')
  expect(fs.readdirSync(output).sort()).toEqual(['ZenmoneyManifest.json', 'index.js'])
  const manifestPath = path.join(output, 'ZenmoneyManifest.json')
  const generated = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
  expect(generated).not.toHaveProperty('build')
  // Publication assigns a build only in JSON; runtime metadata stays independent of that number.
  const metadata = JSON.stringify({ ...generated, version: '1.0.0', build: 42 })
  fs.writeFileSync(manifestPath, metadata)
  const { context, events, zenmoney } = loadArtifact(output)
  expect(generated).not.toHaveProperty('kind')
  expect(generated).not.toHaveProperty('contractVersion')
  expect(zenmoney.manifest).toEqual(generated)
  expect(zenmoney.manifest).not.toHaveProperty('build')
  expect(zenmoney.manifest).not.toHaveProperty('version')
  expect(zenmoney.manifest).not.toHaveProperty('contractVersion')
  for (const name of ['require', 'module', 'document', 'main', 'scrape', 'fetchReceipts']) expect(context[name]).toBeUndefined()
  expect(events).toEqual([])
  const parse = async (value: string): ReturnType<ParseReceiptCode> => await context.parseReceiptCode({ code: { format: 'qr', value } })
  await expect(parse('fail')).rejects.toThrow('preview failed')
  expect(events.splice(0)).toEqual(['save'])
  await expect(parse('checkpoint')).rejects.toThrow('after checkpoint')
  expect(events.splice(0)).toEqual(['save', 'save'])
  await expect(parse('preview')).resolves.toEqual({ status: 'parsed', preview: { completeness: 'preview', totalAmount: '1' } })
  expect(events.splice(0)).toEqual(['save'])
  const fetch = async (value: string): ReturnType<FetchReceipt> => await context.fetchReceipt({ code: { format: 'qr', value }, isInBackground: false })
  await expect(fetch('fail')).rejects.toThrow('provider failed')
  expect(events.splice(0)).toEqual(['save'])
  await expect(fetch('checkpoint')).rejects.toThrow('after checkpoint')
  expect(events.splice(0)).toEqual(['save', 'save'])
  await expect(fetch('success')).resolves.toEqual({ status: 'notFound' })
  expect(events).toEqual(['save'])

  const bytes = fs.readFileSync(path.join(output, 'index.js'))
  const sibling = path.join(temporary, 'output', 'unrelated-bank')
  fs.mkdirSync(sibling)
  fs.writeFileSync(path.join(sibling, 'index.js'), 'sentinel')
  fs.writeFileSync(index, 'export function parseReceiptCode () {}')
  await expect(build(directory, 'js')).rejects.toThrow('Capabilities and exported operations differ')
  expect(fs.readFileSync(path.join(output, 'index.js'))).toEqual(bytes)
  expect(fs.readFileSync(path.join(output, 'ZenmoneyManifest.json'), 'utf8')).toBe(metadata)
  expect(fs.readFileSync(path.join(sibling, 'index.js'), 'utf8')).toBe('sentinel')
  expect(fs.readdirSync(path.dirname(output)).sort()).toEqual(['fixture-ru', 'unrelated-bank'])
})

test.each(['js', 'ts'])('[model] XML plugin derives its %s entry and preferences from source files', async extension => {
  const directory = path.join(temporary, 'fixture-bank')
  fs.mkdirSync(directory)
  const firstLine = extension === 'js' ? 'A &amp; B' : '\n        A &amp; B'
  const xml = `<provider><id>fixture-bank</id><description>${firstLine}\n      - detail\n    Next paragraph.\n</description></provider>`
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.xml'), xml)
  fs.writeFileSync(path.join(directory, 'preferences.xml'), '<preferences/>')
  fs.writeFileSync(path.join(directory, `index.${extension}`), 'export async function scrape () { return { accounts: [], transactions: [] } }')
  const output = await build(directory, 'xml')
  expect(fs.readdirSync(output).sort()).toEqual(['ZenmoneyManifest.xml', 'index.js', 'preferences.xml'])
  expect(fs.readFileSync(path.join(output, 'ZenmoneyManifest.xml'), 'utf8')).toBe('<provider><id>fixture-bank</id><description>A &amp; B\n  - detail\nNext paragraph.</description><files><js>index.js</js><preferences>preferences.xml</preferences></files></provider>')
  expect(fs.readFileSync(path.join(directory, 'ZenmoneyManifest.xml'), 'utf8')).toBe(xml)
  expect(fs.readFileSync(path.join(output, 'preferences.xml'), 'utf8')).toBe('<preferences/>')
  const { context, zenmoney } = loadArtifact(output)
  expect(typeof context.main).toBe('function')
  for (const name of ['scrape', 'fetchReceipt', 'parseReceiptCode']) expect(context[name]).toBeUndefined()
  expect(zenmoney.manifest).toEqual({ id: 'fixture-bank', api: 'private', isSubscriptionRequired: false, isUserInputRequiredOnEveryRun: false })
})

test('[model] XML builds discover optional settings and remove stale artifacts when settings disappear', async () => {
  const directory = path.join(temporary, 'fixture-bank')
  fs.mkdirSync(directory)
  const xml = '<provider><id>fixture-bank</id></provider>'
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.xml'), xml)
  fs.writeFileSync(path.join(directory, 'index.js'), 'export async function main () { return "legacy main" }')
  const preferences = path.join(directory, 'preferences.xml')
  for (const withPreferences of [false, true, false]) {
    if (withPreferences) fs.writeFileSync(preferences, '<preferences/>')
    else fs.rmSync(preferences, { force: true })
    const output = await build(directory, 'xml', path.join(temporary, 'cache'))
    expect(fs.readdirSync(output).sort()).toEqual(['ZenmoneyManifest.xml', 'index.js', ...(withPreferences ? ['preferences.xml'] : [])])
    const settings = withPreferences ? '<preferences>preferences.xml</preferences>' : ''
    expect(fs.readFileSync(path.join(output, 'ZenmoneyManifest.xml'), 'utf8')).toBe(xml.replace('</provider>', `<files><js>index.js</js>${settings}</files></provider>`))
    const { context } = loadArtifact(output)
    await expect((context.main as () => Promise<string>)()).resolves.toBe('legacy main')
  }
})

test.each(['version', 'build', 'modular', 'files'])('[model] XML source manifests reject generated field %s', async field => {
  const directory = path.join(temporary, 'fixture-bank')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.xml'), `<provider><id>fixture-bank</id><${field}>1</${field}></provider>`)
  fs.writeFileSync(path.join(directory, 'index.js'), 'export function main () {}')
  await expect(build(directory, 'xml')).rejects.toThrow(`Source manifest must not declare ${field}`)
  expect(fs.existsSync(path.join(temporary, 'output', 'fixture-bank'))).toBe(false)
})

test.each([{ extensions: [] }, { extensions: ['js', 'ts'] }])('[model] XML builds reject missing or ambiguous entrypoints %#', async ({ extensions }) => {
  const directory = path.join(temporary, 'fixture-bank')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.xml'), '<provider><id>fixture-bank</id></provider>')
  for (const extension of extensions) fs.writeFileSync(path.join(directory, `index.${extension}`), 'export function main () {}')
  await expect(build(directory, 'xml')).rejects.toThrow(extensions.length === 0 ? 'Missing index' : 'Ambiguous index')
  expect(fs.existsSync(path.join(temporary, 'output', 'fixture-bank'))).toBe(false)
})

// Shared resource declarations and loaders also apply to the isolated plugin type check.
test('[model] TypeScript plugins import resources directly and as compiled script strings', async () => {
  const directory = path.join(temporary, 'fixture-ru')
  fs.mkdirSync(directory)
  for (const file of ['assets.ts', 'module.wasm', 'template.html', 'fragment.htm', 'data.json']) {
    fs.copyFileSync(path.join(__dirname, 'fixtures/bundle', file), path.join(directory, file))
  }
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.ts'), "export const manifest = { id: 'fixture-ru', countryCodes: [], capabilities: { fetchReceipt: {} } }")
  fs.writeFileSync(path.join(directory, 'index.ts'), `
    import assets from './assets'
    import source from './assets.ts?format=iife&globalName=BundleScript&bundle'
    export async function fetchReceipt () { return { assets, source } }
  `)
  const output = await build(directory, 'ts')
  expect(fs.readdirSync(output).sort()).toEqual(['ZenmoneyManifest.json', 'index.js'])
  const { context } = loadArtifact(output)
  const result = await context.fetchReceipt({ code: { format: 'qr', value: '' }, isInBackground: false }) as unknown as { assets: unknown, source: string }
  expect(result.assets).toEqual(assets)
  expect(vm.runInNewContext(`${result.source}\nBundleScript.default`)).toEqual(assets)
})

test('[model] TypeScript errors prevent publishing a structurally valid plugin', async () => {
  const directory = path.join(temporary, 'fixture-ru')
  fs.mkdirSync(directory)
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.ts'), "export const manifest = { id: 'fixture-ru', countryCodes: ['RU'], capabilities: { fetchReceipt: {} } }")
  fs.writeFileSync(path.join(directory, 'index.ts'), 'export async function fetchReceipt (): Promise<number> { return "wrong type" }')
  await expect(build(directory, 'ts')).rejects.toThrow('not assignable')
  expect(fs.existsSync(path.join(temporary, 'output', 'fixture-ru'))).toBe(false)
})

test.each([
  { countryCodes: ['ZZ'], capabilities: { fetchReceipt: {} }, error: 'Invalid countryCodes' },
  { countryCodes: [], capabilities: { unknownOperation: {} }, error: 'Unknown capabilities property' }
])('[model] module builds enforce the source family domain contract %#', async ({ countryCodes, capabilities, error }) => {
  const directory = path.join(temporary, 'fixture-ru')
  fs.mkdirSync(directory)
  const manifest = { id: 'fixture-ru', countryCodes, capabilities }
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.js'), `export const manifest = ${JSON.stringify(manifest)}`)
  fs.writeFileSync(path.join(directory, 'index.js'), 'export async function fetchReceipt () { return { status: "notFound" } }')
  await expect(build(directory, 'js')).rejects.toThrow(error)
  expect(fs.existsSync(path.join(temporary, 'output', 'fixture-ru'))).toBe(false)
})

test.each(['js', 'ts'])('[model] %s metadata is compiled and imported with normal expressions and dependencies', async extension => {
  const directory = path.join(temporary, 'fixture-ru')
  fs.mkdirSync(directory)
  const manifest = path.join(directory, `ZenmoneyManifest.${extension}`)
  fs.writeFileSync(manifest, `
    import { metadata, matcher } from './metadata'
    const capabilities = { fetchReceipt: { matcher: matcher() } }
    export const manifest = { ...metadata(), capabilities }
  `)
  const dependency = path.join(directory, 'metadata.ts')
  fs.writeFileSync(dependency, `
    // These helpers run on the build machine, independently of the plugin runtime.
    if (typeof ZenMoney !== 'undefined') throw new Error('Metadata ran in plugin runtime')
    export function metadata (): { id: string, countryCodes: string[] } {
      return { id: ['fixture', 'ru'].join('-'), countryCodes: ['ru'].map(code => code.toUpperCase()) }
    }
    export const matcher = () => ({ all: ['t=', /fn=\\d+/im, { not: { any: ['bad', /no/u] } }] })
  `)
  fs.writeFileSync(path.join(directory, 'index.js'), 'export async function fetchReceipt () { return { status: "notFound" } }')
  const output = await build(directory, extension)
  const descriptor = fs.readFileSync(path.join(output, 'ZenmoneyManifest.json'), 'utf8')
  expect(JSON.parse(descriptor)).toEqual({
    id: 'fixture-ru',
    countryCodes: ['RU'],
    capabilities: {
      fetchReceipt: {
        matcher: {
          all: [
            't=', { regex: { source: 'fn=\\d+', flags: 'im' } },
            { not: { any: ['bad', { regex: { source: 'no', flags: 'u' } }] } }
          ]
        }
      }
    },
    files: { js: ['index.js'] }
  })
  const { context, zenmoney } = loadArtifact(output)
  expect(zenmoney.manifest).toEqual(JSON.parse(descriptor))
  await expect(context.fetchReceipt({ code: { format: 'qr', value: 't=1' }, isInBackground: false })).resolves.toEqual({ status: 'notFound' })
  const bytes = fs.readFileSync(path.join(output, 'index.js'))
  fs.appendFileSync(dependency, "\nthrow new Error('Invalid metadata input')")
  await expect(build(directory, extension)).rejects.toThrow('Invalid metadata input')
  expect(fs.readFileSync(path.join(output, 'index.js'))).toEqual(bytes)
  expect(fs.readFileSync(path.join(output, 'ZenmoneyManifest.json'), 'utf8')).toBe(descriptor)
})
