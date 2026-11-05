import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import source1 from './convertReceipt-01.html'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'en' } }); fetchMock.catch(() => { throw new Error('Unexpected receipt request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Complete observed response, captured 2026-11-05; receipts.csv row 543.
test('retrieves and converts observed route 1 in the background', async () => {
  const code = 'https://einvoice.s1ecos.gr/v/EL094352564-129092730-915A1D9301C57B4F75B5062F9B4A7F288B341ED9-71DC856659A04C399FFAA087AEECE001'
  fetchMock.get('https://einvoice.s1ecos.gr/v/EL094352564-129092730-915A1D9301C57B4F75B5062F9B4A7F288B341ED9-71DC856659A04C399FFAA087AEECE001', { body: source1 })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source1) })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  expect(ZenMoney.locale).toBe('el')
})

// Model input and transport invariants: never send unsupported input or conceal an original failure.
test('[model] unsupported host makes no request', async () => {
  await expect(fetchReceipt(args('https://other.invalid/?next=' + encodeURIComponent('https://einvoice.s1ecos.gr/v/EL094352564-129092730-915A1D9301C57B4F75B5062F9B4A7F288B341ED9-71DC856659A04C399FFAA087AEECE001')))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

test('[model] original transport failures propagate', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get('https://einvoice.s1ecos.gr/v/EL094352564-129092730-915A1D9301C57B4F75B5062F9B4A7F288B341ED9-71DC856659A04C399FFAA087AEECE001', { throws: failure })
  await expect(fetchReceipt(args('https://einvoice.s1ecos.gr/v/EL094352564-129092730-915A1D9301C57B4F75B5062F9B4A7F288B341ED9-71DC856659A04C399FFAA087AEECE001'))).rejects.toBe(failure)
})

test('[model] receipt bodies and response cookies are absent from emitted diagnostics', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get('https://einvoice.s1ecos.gr/v/EL094352564-129092730-915A1D9301C57B4F75B5062F9B4A7F288B341ED9-71DC856659A04C399FFAA087AEECE001', { body: source1, headers: { 'Set-Cookie': 'session=synthetic-secret' } })
  await fetchReceipt(args('https://einvoice.s1ecos.gr/v/EL094352564-129092730-915A1D9301C57B4F75B5062F9B4A7F288B341ED9-71DC856659A04C399FFAA087AEECE001'))
  expect(debug).not.toHaveBeenCalled()
})
