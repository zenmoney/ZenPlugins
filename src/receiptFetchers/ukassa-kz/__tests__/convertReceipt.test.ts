import fixture from './convertReceipt-01.json'
import { convertReceipt } from '../converters'
import { getArray } from '../../../types/get'

// Captured 2026-10-25 from POST https://ukassa.kz/api/operation/get_client_check/
// with { id: '290575609', fiscal_number: '3193862841', kod_kgd: 'UK00010034' }.
// The source QR in the supplied Ozon PDF has no URL scheme. The public response is complete.
// Further source evidence is needed for refunds, discounts, added VAT, cash/change and settlement stages.
const expectedReceipt = {
  completeness: 'full',
  id: '290575609',
  operation: 'sale',
  currency: 'KZT',
  issuedAt: { date: '2026-09-11', time: '17:22' },
  totalAmount: '1081',
  merchant: {
    name: "ТОО 'ОЗОН МАРКЕТПЛЕЙС КАЗАХСТАН'",
    address: 'Республика Казахстан, г. Алматы, р-н Бостандыкский пр. Аль-Фараби, д. 77/7',
    identifiers: [{ value: '211040009534', countryCode: 'KZ' }]
  },
  items: [{
    name: 'Ароматизатор для автомобиля Новая машина, вонючка пахучка в машину, освежитель воздуха для автомобиля, автопарфюм',
    quantity: '1',
    unit: 'шт',
    originalUnitPrice: '1081',
    originalTotalAmount: '1081',
    unitPrice: '1081',
    totalAmount: '1081'
  }],
  payments: [{ method: 'card', name: 'Банковская карта', amount: '1081' }]
}

test('converts the complete Ozon receipt without inventing seconds or VAT from the inactive rate', () => {
  expect(convertReceipt(fixture)).toEqual(expectedReceipt)
})

// Required source fields must fail visibly instead of producing partial goods or inferred values.
test.each(['transaction_items', 'total_amount', 'created_at'])('[model] rejects a missing required %s', field => {
  const malformed = { ...fixture as Record<string, unknown>, [field]: undefined }
  expect(() => convertReceipt(malformed)).toThrow()
})

// An unknown row must stop the entire conversion even when an earlier row is valid.
test('[model] rejects an unparseable item after a valid item', () => {
  expect(() => convertReceipt({ ...fixture as Record<string, unknown>, transaction_items: [...getArray(fixture, 'transaction_items'), {}] })).toThrow()
})
