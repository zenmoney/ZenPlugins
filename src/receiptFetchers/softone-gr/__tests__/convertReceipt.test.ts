import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.html'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 543.
// The adjacent fixture preserves the entire observed provider response.
test('keeps commercial and fiscal sections from duplicating the same products', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'EUR',
    operation: 'sale',
    issuedAt: {
      date: '2026-06-04',
      time: '13:30'
    },
    totalAmount: '40.05',
    merchant: {
      name: 'ITX ΕΛΛΑΣ ΜΟΝΟΠΡΟΣΩΠΗ Α.Ε.',
      address: 'ΛΕΩΦΟΡΟΣ ΒΟΥΛΙΑΓΜΕΝΗΣ 276',
      identifiers: [
        {
          value: 'EL094352564',
          countryCode: 'GR',
          scheme: 'VAT'
        }
      ]
    },
    items: [
      {
        name: 'ΥΠΟΔΗΜΑΤΑ',
        quantity: '1',
        unitPrice: '39.95',
        totalAmount: '39.95',
        unit: 'TMX',
        originalUnitPrice: '39.95',
        originalTotalAmount: '39.95',
        adjustments: [
          {
            kind: 'tax',
            name: 'ΦΠΑ',
            amount: '7.73',
            baseAmount: '32.22',
            percent: '24'
          }
        ]
      },
      {
        name: 'Σακούλα Μ',
        quantity: '1',
        unitPrice: '0.1',
        totalAmount: '0.1',
        unit: 'TMX',
        originalUnitPrice: '0.1',
        originalTotalAmount: '0.1',
        adjustments: [
          {
            kind: 'tax',
            name: 'ΦΠΑ',
            amount: '0.02',
            baseAmount: '0.08',
            percent: '24'
          }
        ]
      }
    ],
    id: '5C90FCFB2743CC800E1DAE5EF3AD92DF76F73B27',
    payments: [
      {
        method: 'card',
        amount: '40.05'
      }
    ]
  })
})
