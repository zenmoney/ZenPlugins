import { cloneDeep, set } from 'lodash'
import fixture1 from './convertReceipt-01.json'
import { convertReceipt } from '../converters'

// Complete existing OOFD response: ticket 531282_10602, foundDate 2021-05-06.
// The separate discount row and its modifiers repeat one document-level effect.
test('preserves the document discount once and the applied card payment', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-03-03',
      time: '13:25:01.000'
    },
    currency: 'KZT',
    totalAmount: '5766',
    merchant: {
      name: "ТОВАРИЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ 'MONАMIE.KZ'",
      address: 'г. Нур-Султан, р-он Алматы, Республики 8',
      identifiers: [
        {
          value: '140340008559',
          countryCode: 'KZ',
          scheme: 'IIN/BIN'
        }
      ]
    },
    items: [
      {
        name: 'Позиция',
        quantity: '1',
        unitPrice: '9610',
        totalAmount: '9610'
      }
    ],
    adjustments: [{ kind: 'discount', name: 'Скидка', amount: '-3844' }],
    payments: [{ method: 'card', amount: '5766' }],
    operation: 'unknown'
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})

// Retained synthetic optional-value regression; not provider-format evidence.
test('[model] unknown unit prices stay omitted and explicit zero is preserved', () => {
  const data: unknown = cloneDeep(fixture1)
  assert(data != null && typeof data === 'object', 'Expected fixture object')
  for (const missing of [undefined, null]) {
    set(data, 'ticket.items[0].commodity.price', missing)
    expect(convertReceipt(data).items[0]).not.toHaveProperty('unitPrice')
  }
  set(data, 'ticket.items[0].commodity.price', 0)
  expect(convertReceipt(data).items[0].unitPrice).toBe('0')
})
