import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import source1 from './convertReceipt-01.html'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'en' } }); fetchMock.catch(() => { throw new Error('Unexpected receipt request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Complete observed response, captured 2026-11-05; receipts.csv row 1483.
test('retrieves and converts observed route 1 in the background', async () => {
  const code = 'https://receipt.kaspi.kz/web/fiscal?i=005819786639&f=600904304944&s=9930.0&t=2026-10-07%2013%3A51%3A06.954000'
  fetchMock.get('https://receipt.kaspi.kz/web/fiscal?i=005819786639&f=600904304944&s=9930.0&t=2026-10-07%2013%3A51%3A06.954000', { body: source1 })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source1) })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  expect(ZenMoney.locale).toBe('ru')
})

// Model input and transport invariants: never send unsupported input or conceal an original failure.
test('[model] unsupported host makes no request', async () => {
  await expect(fetchReceipt(args('https://other.invalid/?next=' + encodeURIComponent('https://receipt.kaspi.kz/web/fiscal?i=005819786639&f=600904304944&s=9930.0&t=2026-10-07%2013%3A51%3A06.954000')))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

test('[model] original transport failures propagate', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get('https://receipt.kaspi.kz/web/fiscal?i=005819786639&f=600904304944&s=9930.0&t=2026-10-07%2013%3A51%3A06.954000', { throws: failure })
  await expect(fetchReceipt(args('https://receipt.kaspi.kz/web/fiscal?i=005819786639&f=600904304944&s=9930.0&t=2026-10-07%2013%3A51%3A06.954000'))).rejects.toBe(failure)
})
