import fs from 'fs'
import os from 'os'
import path from 'path'
import type { ReceiptFetcherDescriptor } from '../../src/types/receiptFetcher'
import { serializeManifest } from '../../src/common/receiptFetcher/manifest'

const { readPluginModule } = jest.requireActual<{
  readPluginModule: (directory: string, exported: Record<string, unknown>, serializer: typeof serializeManifest, bankRoot?: string) => { index: string, descriptor: ReceiptFetcherDescriptor }
}>('../plugin-manifest-loader')

let root: string
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-module-')) })
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }) })

function plugin (index = 'export async function fetchReceipt () { return { status: "notFound" } }', extension = 'js'): string {
  const directory = path.join(root, 'example-ru')
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.js'), 'export const manifest = {}')
  fs.writeFileSync(path.join(directory, `index.${extension}`), index)
  return directory
}

const manifest = { id: 'example-ru', countryCodes: ['RU'], capabilities: { fetchReceipt: {} } }

// Synthetic source files model module wiring; domain value checks live in src/common/receiptFetcher/manifest.test.ts.
describe.each(['js', 'ts'])('[model] %s operation exports', extension => {
  test.each([
    'const fetchReceipt = async () => ({ status: "notFound" }); export { fetchReceipt }',
    'import { retrieve } from "./operations"; export { retrieve as fetchReceipt }',
    'export { retrieve as fetchReceipt } from "./operations"',
    'export { default as fetchReceipt } from "./defaultOperation"',
    'export * from "./publicOperations"',
    'import { retrieve } from "./operations"; export const fetchReceipt = retrieve.bind(undefined)',
    'function createOperation () { return async () => ({ status: "notFound" }) }; export const fetchReceipt = createOperation()'
  ])('accept callable exports regardless of declaration syntax %#', index => {
    const directory = plugin(index, extension)
    fs.writeFileSync(path.join(directory, `operations.${extension}`), `
      throw new Error('Operation modules must not execute during validation')
      export async function retrieve () { return { status: 'notFound' } }
    `)
    fs.writeFileSync(path.join(directory, `publicOperations.${extension}`), 'export { retrieve as fetchReceipt } from "./operations"')
    fs.writeFileSync(path.join(directory, `defaultOperation.${extension}`), 'export { retrieve as default } from "./operations"')
    expect(readPluginModule(directory, { manifest }, serializeManifest)).toEqual({
      index: path.join(directory, `index.${extension}`),
      descriptor: serializeManifest(manifest)
    })
  })

  test.each([
    'export const retrieve = 1',
    'export async function retrieve () {}; export async function extra () {}'
  ])('reject non-callable or undeclared reexports %#', operations => {
    const directory = plugin('export * from "./operations"', extension)
    fs.writeFileSync(path.join(directory, `operations.${extension}`), operations.replace('retrieve', 'fetchReceipt'))
    expect(() => readPluginModule(directory, { manifest }, serializeManifest)).toThrow()
  })
})

test('[model] type-only exports do not declare runtime operations', () => {
  const directory = plugin('export type { fetchReceipt } from "./operations"', 'ts')
  fs.writeFileSync(path.join(directory, 'operations.ts'), 'export async function fetchReceipt () {}')
  expect(() => readPluginModule(directory, { manifest }, serializeManifest)).toThrow()
  fs.writeFileSync(path.join(directory, 'index.ts'), 'export type Helper = string; export { fetchReceipt } from "./operations"')
  expect(readPluginModule(directory, { manifest }, serializeManifest).descriptor).toEqual(serializeManifest(manifest))
})

test.each([
  {}, { default: manifest }, { manifest, fetchReceipt: () => {} }
])('[model] reject missing or extra metadata exports %#', exported => {
  expect(() => readPluginModule(plugin(), exported, serializeManifest)).toThrow('Metadata module must export only manifest')
})

test.each([
  'export async function scrape () {}',
  'export default function fetchReceipt () {}',
  'export const fetchReceipt = 1',
  'export async function fetchReceipt () {}; export const manifest = {}',
  'export async function fetchReceipts () {}',
  'export * from "./missing"'
])('[model] reject incompatible entrypoint %#', index => {
  expect(() => readPluginModule(plugin(index), { manifest }, serializeManifest)).toThrow()
})

test('[model] ambiguous extensions and collisions are rejected', () => {
  const directory = plugin()
  fs.writeFileSync(path.join(directory, 'index.ts'), 'export function fetchReceipt () {}')
  expect(() => readPluginModule(directory, { manifest }, serializeManifest)).toThrow('Ambiguous')
  fs.unlinkSync(path.join(directory, 'index.ts'))
  fs.writeFileSync(path.join(directory, 'ZenmoneyManifest.ts'), 'export const manifest = {}')
  expect(() => readPluginModule(directory, { manifest }, serializeManifest)).toThrow('Ambiguous')
  fs.unlinkSync(path.join(directory, 'ZenmoneyManifest.ts'))
  const bankRoot = path.join(root, 'banks')
  fs.mkdirSync(path.join(bankRoot, 'legacy'), { recursive: true })
  fs.writeFileSync(path.join(bankRoot, 'legacy/ZenmoneyManifest.xml'), '<provider><id>example-ru</id></provider>')
  expect(() => readPluginModule(directory, { manifest }, serializeManifest, bankRoot)).toThrow('collides')
})

test('[model] a valid domain id must match its source directory', () => {
  expect(() => readPluginModule(plugin(), { manifest: { ...manifest, id: 'another-ru' } }, serializeManifest)).toThrow('Plugin id does not match source directory')
})

test('[model] a bank source name reserves its identity even when its XML id differs', () => {
  const directory = plugin()
  const bankRoot = path.join(root, 'banks')
  fs.mkdirSync(path.join(bankRoot, 'example-ru'), { recursive: true })
  // A manifest-less helper is not a plugin.
  expect(readPluginModule(directory, { manifest }, serializeManifest, bankRoot).descriptor.id).toBe('example-ru')
  fs.writeFileSync(path.join(bankRoot, 'example-ru/ZenmoneyManifest.xml'), '<provider><id>legacy-id</id></provider>')
  expect(() => readPluginModule(directory, { manifest }, serializeManifest, bankRoot)).toThrow('collides')
})

test('[model] matching declarations cannot enable the unsupported batch operation', () => {
  const directory = plugin('export async function fetchReceipts () {}')
  const exported = { manifest: { ...manifest, capabilities: { fetchReceipts: {} } } }
  expect(() => readPluginModule(directory, exported, serializeManifest)).toThrow('Unknown capabilities property')
})

test('[model] a preview-only provider retains its own matcher without declaring retrieval', () => {
  const directory = plugin('export async function parseReceiptCode () { return { status: "notApplicable" } }')
  const exported = { manifest: { ...manifest, capabilities: { parseReceiptCode: { matcher: 't=' } } } }
  expect(readPluginModule(directory, exported, serializeManifest).descriptor.capabilities).toEqual({ parseReceiptCode: { matcher: 't=' } })
})
