import { cloneDeep, set } from 'lodash'
import fixture1 from './convertReceipt-01.json'
import { convertReceipt } from '../converters'

// TODO: independently verify upstream monetary units; this case preserves source amounts without scaling.
test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-04-09',
      time: '10:59:42',
      utcOffsetMinutes: 0
    },
    currency: 'KGS',
    totalAmount: '85000',
    merchant: {
      name: 'Кондитерский дом Куликовский',
      address: '720021,,г.Бишкек,ул.Ибраимова, д.115/2, 42.87493,74.62031',
      identifiers: [
        {
          value: '01402200710216',
          countryCode: 'KG'
        }
      ]
    },
    items: [
      {
        name: 'Торт-сет "Ассорти" (0,750 кг)',
        quantity: '1',
        unitPrice: '85000',
        totalAmount: '85000'
      }
    ],
    operation: 'unknown',
    id: '0000014679acdc480000000000095187000000000001029affff709c',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'cashless',
        amount: '85000'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})

// Retained synthetic date regression; not evidence of a captured provider response.
test('[model] local midnight and offset are retained when UTC is the previous day', () => {
  const data: unknown = cloneDeep(fixture1)
  assert(data != null && typeof data === 'object', 'Expected fixture object')
  set(data, 'dateTime', '2026-09-17T00:15:00+06:00')
  expect(convertReceipt(data).issuedAt).toEqual({ date: '2026-09-17', time: '00:15:00', utcOffsetMinutes: 360 })
})

// Retained synthetic optional-value regression; not provider-format evidence.
test('[model] unknown unit prices stay omitted and explicit zero is preserved', () => {
  const data: unknown = cloneDeep(fixture1)
  assert(data != null && typeof data === 'object', 'Expected fixture object')
  for (const missing of [undefined, null]) {
    set(data, 'items[0].goodPrice', missing)
    expect(convertReceipt(data).items[0]).not.toHaveProperty('unitPrice')
  }
  set(data, 'items[0].goodPrice', 0)
  expect(convertReceipt(data).items[0].unitPrice).toBe('0')
})
