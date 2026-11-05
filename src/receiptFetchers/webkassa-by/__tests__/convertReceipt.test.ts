import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.json'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1917.
// JSON retains the complete pdfUtils text; the adjacent PDF is the original document.
test('does not duplicate the terminal slip or bonus accrual as settlement', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'BYN',
    operation: 'sale',
    issuedAt: {
      date: '2026-10-27',
      time: '17:07:22'
    },
    totalAmount: '7.12',
    merchant: {
      name: 'ООО "Санта Ритейл"',
      address: 'г. Витебск, ул.Лазо, 6',
      identifiers: [
        {
          value: '291313486',
          countryCode: 'BY',
          scheme: 'UNP'
        }
      ]
    },
    items: [
      {
        name: 'M Напиток сывороточный Савушкин Свежесть апельси',
        quantity: '1',
        unitPrice: '2.73',
        totalAmount: '2.73'
      },
      {
        name: 'M Молоко сгущенное Глубокое Лакомка варен с саха',
        quantity: '1',
        unitPrice: '4.39',
        totalAmount: '4.39'
      }
    ],
    id: '8BC7ECF87B3595650D0E1DE1',
    payments: [
      {
        method: 'card',
        amount: '7.12'
      }
    ]
  })
})
