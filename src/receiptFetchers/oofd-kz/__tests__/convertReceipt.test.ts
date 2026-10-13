import { cloneDeep, set } from 'lodash'
import fixture1 from './convertReceipt-01.json'
import { convertReceipt } from '../converters'

// TODO: extract the source discount of 3844 and card payment of 5766.
// This expectation currently omits both; goods total 9610 while the document total is 5766.
test('converts source case 01', () => {
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
          countryCode: 'KZ'
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
