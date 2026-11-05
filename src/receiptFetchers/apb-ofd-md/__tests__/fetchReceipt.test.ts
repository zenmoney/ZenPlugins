import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import source1 from './convertReceipt-01.html'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'en' } }); fetchMock.catch(() => { throw new Error('Unexpected receipt request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Complete observed response, captured 2026-11-05; receipts.csv row 1173.
test('retrieves and converts observed route 1 in the background', async () => {
  const code = 'https://ofd.apb.online/Ofd/check?fiscal_code=000086460031&timestamp=31.07.2026%2021:34:05&type=check&amount=107063&currency=000&sign=cash_in'
  fetchMock.get('https://ofd.apb.online/Ofd/check?fiscal_code=000086460031&timestamp=31.07.2026%2021:34:05&type=check&amount=107063&currency=000&sign=cash_in', { body: source1 })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source1) })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  expect(ZenMoney.locale).toBe('ru')
})

// Model input and transport invariants: never send unsupported input or conceal an original failure.
test('[model] unsupported host makes no request', async () => {
  await expect(fetchReceipt(args('https://other.invalid/?next=' + encodeURIComponent('https://ofd.apb.online/Ofd/check?fiscal_code=000086460031&timestamp=31.07.2026%2021:34:05&type=check&amount=107063&currency=000&sign=cash_in')))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

test('[model] original transport failures propagate', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get('https://ofd.apb.online/Ofd/check?fiscal_code=000086460031&timestamp=31.07.2026%2021:34:05&type=check&amount=107063&currency=000&sign=cash_in', { throws: failure })
  await expect(fetchReceipt(args('https://ofd.apb.online/Ofd/check?fiscal_code=000086460031&timestamp=31.07.2026%2021:34:05&type=check&amount=107063&currency=000&sign=cash_in'))).rejects.toBe(failure)
})

test('[model] receipt bodies and response cookies are absent from emitted diagnostics', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get('https://ofd.apb.online/Ofd/check?fiscal_code=000086460031&timestamp=31.07.2026%2021:34:05&type=check&amount=107063&currency=000&sign=cash_in', { body: source1, headers: { 'Set-Cookie': 'session=synthetic-secret' } })
  await fetchReceipt(args('https://ofd.apb.online/Ofd/check?fiscal_code=000086460031&timestamp=31.07.2026%2021:34:05&type=check&amount=107063&currency=000&sign=cash_in'))
  expect(debug).not.toHaveBeenCalled()
})
