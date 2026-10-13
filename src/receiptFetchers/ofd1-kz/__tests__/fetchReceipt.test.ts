import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: false })
afterEach(() => { fetchMock.restore() })

test('a recognized absence page means not found', async () => {
  const code = 'https://ofd1.kz/t/?i=1009359893420&f=010101710160&s=6579.0&t=20230509T153806'
  fetchMock.get(code, { body: '<h1>Чек не найден</h1>' })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'notFound' })
})
