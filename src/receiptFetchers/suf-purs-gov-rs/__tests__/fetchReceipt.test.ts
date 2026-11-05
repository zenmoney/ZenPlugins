import fetchMock from 'fetch-mock'
import get from '../../../types/get'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import redirect from './fetchReceipt-01.json'
import html from './convertReceipt-02.html'

const code = 'https://128.pl/FoZ81'
const args = { code: { format: 'qr' as const, value: code }, isInBackground: true }
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'sr' } }); fetchMock.catch(() => { throw new Error('Unexpected request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Minimal observed GET redirect from 2026-11-05; only status and Location affect routing.
test('follows the observed short link once to the validated Serbian receipt', async () => {
  const target = get(redirect, 'location')
  assert(typeof target === 'string', 'Missing captured redirect')
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get(code, { status: 307, headers: { Location: target }, body: '' })
  fetchMock.get(target, { body: html })
  await expect(fetchReceipt(args)).resolves.toEqual({ status: 'found', receipt: convertReceipt(html) })
  expect(get(fetchMock.lastOptions(code), 'redirect')).toBe('manual')
  expect(get(fetchMock.calls(), 'matched')).toHaveLength(2)
  expect(debug).not.toHaveBeenCalled()
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  assert(matcher != null && typeof matcher === 'object' && 'any' in matcher, 'Expected matcher alternatives')
  expect(matcher.any.some(child => child instanceof RegExp && child.test(code))).toBe(true)
})

// Model routing invariant: neither foreign hosts, lookalikes nor another shortener hop can be requested.
test.each(['https://other.invalid/receipt', 'https://suf.purs.gov.rs.other.invalid/v/?vl=value', 'https://128.pl/Again'])('[model] refuses redirect destination %s', async location => {
  fetchMock.get(code, { status: 307, headers: { Location: location }, body: '' })
  await expect(fetchReceipt(args)).resolves.toEqual({ status: 'notApplicable' })
  expect(get(fetchMock.calls(), 'matched')).toHaveLength(1)
})

test('[model] preserves shortener network failures', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get(code, { throws: failure })
  await expect(fetchReceipt(args)).rejects.toBe(failure)
})
