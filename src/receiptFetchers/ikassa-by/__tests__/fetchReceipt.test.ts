import get from '../../../types/get'
import fs from 'fs'
import path from 'path'
import cloudReceipt from './convertHtmlReceipt-03.html'
import fetchMock from 'fetch-mock'
import papaDoner from './convertHtmlReceipt-01.html'
import proStore from './convertHtmlReceipt-02.html'
import missingReceipt from './fetchReceipt-01.json'
import missingWebkassaReceipt from '../../webkassa-by/__tests__/fetchReceipt-01.json'
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
  (fetchMock as typeof fetchMock & { setImplementations: (implementations: { Response: typeof Response }) => void }).setImplementations({ Response })
  Object.assign(globalThis, { ZenMoney: { locale: 'en', features: { binaryResponseBody: true }, readLine, openWebView } })
  jest.clearAllMocks()
  fetchMock.catch(() => { throw new Error('Unexpected receipt request') })
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Preserve query-only and host-independent documentId lookup, and accept fiscal
// QR UIDs and current render links. A successful lookup needs only iKassa.
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

// An anonymized WebKassa print-form PDF preserves the observed layout and amount
// separators. The iKassa response replays the observed missing-record result.
test('returns the WebKassa receipt when iKassa has no record for the fiscal UID', async () => {
  const id = '0123456789ABCDEF3B8B8BA7'
  const primary = `https://receipts.ikassa.by/render/${id}`
  const fallback = `https://webkassa.by/rsCashAppsWeb/noauth/files/print-forms/checks/${id}`
  fetchMock.get(primary, { status: 400, body: JSON.stringify(missingReceipt) })
  const pdf = new Uint8Array(fs.readFileSync(path.join(__dirname, '../../webkassa-by/__tests__/fetchReceipt-02.pdf')))
  fetchMock.get(fallback, new Response(pdf, {
    headers: { 'Content-Type': 'application/octet-stream' }
  }))
  await expect(fetchReceipt(args(id))).resolves.toEqual({
    status: 'found',
    receipt: expect.objectContaining({ id, totalAmount: '2500' })
  })
  expect(get(fetchMock.calls(), 'matched')).toEqual([
    expect.arrayContaining([primary]),
    expect.arrayContaining([fallback])
  ])
})

// Both providers returned their missing-record responses for the all-zero UID.
test('returns notFound when neither provider has the receipt', async () => {
  const id = '000000000000000000000000'
  fetchMock.get(`https://receipts.ikassa.by/render/${id}`, { status: 400, body: JSON.stringify(missingReceipt) })
  fetchMock.get(`https://webkassa.by/rsCashAppsWeb/noauth/files/print-forms/checks/${id}`, new Response(JSON.stringify(missingWebkassaReceipt), {
    status: 500,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  }))
  await expect(fetchReceipt(args(id))).resolves.toEqual({ status: 'notFound' })
  expect(get(fetchMock.calls(), 'matched')).toHaveLength(2)
})

// Only a confirmed missing record resolves a failed fallback as notFound.
test('[model] keeps an unclassified fallback failure reportable', async () => {
  const id = '000000000000000000000000'
  fetchMock.get(`https://receipts.ikassa.by/render/${id}`, { status: 400, body: JSON.stringify(missingReceipt) })
  fetchMock.get(`https://webkassa.by/rsCashAppsWeb/noauth/files/print-forms/checks/${id}`, { status: 500 })
  await expect(fetchReceipt(args(id))).rejects.toThrow('Unexpected receipt HTTP status')
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

// Observed cloud domain and document, 2026-11-05, receipts.csv row 1489.
test('uses the observed cloud host rather than the legacy render database', async () => {
  const code = 'https://receipts.cloud.ikassa.by/render/150B5F7DDEA9F05207196D2D'
  fetchMock.get(code, { body: cloudReceipt })
  await expect(fetchReceipt({ ...args(code), isInBackground: true })).resolves.toEqual({ status: 'found', receipt: convertReceipt(cloudReceipt) })
  expect(get(fetchMock.calls(), 'matched')).toHaveLength(1)
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  assert(matcher != null && typeof matcher === 'object' && 'any' in matcher, 'Expected matcher alternatives')
  expect(matcher.any.some(child => child instanceof RegExp && child.test(code))).toBe(true)
})
