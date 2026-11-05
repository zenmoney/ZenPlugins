import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.json'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1736.
// The adjacent fixture preserves the entire observed provider response.
test('uses the issue time rather than the trip start and the approved quantity', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'BYN',
    operation: 'sale',
    id: 'B6DB6DBBD01AC7580719AE6A',
    issuedAt: {
      date: '2026-09-20',
      time: '09:17:13'
    },
    totalAmount: '12.1',
    merchant: {
      name: 'Шалыганов Сергей Вячеславович',
      identifiers: [
        {
          value: '193508194',
          countryCode: 'BY',
          scheme: 'UNP'
        }
      ]
    },
    items: [
      {
        name: 'Поездка (заказ через ЭИС)',
        quantity: '1',
        totalAmount: '12.1'
      }
    ],
    payments: [
      {
        method: 'cash',
        amount: '12.1'
      }
    ]
  })
})
