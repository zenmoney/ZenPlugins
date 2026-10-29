import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import gate from './fetchReceipt-01.html'
import fragment from './convertReceipt-05.html'
import legacy from './convertReceipt-01.html'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: false })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

const code = 'https://ofd1.kz/t?i=3193862841&f=600404766365&s=1081.0&t=20260911T172200'
const fragmentUrl = code + '&fragment=1&captcha_skip=1'

// The complete initial page and fragment were captured from the same public lookup on 2026-10-25.
// fetchReceipt-01.html supplies the site's requestTicket(null, true) fallback protocol.
test.each([false, true])('retrieves the current receipt after the verification page (background=%s)', async isInBackground => {
  const debug = jest.spyOn(console, 'debug')
  fetchMock.getOnce(code, { body: gate })
  fetchMock.getOnce(fragmentUrl, { body: fragment })
  await expect(fetchReceipt({ ...args(code), isInBackground })).resolves.toEqual({
    status: 'found',
    receipt: {
      completeness: 'full',
      issuedAt: { date: '2026-09-11', time: '17:22:00' },
      currency: 'KZT',
      totalAmount: '1081',
      operation: 'unknown',
      merchant: {
        name: 'Товарищество с ограниченной ответственностью "ОЗОН Маркетплейс Казахстан"',
        identifiers: [{ value: '211040009534', countryCode: 'KZ' }]
      },
      items: [{
        name: 'Ароматизатор для автомобиля Новая машина, вонючка пахучка в машину, освежитель воздуха для автомобиля, автопарфюм',
        quantity: '1',
        unitPrice: '1081',
        totalAmount: '1081'
      }],
      payments: [{ method: 'card', amount: '1081' }]
    }
  })
  expect(fetchMock.calls(code)).toHaveLength(1)
  expect(fetchMock.calls(fragmentUrl)).toHaveLength(1)
  expect(fetchMock.lastOptions()?.headers).toMatchObject({ 'X-Requested-With': 'XMLHttpRequest' })
  expect(debug).not.toHaveBeenCalled()
})

test('legacy receipt pages need only the original request', async () => {
  const legacyCode = 'https://ofd1.kz/t/?i=1009359893420&f=010101710160&s=6579.0&t=20230509T153806'
  fetchMock.getOnce(legacyCode, { body: legacy })
  await expect(fetchReceipt(args(legacyCode))).resolves.toMatchObject({ status: 'found', receipt: { totalAmount: '6579', items: expect.any(Array) } })
  expect(fetchMock.calls(legacyCode)).toHaveLength(1)
  expect(fetchMock.done()).toBe(true)
})

test('a recognized absence page means not found', async () => {
  const code = 'https://ofd1.kz/t/?i=1009359893420&f=010101710160&s=6579.0&t=20230509T153806'
  fetchMock.get(code, { body: '<h1>Чек не найден</h1>' })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'notFound' })
})

// Either transport stage must preserve the original failure without another attempt.
test.each(['initial', 'fragment'])('[model] propagates the original %s request error', async stage => {
  const error = new Error('Network unavailable')
  if (stage === 'fragment') fetchMock.getOnce(code, { body: gate })
  fetchMock.getOnce(stage === 'initial' ? code : fragmentUrl, { throws: error })
  await expect(fetchReceipt(args(code))).rejects.toBe(error)
  expect(fetchMock.calls(code)).toHaveLength(1)
})

// A failed fallback is not an absent receipt and must not become partial success.
test('[model] rejects an unsuccessful fragment HTTP response', async () => {
  fetchMock.getOnce(code, { body: gate })
  fetchMock.getOnce(fragmentUrl, { status: 503, body: '' })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Unexpected receipt HTTP status')
})

// The verification-page recovery is bounded to one fragment request, including a repeated gate.
test('[model] rejects a repeated verification page without looping', async () => {
  fetchMock.getOnce(code, { body: gate })
  fetchMock.getOnce(fragmentUrl, { body: gate })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Receipt verification did not return a receipt')
  expect(fetchMock.calls(code)).toHaveLength(1)
  expect(fetchMock.calls(fragmentUrl)).toHaveLength(1)
})

// Empty data is always an error, independently of the provider's format.
test('[model] rejects an empty fragment response', async () => {
  fetchMock.getOnce(code, { body: gate })
  fetchMock.getOnce(fragmentUrl, { status: 200, body: '' })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Empty receipt page')
})

// Rebuild query flags deterministically and exclude browser-only fragments from HTTP URLs.
test('[model] replaces fragment flags without carrying over a URL fragment', async () => {
  const input = code + '&fragment=0&captcha_skip=0#receipt'
  fetchMock.getOnce(input, { body: gate })
  fetchMock.getOnce(fragmentUrl, { body: fragment })
  await expect(fetchReceipt(args(input))).resolves.toMatchObject({ status: 'found', receipt: { totalAmount: '1081' } })
  expect(fetchMock.calls(fragmentUrl)).toHaveLength(1)
})

// Unsupported hosts and formats must stop before any request, including lookalike domains.
test.each(['https://other.example/?url=ofd1.kz', code.replace('ofd1.kz', 'ofd1.kz.other.example')])('[model] rejects unrelated targets: %s', async value => {
  await expect(fetchReceipt(args(value))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})
