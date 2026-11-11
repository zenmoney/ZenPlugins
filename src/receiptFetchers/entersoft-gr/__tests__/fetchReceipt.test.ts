import get from '../../../types/get'
import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import page from './convertReceipt-01.html'
import invoice from './convertReceipt-02.html'

const code = 'https://e-invoicing.gr/edocuments/ViewInvoice/-1/71435717-020d-4b12-bf40-e6455d768d5e_42e8l826'
const target = 'https://e-invoicing.gr/api/GetInvoice?contentType=PEPPOL&intRefDocID=71435717-020d-4b12-bf40-e6455d768d5e&hashToken=42e8l826&ofenm=-1&isPreview=True'
const args = { code: { format: 'qr' as const, value: code }, isInBackground: true }
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'el' } }); fetchMock.catch(() => { throw new Error('Unexpected request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Complete observed page and same-origin invoice frame, captured 2026-11-05 (receipts.csv row 547).
test('retrieves the frame without a browser or user interaction', async () => {
  fetchMock.get(code, { body: page })
  fetchMock.get(target, { body: invoice })
  await expect(fetchReceipt(args)).resolves.toEqual({ status: 'found', receipt: convertReceipt(invoice) })
  expect(get(fetchMock.calls(), 'matched')).toHaveLength(2)
})

// A model failure at the second transport boundary must propagate, not return the outer page as a receipt.
test('[model] original frame-loading failure propagates', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get(code, { body: page })
  fetchMock.get(target, { throws: failure })
  await expect(fetchReceipt(args)).rejects.toBe(failure)
})
