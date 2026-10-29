import fixture from './convertReceipt-01.html'
import { convertReceipt, convertReceiptData } from '../converters'
import { decodeReceipt, readReceiptEnvelope } from '../protocol'
import get, { getArray } from '../../../types/get'

// Complete public page captured 2026-10-25 from the supplied PDF's QR:
// GET https://buhta.com/receipt/969/01ktnh12paym9nhb03r7k9q50k (web client v541).
// The embedded protobuf preserves more decimal precision than the rendered PDF.
// Refunds, excluded taxes, cash/change, discounts and settlement stages still need source examples.
test('converts the complete source receipt without duplicating the rounded tax summary', () => {
  expect(convertReceipt(fixture)).toEqual({
    completeness: 'full',
    id: '01ktnh12paym9nhb03r7k9q50k',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: { date: '2026-06-09', time: '11:27:28' },
    originalTotalAmount: '577.59',
    totalAmount: '670',
    merchant: {
      name: 'ТОО "Надежный Сервис"',
      address: 'Казахстан, Алматинская обл., г. Алматы, ул. ПРОСПЕКТ АЛЬ-ФАРАБИ, д. 21, кв. (офис) 1069л',
      identifiers: [{ value: '230340005177', countryCode: 'KZ' }]
    },
    items: [{
      name: 'Арендная плата за аренду электросамоката',
      quantity: '1',
      unit: 'усл',
      unitPrice: '670',
      originalTotalAmount: '577.5862',
      totalAmount: '670',
      adjustments: [{ kind: 'tax', name: 'НДС', amount: '92.4138' }]
    }],
    payments: [{ method: 'card', amount: '670' }]
  })
})

function sourceData (): Record<string, unknown> {
  const encoded = get(readReceiptEnvelope(fixture), 'ok')
  assert(typeof encoded === 'string', 'Missing source receipt')
  return decodeReceipt(encoded) as Record<string, unknown>
}

// Required quantities and totals must never be replaced with guesses or omitted products.
test.each(['quantity', 'total', 'price'])('[model] rejects a missing item %s', field => {
  const data = sourceData()
  const item = getArray(data, 'items')[0] as Record<string, unknown>
  data.items = [{ ...item, [field]: undefined }]
  expect(() => convertReceiptData(data, '09.06.2026 11:27:28')).toThrow()
})

// Unknown rows must fail even when an earlier item is valid.
test('[model] rejects a malformed row after valid goods', () => {
  const data = sourceData()
  data.items = [...getArray(data, 'items'), {}]
  expect(() => convertReceiptData(data, '09.06.2026 11:27:28')).toThrow()
})

// Explicit zero is source data and must survive decimal conversion.
test('[model] preserves zero item and document amounts', () => {
  const data = sourceData()
  const item = getArray(data, 'items')[0] as Record<string, unknown>
  data.items = [{ ...item, price: '0', subtotal: '0', total: '0', taxes: [] }]
  data.total = '0'
  data.subtotal = '0'
  data.payments = [{ type: 2, amount: '0' }]
  expect(convertReceiptData(data, '09.06.2026 11:27:28')).toMatchObject({
    totalAmount: '0',
    originalTotalAmount: '0',
    items: [{ quantity: '1', unitPrice: '0', totalAmount: '0', originalTotalAmount: '0' }],
    payments: [{ method: 'card', amount: '0' }]
  })
})

// Corrupt page/protobuf inputs must remain reportable conversion failures.
test.each([null, '', '<html></html>'])('[model] rejects malformed page input %#', input => {
  expect(() => convertReceipt(input)).toThrow()
})

// Unknown currencies must not inherit the plugin's country or the app's default currency.
test('[model] rejects an unrecognized currency', () => {
  expect(() => convertReceiptData({ ...sourceData(), currency: 0 }, '09.06.2026 11:27:28')).toThrow('Unsupported receipt currency')
})

// Invalid encoded data must fail without evaluating scripts or returning a partial receipt.
test('[model] rejects corrupt protobuf data', () => {
  expect(() => convertReceipt(fixture.replace(/"ok":"[^"]+"/, '"ok":"%%%"'))).toThrow('Invalid encoded receipt')
})
