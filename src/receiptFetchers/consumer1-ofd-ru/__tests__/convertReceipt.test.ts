import fixture1 from './convertReceipt-01.json'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1, 'https://consumer.1-ofd.ru/ticket?t=20230625T1601&s=126.75&fn=7281440500752587&i=235236&fp=2315559729&n=1')).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-06-25',
      time: '16:01'
    },
    currency: 'RUB',
    totalAmount: '126.75',
    merchant: {
      name: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЛИТРЕС"',
      address: '109316, г Москва, пр-кт Волгоградский 42/9',
      identifiers: [
        {
          value: '7719571260',
          countryCode: 'RU',
          scheme: 'INN'
        }
      ]
    },
    items: [
      {
        name: 'Эл. книга 1984, Джордж Оруэлл',
        quantity: '1',
        unitPrice: '126.75',
        totalAmount: '126.75'
      }
    ],
    operation: 'refund',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'cashless',
        amount: '126.75'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null, 'https://consumer.1-ofd.ru/ticket?t=20230625T1601&s=126.75&fn=7281440500752587&i=235236&fp=2315559729&n=1')).toThrow()
})
