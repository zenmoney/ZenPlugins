import fetchMock from 'fetch-mock'
import fixture from './convertReceipt-01.json'
import { fetchReceipt } from '../index'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: false })
afterEach(() => { fetchMock.restore() })

// Retained lookup variants from the former workflow harness.
test.each(['documentId=fixture-document', 'https://shop.invalid/receipt?documentId=fixture-document'])('documentId works independently of the host: %s', async code => {
  fetchMock.get('https://api.ikassa.by/api/public/document/fixture-document', { body: JSON.stringify(fixture) })
  await expect(fetchReceipt(args(code))).resolves.toMatchObject({ status: 'found', receipt: { currency: 'BYN', totalAmount: '43.76' } })
})
