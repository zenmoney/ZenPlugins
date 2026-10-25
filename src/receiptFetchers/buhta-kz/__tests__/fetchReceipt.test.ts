import fetchMock from 'fetch-mock'
import source from './convertReceipt-01.html'
import missing from './fetchReceipt-01.html'
import { fetchReceipt } from '../index'
import { manifest } from '../ZenmoneyManifest'
import get from '../../../types/get'

const code = 'https://buhta.com/receipt/969/01ktnh12paym9nhb03r7k9q50k'
const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

test.each([code, code.replace('https:', 'http:'), code + '/', code + '?print=1#receipt'])('retrieves the canonical public receipt: %s', async input => {
  const debug = jest.spyOn(console, 'debug')
  const matcher = get(manifest, 'capabilities.fetchReceipt.matcher')
  assert(matcher instanceof RegExp, 'Missing receipt matcher')
  expect(input).toMatch(matcher)
  fetchMock.getOnce(code, { body: source })
  await expect(fetchReceipt(args(input))).resolves.toMatchObject({
    status: 'found',
    receipt: {
      id: '01ktnh12paym9nhb03r7k9q50k',
      totalAmount: '670',
      issuedAt: { date: '2026-06-09', time: '11:27:28' },
      items: [{ quantity: '1', totalAmount: '670' }]
    }
  })
  expect(fetchMock.calls(code)).toHaveLength(1)
  expect(debug).not.toHaveBeenCalled()
})

// Captured 2026-10-25: GET the same public route with receipt id ending q50m
// returns HTTP 200 with the complete not-found envelope in fetchReceipt-01.html.
test('recognizes the observed absent receipt', async () => {
  const absentCode = code.replace(/k$/, 'm')
  fetchMock.getOnce(absentCode, { body: missing })
  await expect(fetchReceipt(args(absentCode))).resolves.toEqual({ status: 'notFound' })
})

test.each([
  'https://other.example/?next=' + code,
  code.replace('buhta.com', 'buhta.com.other.example'),
  code.replace('/receipt/', '/other/'), code.replace(/k$/, ''), 'unsupported-code'
])('rejects unrelated or malformed codes without a request: %s', async input => {
  await expect(fetchReceipt(args(input))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

// Network and HTTP errors are never evidence of a missing receipt.
test('[model] preserves the original transport error', async () => {
  const error = new Error('Network unavailable')
  fetchMock.getOnce(code, { throws: error })
  await expect(fetchReceipt(args(code))).rejects.toBe(error)
})

test('[model] keeps unknown HTTP failures reportable', async () => {
  fetchMock.getOnce(code, { status: 503, body: '' })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Unexpected receipt HTTP status')
})

// A successful HTTP response is insufficient when its receipt payload is absent.
test('[model] rejects an empty successful response', async () => {
  fetchMock.getOnce(code, { status: 200, body: '' })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Missing receipt page data')
})

// Unknown protocol errors must not be classified from an incidental error message alone.
test('[model] rejects a not-found message with an unknown error code', async () => {
  fetchMock.getOnce(code, { body: missing.replace('"statusCode":5', '"statusCode":99') })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Unexpected receipt lookup response')
})

// The QR operation must reject unsupported scan formats before doing network work.
test('[model] ignores unsupported formats', async () => {
  await expect(fetchReceipt({ ...args(code), code: { format: 'ean' as 'qr', value: code } })).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})
