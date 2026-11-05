import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.html'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1129.
// The adjacent fixture preserves the entire observed provider response.
test('uses the approved single-service quantity without inventing a unit quote', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'AMD',
    operation: 'sale',
    issuedAt: {
      date: '2026-07-24',
      time: '00:17:35'
    },
    totalAmount: '2800',
    merchant: {
      name: 'ՄԻՔԱՅԵԼ ԳԱԼՍՏՅԱՆ',
      identifiers: [
        {
          value: '78734058',
          countryCode: 'AM',
          scheme: 'TIN'
        }
      ]
    },
    items: [
      {
        name: 'Տաքսի',
        quantity: '1',
        totalAmount: '2800'
      }
    ],
    id: '26BHCRE4FT71JM',
    payments: [
      {
        method: 'cashless',
        name: 'Անկանխիկ',
        amount: '2800'
      }
    ]
  })
})
