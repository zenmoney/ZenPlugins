import fs from 'fs'
import path from 'path'
import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import text from './convertReceipt-01.json'

const code = { format: 'qr' as const, value: 'https://ofd.rekassa.kz/t/?i=262878897043&f=620304526587&s=55300&t=20260720T125457' }
const endpoint = 'https://ofd.rekassa.kz/t/?i=262878897043&f=620304526587&s=55300&t=20260720T125457'
beforeEach(() => {
  // fetch-mock v5 defaults to a Response without arrayBuffer; use the host binary-response API.
  (fetchMock as typeof fetchMock & { setImplementations: (implementations: { Response: typeof Response }) => void }).setImplementations({ Response })
  Object.assign(globalThis, { ZenMoney: { locale: 'ru', features: { binaryResponseBody: true } } }); fetchMock.catch(() => { throw new Error('Unexpected receipt request') })
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// The unmodified public PDF (2026-11-05, receipts.csv row 1177) exercises the actual runtime parser.
// The JSON fixture preserves the complete extracted text, including the terminal/loyalty sections.
test('retrieves the original PDF and converts all source lines in the background', async () => {
  fetchMock.get(endpoint, new Response(new Uint8Array(fs.readFileSync(path.join(__dirname, 'convertReceipt-01.pdf'))), { headers: { 'Content-Type': 'application/pdf', 'Set-Cookie': 'session=synthetic-secret' } }))
  await expect(fetchReceipt({ code, isInBackground: true })).resolves.toEqual({ status: 'found', receipt: convertReceipt(text) })
})

// Model transport invariant: propagate the original failure before parsing or prompting.
test('[model] original PDF request failure propagates', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get(endpoint, { throws: failure })
  await expect(fetchReceipt({ code, isInBackground: true })).rejects.toBe(failure)
})
