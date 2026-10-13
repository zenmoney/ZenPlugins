import { cloneDeep, set } from 'lodash'
import fixture1 from './convertReceipt-01.json'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-05-04',
      time: '16:46:21'
    },
    currency: 'BYN',
    totalAmount: '43.76',
    merchant: {
      name: 'Ресторан быстрого обслуживания " Додо пицца", ООО " Пицца Стар", г. Минск, ул. Романовская Слобода, 8',
      address: 'г. Минск УЛ. РОМАНОВСКАЯ СЛОБОДА, 8',
      identifiers: [
        {
          value: '192454509',
          countryCode: 'BY'
        }
      ]
    },
    items: [
      {
        name: '1559142911',
        quantity: '1',
        unitPrice: '33.9',
        totalAmount: '33.9'
      },
      {
        name: '2001322528',
        quantity: '1',
        unitPrice: '5.9',
        totalAmount: '5.9'
      },
      {
        name: '804984148',
        quantity: '1',
        unitPrice: '2.9',
        totalAmount: '2.9'
      },
      {
        name: '257980352',
        quantity: '1',
        unitPrice: '1.06',
        totalAmount: '1.06'
      }
    ],
    operation: 'sale',
    id: 'DC1591A3BBD7810E0717E0D3',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'cashless',
        amount: '43.76'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})

// Retained synthetic arithmetic regression; not evidence of a captured provider response.
test('[model] line totals yield only exact unit prices and preserve zero payments', () => {
  const data: unknown = cloneDeep(fixture1)
  assert(data != null && typeof data === 'object', 'Expected fixture object')
  set(data, 'doc.items', [{ code: { code: 'Item' }, count: '2', sum: '9.90' }])
  set(data, 'doc.cash', 0)
  set(data, 'doc.cashless', '9.90')
  set(data, 'doc.total_to_pay', '9.90')
  const receipt = convertReceipt(data)
  expect(receipt.items).toEqual([{ name: 'Item', quantity: '2', unitPrice: '4.95', totalAmount: '9.9' }])
  expect(receipt.payments).toEqual([{ method: 'cash', amount: '0' }, { method: 'cashless', amount: '9.9' }])
  set(data, 'doc.items[0].count', '3')
  set(data, 'doc.items[0].sum', '1')
  expect(convertReceipt(data).items[0]).not.toHaveProperty('unitPrice')
})
