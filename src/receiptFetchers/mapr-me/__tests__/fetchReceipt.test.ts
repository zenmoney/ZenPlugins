import fetchMock from 'fetch-mock'
import fixture from './convertReceipt-01.json'
import { fetchReceipt } from '../index'

const code = 'https://mapr.tax.gov.me/ic/#/verify?iic=fixture&crtd=2023-06-01T12:00:00&tin=70000001'
const endpoint = 'https://mapr.tax.gov.me/ic/api/verifyInvoice'
const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: false })
afterEach(() => { fetchMock.restore() })

test('encodes verification parameters as form data', async () => {
  fetchMock.post(endpoint, { body: JSON.stringify(fixture) })
  await expect(fetchReceipt(args(code))).resolves.toMatchObject({ status: 'found', receipt: { currency: 'EUR', totalAmount: '123.09' } })
  const options = fetchMock.lastOptions(endpoint)
  assert(options != null && typeof options.body === 'string', 'Expected request body')
  expect(options.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' })
  expect(Object.fromEntries(new URLSearchParams(options.body))).toEqual({ iic: 'fixture', dateTimeCreated: '2023-06-01T12:00:00', tin: '70000001' })
})

test('an empty verification response means not found', async () => {
  fetchMock.post(endpoint, { status: 200, body: '' })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'notFound' })
})
