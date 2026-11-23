import fs from 'fs'
import path from 'path'
import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import text from './convertReceipt-01.json'
import missingReceipt from './fetchReceipt-01.json'

const code = { format: 'qr' as const, value: 'https://webkassa.by/p?uid=8BC7ECF87B3595650D0E1DE1' }
const endpoint = 'https://webkassa.by/rsCashAppsWeb/noauth/files/print-forms/checks/8BC7ECF87B3595650D0E1DE1'
beforeEach(() => {
  // fetch-mock v5 defaults to a Response without arrayBuffer; use the host binary-response API.
  (fetchMock as typeof fetchMock & { setImplementations: (implementations: { Response: typeof Response }) => void }).setImplementations({ Response })
  Object.assign(globalThis, { ZenMoney: { locale: 'ru', features: { binaryResponseBody: true } } }); fetchMock.catch(() => { throw new Error('Unexpected receipt request') })
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// The unmodified public PDF (2026-11-05, receipts.csv row 1917) exercises the actual runtime parser.
// The JSON fixture preserves the complete extracted text, including the terminal/loyalty sections.
test.each([code.value, code.value.toLowerCase()])('retrieves the original PDF and converts all source lines in the background: %s', async value => {
  fetchMock.get(endpoint, new Response(new Uint8Array(fs.readFileSync(path.join(__dirname, 'convertReceipt-01.pdf'))), { headers: { 'Content-Type': 'application/pdf', 'Set-Cookie': 'session=synthetic-secret' } }))
  await expect(fetchReceipt({ code: { ...code, value }, isInBackground: true })).resolves.toEqual({ status: 'found', receipt: convertReceipt(text) })
})

// The anonymized public PDF preserves the provider's complete retail layout and
// amount separators. The identifying fields and monetary values are fictional.
test('converts a retail PDF with grouped amounts and a full timestamp', async () => {
  const id = '0123456789ABCDEF3B8B8BA7'
  const pdf = new Uint8Array(fs.readFileSync(path.join(__dirname, 'fetchReceipt-02.pdf')))
  fetchMock.get(`https://webkassa.by/rsCashAppsWeb/noauth/files/print-forms/checks/${id}`, new Response(pdf, {
    headers: { 'Content-Type': 'application/octet-stream' }
  }))
  await expect(fetchReceipt({
    code: { format: 'qr', value: `https://webkassa.by/p?uid=${id}` },
    isInBackground: true
  })).resolves.toEqual({
    status: 'found',
    receipt: {
      completeness: 'full',
      currency: 'BYN',
      operation: 'unknown',
      id,
      issuedAt: { date: '2025-02-03', time: '12:34:56' },
      totalAmount: '2500',
      merchant: {
        name: 'ООО "ПРИМЕР"',
        address: '220000 Г. МИНСК, УЛ. ПРИМЕРНАЯ, Д. 10,',
        identifiers: [{ value: '999000111', countryCode: 'BY', scheme: 'UNP' }]
      },
      items: [{ name: 'Позиция 1', quantity: '2', unitPrice: '1250', totalAmount: '2500' }],
      payments: [{ method: 'card', amount: '2500' }]
    }
  })
})

// Public print endpoint response for the all-zero UID, including its HTTP 500 status.
test('recognizes the confirmed missing-record response', async () => {
  const id = '000000000000000000000000'
  fetchMock.get(`https://webkassa.by/rsCashAppsWeb/noauth/files/print-forms/checks/${id}`, new Response(JSON.stringify(missingReceipt), {
    status: 500,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  }))
  await expect(fetchReceipt({
    code: { format: 'qr', value: `https://webkassa.by/p?uid=${id}` },
    isInBackground: true
  })).resolves.toEqual({ status: 'notFound' })
})

// Model transport invariant: propagate the original failure before parsing or prompting.
test('[model] original PDF request failure propagates', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get(endpoint, { throws: failure })
  await expect(fetchReceipt({ code, isInBackground: true })).rejects.toBe(failure)
})
