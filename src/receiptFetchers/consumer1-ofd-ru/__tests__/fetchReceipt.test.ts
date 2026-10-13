import fetchMock from 'fetch-mock'
import fixture from './convertReceipt-01.json'
import { fetchReceipt } from '../index'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: false })
afterEach(() => { fetchMock.restore() })

test('passes the fiscal query to the receipt endpoint', async () => {
  const query = 't=20230625T1601&s=126.75&fn=7281440500752587&i=235236&fp=2315559729&n=1'
  fetchMock.get('https://consumer.1-ofd.ru/api/tickets/ticket/' + query, { body: JSON.stringify(fixture) })
  await expect(fetchReceipt(args('https://consumer.1-ofd.ru/ticket?' + query))).resolves.toMatchObject({ status: 'found', receipt: { currency: 'RUB', totalAmount: '126.75' } })
})
