import fetchMock from 'fetch-mock'
import fixture from './convertReceipt-01.json'
import { fetchReceipt } from '../index'
import { fetchReceipt as fetchReceiptApi } from '../api'

const code = 'https://cabinet.kofd.kz/consumer/?i=727064057371&f=010101779476&s=1484.00&t=20220920T101117'
const endpoint = 'https://cabinet.kofd.kz/api/tickets?registrationNumber=010101779476&ticketNumber=727064057371&ticketDate=2022-09-20'
const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: false })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

test('returns provider data from the lookup without converting the receipt', async () => {
  fetchMock.get(endpoint, { body: { data: { found: 1, ticket: fixture } } })
  await expect(fetchReceiptApi(code)).resolves.toEqual({ status: 'found', data: fixture })
})

test.each([code, code.replace('cabinet.kofd.kz', 'consumer.kofd.kz')])('loads the canonical receipt from either supported host: %s', async value => {
  const debug = jest.spyOn(console, 'debug')
  fetchMock.get(endpoint, { body: { data: { found: 1, ticket: fixture } } })
  const result = await fetchReceipt(args(value))
  expect(result).toMatchObject({ status: 'found', receipt: { currency: 'KZT', totalAmount: '1484' } })
  const logs = JSON.stringify(debug.mock.calls)
  expect(logs).not.toContain(value)
  expect(logs).not.toContain(JSON.stringify(fixture))
})

test('confirmed absence differs from a malformed response', async () => {
  fetchMock.getOnce(endpoint, { body: { data: { found: 0 } } })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'notFound' })
  fetchMock.restore()
  fetchMock.getOnce(endpoint, { body: {} })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Unexpected KOFD response')
})

// The original transport error must pass through the operation unchanged.
test('[model] transport failures remain errors', async () => {
  const failure = new Error('transport unavailable')
  fetchMock.get(endpoint, { throws: failure })
  await expect(fetchReceipt(args(code))).rejects.toBe(failure)
})

test('unrelated codes and unsupported formats do not request a receipt', async () => {
  fetchMock.get(endpoint, { throws: new Error('Unexpected request') })
  await expect(fetchReceipt(args('unsupported-code'))).resolves.toEqual({ status: 'notApplicable' })
  await expect(fetchReceipt({ ...args(code), code: { format: 'ean' as 'qr', value: code } })).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})
