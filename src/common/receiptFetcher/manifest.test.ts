import vm from 'vm'
import { serializeManifest } from './manifest'
import type { ReceiptFetcherManifest } from '../../types/receiptFetcher'

const manifest: ReceiptFetcherManifest = { id: 'example-ru', countryCodes: ['RU'], capabilities: { fetchReceipt: {} } }

// Synthetic metadata models the plugin contract without files, webpack or provider data.
test('[model] nested matchers serialize into deterministic JSON without a publication build', () => {
  const exported = {
    manifest: {
      ...manifest,
      countryCodes: ['RU', 'BY'],
      capabilities: { fetchReceipt: { matcher: { all: ['t=', /fn=\d+/im, { not: { any: ['bad', /no/u] } }] } } }
    }
  }
  const descriptor = serializeManifest(exported.manifest)
  expect(descriptor).toEqual({
    id: 'example-ru',
    countryCodes: ['RU', 'BY'],
    capabilities: {
      fetchReceipt: {
        matcher: {
          all: ['t=', { regex: { source: 'fn=\\d+', flags: 'im' } }, { not: { any: ['bad', { regex: { source: 'no', flags: 'u' } }] } }]
        }
      }
    },
    files: { js: ['index.js'] }
  })
  expect(JSON.stringify(serializeManifest(exported.manifest))).toBe(JSON.stringify(descriptor))
})

test.each([
  null,
  { ...manifest, countryCodes: ['ZZ'] },
  { ...manifest, countryCodes: ['RU', 'RU'] },
  { ...manifest, countryCodes: null },
  { ...manifest, countryCodes: new Array<string>(1) },
  { ...manifest, id: 'receiptFetcher-example-ru' },
  { ...manifest, build: 42 },
  { ...manifest, version: '1.0.0' },
  { ...manifest, capabilities: { fetchReceipts: {} } },
  { ...manifest, capabilities: { fetchReceipt: null } },
  { ...manifest, capabilities: {} }
])('[model] reject invalid metadata %#', manifest => {
  expect(() => serializeManifest(manifest)).toThrow()
})

test.each([
  /test/g, /test/y, '', { all: [] }, { any: new Array<string>(1) }, { any: [null] }, { all: ['x'], not: 'y' }, () => true
])('[model] reject invalid matcher %#', matcher => {
  expect(() => serializeManifest({ ...manifest, capabilities: { fetchReceipt: { matcher } } })).toThrow()
})

test('[model] cyclic matcher values fail before JSON serialization', () => {
  const matcher: { not?: unknown } = {}
  matcher.not = matcher
  expect(() => serializeManifest({ ...manifest, capabilities: { fetchReceipt: { matcher } } })).toThrow('Matcher is too deep')
})

test('[model] each operation can serialize a matcher with exactly 256 nodes', () => {
  const matcher = { any: Array.from({ length: 255 }, () => 'receipt') }
  const capabilities = { fetchReceipt: { matcher }, parseReceiptCode: { matcher } }
  expect(serializeManifest({ ...manifest, capabilities }).capabilities).toEqual(capabilities)
})

test.each([
  { any: Array.from({ length: 256 }, () => 'receipt') },
  { all: [{ not: { any: Array.from({ length: 254 }, () => /receipt/i) } }] }
])('[model] reject matchers exceeding the distribution limit of 256 nodes %#', matcher => {
  expect(() => serializeManifest({ ...manifest, capabilities: { fetchReceipt: { matcher } } })).toThrow('Matcher has too many nodes')
})

test('[model] metadata imported from another realm retains regular expressions', () => {
  const matcher: unknown = vm.runInNewContext('/receipt-[0-9]+/im')
  expect(serializeManifest({ ...manifest, capabilities: { fetchReceipt: { matcher } } }).capabilities).toEqual({
    fetchReceipt: { matcher: { regex: { source: 'receipt-[0-9]+', flags: 'im' } } }
  })
})

test.each([{}, { matcher: null }])('[model] a declared operation may omit its matcher %#', capability => {
  const capabilities = { parseReceiptCode: capability }
  expect(serializeManifest({ ...manifest, capabilities }).capabilities).toEqual(capabilities)
})
