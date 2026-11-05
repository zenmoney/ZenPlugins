import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.html'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1899.
// The adjacent fixture preserves the entire observed provider response.
test('distinguishes the net quote from the final tax-inclusive amount', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'EUR',
    operation: 'sale',
    issuedAt: {
      date: '2026-09-24',
      time: '18:02'
    },
    totalAmount: '8.79',
    merchant: {
      name: 'ΣΤΑΘΟΠΟΥΛΟΣ ΑΝΤΩΝΗΣ',
      identifiers: [
        {
          value: '110896150',
          countryCode: 'GR',
          scheme: 'VAT'
        }
      ]
    },
    items: [
      {
        name: 'TRAVOCORT CREAM (1+0,1)% TUBx30G',
        quantity: '1',
        unitPrice: '8.79',
        totalAmount: '8.79',
        unit: 'EA',
        originalUnitPrice: '8.29',
        originalTotalAmount: '8.29',
        adjustments: [
          {
            kind: 'surcharge',
            amount: '0'
          },
          {
            kind: 'discount',
            amount: '0'
          },
          {
            kind: 'tax',
            name: 'ΦΠΑ',
            amount: '0.5',
            baseAmount: '8.29',
            percent: '6'
          }
        ]
      }
    ],
    id: '7F8F481E7EED2FF7002CEF7014939A1AE495A4FA',
    payments: [
      {
        method: 'cash',
        amount: '8.79'
      }
    ]
  })
})
