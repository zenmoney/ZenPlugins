import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import source1 from './convertReceipt-01.html'
import testReceipt from './fetchReceipt-01.html'
import missingReceipt from './fetchReceipt-02.html'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'en' } }); fetchMock.catch(() => { throw new Error('Unexpected receipt request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Complete observed response, captured 2026-11-05; receipts.csv row 841.
test('retrieves and converts observed route 1 in the background', async () => {
  const code = 'https://kasa.vchasno.ua/c/b8rKhKHlRII?MAC:d8c74ca88cce6c1a9d61007ae4f88c91903c15683cad0174736033d4b5d33ffd;DT:09-11-2024T18:01:35;FR:b8rKhKHlRII;SUM:241,5;FN:4000958329'
  fetchMock.get('https://kasa.vchasno.ua/c/b8rKhKHlRII?MAC:d8c74ca88cce6c1a9d61007ae4f88c91903c15683cad0174736033d4b5d33ffd;DT:09-11-2024T18:01:35;FR:b8rKhKHlRII;SUM:241,5;FN:4000958329', { body: source1 })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source1) })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  expect(ZenMoney.locale).toBe('uk')
})

// Model input and transport invariants: never send unsupported input or conceal an original failure.
test('[model] unsupported host makes no request', async () => {
  await expect(fetchReceipt(args('https://other.invalid/?next=' + encodeURIComponent('https://kasa.vchasno.ua/c/b8rKhKHlRII?MAC:d8c74ca88cce6c1a9d61007ae4f88c91903c15683cad0174736033d4b5d33ffd;DT:09-11-2024T18:01:35;FR:b8rKhKHlRII;SUM:241,5;FN:4000958329')))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

test('[model] original transport failures propagate', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get('https://kasa.vchasno.ua/c/b8rKhKHlRII?MAC:d8c74ca88cce6c1a9d61007ae4f88c91903c15683cad0174736033d4b5d33ffd;DT:09-11-2024T18:01:35;FR:b8rKhKHlRII;SUM:241,5;FN:4000958329', { throws: failure })
  await expect(fetchReceipt(args('https://kasa.vchasno.ua/c/b8rKhKHlRII?MAC:d8c74ca88cce6c1a9d61007ae4f88c91903c15683cad0174736033d4b5d33ffd;DT:09-11-2024T18:01:35;FR:b8rKhKHlRII;SUM:241,5;FN:4000958329'))).rejects.toBe(failure)
})

test('[model] HTTP diagnostics retain public receipt data and mask response cookies', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get('https://kasa.vchasno.ua/c/b8rKhKHlRII?MAC:d8c74ca88cce6c1a9d61007ae4f88c91903c15683cad0174736033d4b5d33ffd;DT:09-11-2024T18:01:35;FR:b8rKhKHlRII;SUM:241,5;FN:4000958329', { body: source1, headers: { 'Set-Cookie': 'session=synthetic-secret' } })
  await fetchReceipt(args('https://kasa.vchasno.ua/c/b8rKhKHlRII?MAC:d8c74ca88cce6c1a9d61007ae4f88c91903c15683cad0174736033d4b5d33ffd;DT:09-11-2024T18:01:35;FR:b8rKhKHlRII;SUM:241,5;FN:4000958329'))
  expect(debug).toHaveBeenCalledWith('request', expect.objectContaining({ method: 'GET', url: expect.stringContaining('https://kasa.vchasno.ua/c/b8rKhKHlRII') }))
  expect(debug).toHaveBeenCalledWith('response', expect.objectContaining({ status: 200, body: expect.stringContaining('Бананваг.'), headers: expect.objectContaining({ 'set-cookie': expect.stringMatching(/^<string\[\d+\]>$/) }) }))
  expect(JSON.stringify(debug.mock.calls)).toContain('43260979XXXX2199')
  expect(JSON.stringify(debug.mock.calls)).not.toContain('synthetic-secret')
})

// Complete public responses captured 2026-11-10: the screenshot's QR and the same
// receipt path with a _missing suffix. Fixtures retain the complete HTML.
test.each([
  ['TEST_gBrOUhU9r4M_Jg?MAC:6823c3c25e5cdd2f90f59f70c2c62cf142734e36b09406497bd550619924c047;DT:02-09-2024T18:25:13;FR:TEST_gBrOUhU9r4M_Jg;SUM:1;FN:3', 200, testReceipt],
  ['TEST_gBrOUhU9r4M_Jg_missing', 404, missingReceipt]
])('reports no fiscal receipt for observed lookup %s', async (id, status, body) => {
  const code = `https://kasa.vchasno.ua/c/${String(id)}`
  fetchMock.get(code, { status, body })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'notFound' })
})

// Model transport invariant: an unknown server failure must remain reportable.
test('[model] unexpected HTTP failure is not reported as an absent receipt', async () => {
  const code = 'https://kasa.vchasno.ua/c/TEST_gBrOUhU9r4M_Jg'
  fetchMock.get(code, { status: 503 })
  await expect(fetchReceipt(args(code))).rejects.toThrow('Unexpected receipt HTTP status')
})
