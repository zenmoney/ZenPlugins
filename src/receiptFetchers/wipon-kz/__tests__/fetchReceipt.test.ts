import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import source1 from './convertReceipt-01.html'
import source2 from './convertReceipt-02.html'
import source3 from './convertReceipt-03.html'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'en' } }); fetchMock.catch(() => { throw new Error('Unexpected receipt request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Complete observed response, captured 2026-11-05; receipts.csv row 135.
test('retrieves and converts observed route 1 in the background', async () => {
  const code = 'https://api.kassa.wipon.kz/links/check/019fb922-8981-7073-b102-13925e7ae14a'
  fetchMock.get('https://api.kassa.wipon.kz/links/check/019fb922-8981-7073-b102-13925e7ae14a', { body: source1 })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source1) })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  expect(ZenMoney.locale).toBe('ru')
})

// Complete observed response, captured 2026-11-05; receipts.csv row 140.
test('retrieves and converts observed route 2 in the background', async () => {
  const code = 'https://api.wipon.kz/v2/sale/325403906/check'
  fetchMock.get('https://api.wipon.kz/v2/sale/325403906/check', { body: source2 })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source2) })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  expect(ZenMoney.locale).toBe('ru')
})

// Complete observed response, captured 2026-11-05; receipts.csv row 1167.
test('retrieves and converts observed route 3 in the background', async () => {
  const code = 'https://nurkassa.kz/consumer/check?i=2005534015&f=010101994981&s=14560.00&t=20260717T202232'
  fetchMock.get('https://nurkassa.kz/consumer/check?i=2005534015&f=010101994981&s=14560.00&t=20260717T202232', { body: source3 })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source3) })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  expect(ZenMoney.locale).toBe('ru')
})

// Model input and transport invariants: never send unsupported input or conceal an original failure.
test('[model] unsupported host makes no request', async () => {
  await expect(fetchReceipt(args('https://other.invalid/?next=' + encodeURIComponent('https://api.kassa.wipon.kz/links/check/019fb922-8981-7073-b102-13925e7ae14a')))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

test('[model] original transport failures propagate', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get('https://api.kassa.wipon.kz/links/check/019fb922-8981-7073-b102-13925e7ae14a', { throws: failure })
  await expect(fetchReceipt(args('https://api.kassa.wipon.kz/links/check/019fb922-8981-7073-b102-13925e7ae14a'))).rejects.toBe(failure)
})

test('[model] receipt bodies and response cookies are absent from emitted diagnostics', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get('https://api.kassa.wipon.kz/links/check/019fb922-8981-7073-b102-13925e7ae14a', { body: source1, headers: { 'Set-Cookie': 'session=synthetic-secret' } })
  await fetchReceipt(args('https://api.kassa.wipon.kz/links/check/019fb922-8981-7073-b102-13925e7ae14a'))
  expect(debug).not.toHaveBeenCalled()
})
