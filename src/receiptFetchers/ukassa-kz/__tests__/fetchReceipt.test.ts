import fetchMock from 'fetch-mock'
import fixture from './convertReceipt-01.json'
import denied from './fetchReceipt-01.json'
import { fetchReceipt } from '../index'
import get from '../../../types/get'
import { manifest } from '../ZenmoneyManifest'

const code = 'ukassa.kz/check?id=290575609&fiscal_number=3193862841&kgd=UK00010034'
const endpoint = 'https://ukassa.kz/api/operation/get_client_check/'
const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

test.each([code, `https://${code}`, `http://${code}`, code.replace('/check?', '/check/?')])('retrieves the source QR variant %s', async value => {
  const debug = jest.spyOn(console, 'debug')
  fetchMock.post(endpoint, { body: fixture })
  const matcher = get(manifest, 'capabilities.fetchReceipt.matcher')
  assert(matcher instanceof RegExp, 'Missing uKassa matcher')
  expect(value).toMatch(matcher)
  await expect(fetchReceipt(args(value))).resolves.toMatchObject({
    status: 'found', receipt: { id: '290575609', totalAmount: '1081', items: [{ quantity: '1', totalAmount: '1081' }] }
  })
  expect(JSON.parse(String(fetchMock.lastOptions()?.body))).toEqual({ id: '290575609', fiscal_number: '3193862841', kod_kgd: 'UK00010034' })
  expect(debug).not.toHaveBeenCalled()
})

test.each([
  'https://ukassa.kz.evil.example/check?id=290575609&fiscal_number=3193862841&kgd=UK00010034',
  `https://evil.example/?next=${code}`, code.replace('/check?', '/other?'),
  code.replace('&kgd=UK00010034', ''), code + '&id=1', 'unsupported-code'
])('rejects unrelated or incomplete input without a request: %s', async value => {
  await expect(fetchReceipt(args(value))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

// Observed 2026-10-25: the source id/kgd with fiscal_number=3193862840 returns
// HTTP 400 and fetchReceipt-01.json. Access denial does not prove receipt absence.
test('keeps the observed access denial reportable', async () => {
  fetchMock.post(endpoint, { status: 400, body: denied })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Unexpected receipt HTTP status')
})

// Transport and malformed payload failures must remain errors, not notFound or partial success.
test('[model] propagates the original transport error', async () => {
  const error = new Error('Network unavailable')
  fetchMock.post(endpoint, { throws: error })
  await expect(fetchReceipt(args(code))).rejects.toBe(error)
})

test('[model] rejects an unexpected successful payload', async () => {
  fetchMock.post(endpoint, { body: {} })
  await expect(fetchReceipt(args(code))).rejects.toThrow()
})

// Unsupported scan formats must stop before any network request.
test('[model] rejects unsupported scan formats without a request', async () => {
  await expect(fetchReceipt({ ...args(code), code: { format: 'ean' as 'qr', value: code } })).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})
