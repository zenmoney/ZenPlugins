import fetchMock from 'fetch-mock'
import get from '../../../types/get'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import redirect from './fetchReceipt-01.json'
import source1 from './convertReceipt-01.json'
import source2 from './convertReceipt-02.json'
import source3 from './convertReceipt-03.json'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'ru' } }); fetchMock.catch(() => { throw new Error('Unexpected request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Observed public route and API response, 2026-11-05; receipts.csv row 330.
test('retrieves domain variant 1 from the canonical ticket API', async () => {
  const code = 'https://cabinet.wofd.kz/consumer?i=50062&f=600904705899&s=7962.00&t=20260816T150214'

  fetchMock.get('https://cabinet.wofd.kz/api/tickets?registrationNumber=600904705899&ticketNumber=50062&ticketDate=2026-08-16', { body: JSON.stringify(source1) })
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source1) })
  expect(debug).not.toHaveBeenCalled()
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
})

// Observed public route and API response, 2026-11-05; receipts.csv row 426.
test('retrieves domain variant 2 from the canonical ticket API', async () => {
  const code = 'https://consumer.wofd.kz?i=1467537925976&f=620504504203&s=4240.00&t=20261103T200341'

  fetchMock.get('https://cabinet.wofd.kz/api/tickets?registrationNumber=620504504203&ticketNumber=1467537925976&ticketDate=2026-11-03', { body: JSON.stringify(source2) })
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source2) })
  expect(debug).not.toHaveBeenCalled()
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
})

// Observed public route and API response, 2026-11-05; receipts.csv row 887.
test('retrieves domain variant 3 from the canonical ticket API', async () => {
  const code = 'https://kpos-sg.kkgroup.cn/shopping_api/backend/webkassa/redirect?order_id=KZKOK904133019245166592'
  fetchMock.get(code, { status: 302, headers: { Location: String(get(redirect, 'location')) }, body: '' })
  fetchMock.get('https://cabinet.wofd.kz/api/tickets?registrationNumber=600804641732&ticketNumber=1430641997894&ticketDate=2026-04-18', { body: JSON.stringify(source3) })
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source3) })
  expect(debug).not.toHaveBeenCalled()
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
})

// Model routing invariant: a general KPOS redirect must not be allowed to select a foreign request target.
test('[model] refuses an unrelated KPOS destination', async () => {
  const code = 'https://kpos-sg.kkgroup.cn/shopping_api/backend/webkassa/redirect?order_id=KZKOK904133019245166592'
  fetchMock.get(code, { status: 302, headers: { Location: 'https://other.invalid/receipt' }, body: '' })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'notApplicable' })
  expect(get(fetchMock.calls(), 'matched')).toHaveLength(1)
})

test('[model] preserves original API failures', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get('https://cabinet.wofd.kz/api/tickets?registrationNumber=600904705899&ticketNumber=50062&ticketDate=2026-08-16', { throws: failure })
  await expect(fetchReceipt(args('https://cabinet.wofd.kz/consumer?i=50062&f=600904705899&s=7962.00&t=20260816T150214'))).rejects.toBe(failure)
})
