import fetchMock from 'fetch-mock'
import papaDoner from './convertHtmlReceipt-01.html'
import proStore from './convertHtmlReceipt-02.html'
import missingReceipt from './fetchReceipt-01.json'
import { ZPAPIError } from '../../../errors'
import { serializeManifest } from '../../../common/receiptFetcher/manifest'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import { fetchReceipt } from '../index'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: false })
const uid = '1B1B958F18F1B1A5071866A4'
const endpoint = `https://receipts.ikassa.by/render/${uid}`
const codes = [
  uid,
  `documentId=${uid}`,
  `https://receipts.ikassa.by/?documentId=${uid}`,
  `https://shop.invalid/receipt?documentId=${uid}`,
  `https://receipts.ikassa.by/render/${uid}`,
  `https://RECEIPTS.IKASSA.BY/render/${uid}?download=1#receipt`,
  `http://receipts.ikassa.by/render/${uid}/`
]
const readLine = jest.fn(() => { throw new Error('Unexpected input request') })
const openWebView = jest.fn(() => { throw new Error('Unexpected WebView') })
beforeEach(() => {
  Object.assign(globalThis, { ZenMoney: { locale: 'en', readLine, openWebView } })
  jest.clearAllMocks()
  fetchMock.catch(() => { throw new Error('Unexpected receipt request') })
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Preserve query-only and host-independent documentId lookup, and accept fiscal
// QR UIDs and current render links. The destination always stays on iKassa.
test.each(codes)('retrieves the captured complete receipt from %s', async code => {
  fetchMock.get(endpoint, { body: papaDoner, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(papaDoner) })
  expect(fetchMock.calls(endpoint)).toHaveLength(1)
  expect(fetchMock.lastOptions(endpoint)?.headers).toMatchObject({ Accept: 'text/html' })
  expect(ZenMoney.locale).toBe('ru')
})

test.each([false, true])('retrieves a weighted receipt without date or UI, background=%s', async isInBackground => {
  const id = '484979BF5F0D340E07193731'
  fetchMock.get(`https://receipts.ikassa.by/render/${id}`, { body: proStore })
  await expect(fetchReceipt({ ...args(id), isInBackground })).resolves.toEqual({ status: 'found', receipt: convertReceipt(proStore) })
  expect(readLine).not.toHaveBeenCalled()
  expect(openWebView).not.toHaveBeenCalled()
})

test('all supported code forms pass the published matcher', () => {
  expect(serializeManifest(manifest).id).toBe('ikassa-by')
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  assert(matcher != null && typeof matcher === 'object' && 'any' in matcher, 'Expected alternative receipt matchers')
  for (const code of codes) {
    expect(matcher.any.some(child => typeof child === 'string' ? code.includes(child) : child instanceof RegExp && child.test(code))).toBe(true)
  }
})

test.each([
  '', 'unrelated', uid + '\n', uid + 'x',
  'documentId=', 'documentId=../../secret',
  `documentId=${uid}&documentId=${uid}`,
  `https://other.invalid/render/${uid}`,
  `https://receipts.ikassa.by.evil.invalid/render/${uid}`,
  `https://receipts.ikassa.by@other.invalid/render/${uid}`,
  `https://receipts.ikassa.by:99999/render/${uid}`,
  `https://receipts.ikassa.by/render/${uid}?documentId=484979BF5F0D340E07193731`,
  `https://other.invalid/?next=https://receipts.ikassa.by/render/${uid}`
])('[model] unsupported or ambiguous input makes no requests: %s', async code => {
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

// Complete observed HTTP 400 body for /render/000000000000000000000000,
// captured on 2026-10-25. A valid-format lookup had no matching database record.
test('recognizes the confirmed missing-receipt response', async () => {
  const id = '000000000000000000000000'
  fetchMock.get(`https://receipts.ikassa.by/render/${id}`, { status: 400, body: JSON.stringify(missingReceipt) })
  await expect(fetchReceipt(args(id))).resolves.toEqual({ status: 'notFound' })
})

// Model transport/HTTP failures without fabricating provider-specific error codes.
test('[model] preserves the original network failure', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get(endpoint, { throws: failure })
  await expect(fetchReceipt(args(uid))).rejects.toBe(failure)
})

test.each([400, 404, 429, 503])('[model] unclassified HTTP %s stays reportable', async status => {
  fetchMock.get(endpoint, { status, body: 'Unclassified HTTP failure' })
  const error: unknown = await fetchReceipt(args(uid)).catch((error: unknown) => error)
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
})

test.each(['', '<html>Unexpected response</html>'])('[model] HTTP success without a full receipt still fails: %s', async body => {
  fetchMock.get(endpoint, { body })
  const error: unknown = await fetchReceipt(args(uid)).catch((error: unknown) => error)
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
})

test('[model] rejects a receipt belonging to another UID', async () => {
  fetchMock.get(endpoint, { body: proStore })
  await expect(fetchReceipt(args(uid))).rejects.toThrow('does not match the requested identifier')
})

test('[model] unstructured receipt HTML and authorization cookies are not emitted into HTTP diagnostics', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get(endpoint, { body: papaDoner, headers: { 'Set-Cookie': 'session=synthetic-secret' } })
  await fetchReceipt(args(uid))
  expect(debug).not.toHaveBeenCalled()
})
