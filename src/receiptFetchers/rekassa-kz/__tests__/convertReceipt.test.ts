import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.json'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1177.
// JSON retains the complete pdfUtils text; the adjacent PDF is the original document.
test('reads the complete PDF including item-inclusive VAT only once', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: {
      date: '2026-07-20',
      time: '12:54:57'
    },
    totalAmount: '55300',
    merchant: {
      name: 'ТОО Family Clinic',
      address: 'Астана г., Сарыарка р-н, улица Сәкен Сейфуллин, строение 34Б, б/н',
      identifiers: [
        {
          value: '140140001900',
          countryCode: 'KZ',
          scheme: 'IIN/BIN'
        }
      ]
    },
    items: [
      {
        name: 'Позиция',
        quantity: '1',
        unitPrice: '55300',
        totalAmount: '55300',
        unit: 'дн. / шт.',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '2633.33',
            percent: '5'
          }
        ]
      }
    ],
    payments: [
      {
        method: 'cash',
        amount: '55300'
      }
    ]
  })
})
