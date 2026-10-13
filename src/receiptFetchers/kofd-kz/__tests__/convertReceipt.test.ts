import fixture1 from './convertReceipt-01.json'
import fixture2 from './convertReceipt-02.json'
import fixture3 from './convertReceipt-03.json'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1, 'https://cabinet.kofd.kz/consumer/?i=727064057371&f=010101779476&s=1484.00&t=20220920T101117')).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2022-09-20',
      time: '10:11:17'
    },
    currency: 'KZT',
    totalAmount: '1484',
    merchant: {
      name: 'ТОО "RIN MART"',
      identifiers: [
        {
          value: '201140012912',
          countryCode: 'KZ'
        }
      ]
    },
    items: [
      {
        name: 'Молоко MilkoBo 6% пастер.TFA 0.9л.',
        quantity: '1',
        unitPrice: '369',
        totalAmount: '369'
      },
      {
        name: 'Хлеб отрубной',
        quantity: '1',
        unitPrice: '125',
        totalAmount: '125'
      },
      {
        name: 'Яйцо 1 категории 1*10 шт.(ХМКК)',
        quantity: '1',
        unitPrice: '495',
        totalAmount: '495'
      },
      {
        name: 'Яйцо 1 категории 1*10 шт.(ХМКК)',
        quantity: '1',
        unitPrice: '495',
        totalAmount: '495'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '1484'
      }
    ]
  })
})

test('converts source case 02', () => {
  expect(convertReceipt(fixture2, 'https://cabinet.kofd.kz/consumer/?i=728541289911&f=010101292131&s=948010.00&t=20221007T123957')).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2022-10-07',
      time: '12:39:57'
    },
    currency: 'KZT',
    totalAmount: '948010',
    merchant: {
      name: 'ТОО "DFB CONSTRUCTION AND TOURISM" (ДФБ КОНСТРАКШН ЭНД ТУРИЗМ)',
      identifiers: [
        {
          value: '051240004724',
          countryCode: 'KZ'
        }
      ]
    },
    items: [
      {
        name: 'Отменой операции',
        quantity: '1',
        unitPrice: '948010',
        totalAmount: '948010'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '948010'
      }
    ]
  })
})

test('converts source case 03', () => {
  expect(convertReceipt(fixture3, 'http://consumer.kofd.kz/?i=728573907472&f=010101116181&s=4300.00&t=20221007T214634')).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2022-10-07',
      time: '21:46:34'
    },
    currency: 'KZT',
    totalAmount: '4300',
    merchant: {
      name: 'ТОО "QSR"',
      identifiers: [
        {
          value: '110640022629',
          countryCode: 'KZ'
        }
      ]
    },
    items: [
      {
        name: 'Обед Лонг Чикен',
        quantity: '2',
        unitPrice: '0',
        totalAmount: '0'
      },
      {
        name: 'Лонг Чикен',
        quantity: '2',
        unitPrice: '1450',
        totalAmount: '2900'
      },
      {
        name: 'Кинг-фри станд',
        quantity: '2',
        unitPrice: '450',
        totalAmount: '900'
      },
      {
        name: 'Кола станд.',
        quantity: '2',
        unitPrice: '250',
        totalAmount: '500'
      },
      {
        name: 'Без льда',
        quantity: '2',
        unitPrice: '0',
        totalAmount: '0'
      },
      {
        name: 'Соус Сырный',
        quantity: '1',
        unitPrice: '0',
        totalAmount: '0'
      },
      {
        name: 'Кетчуп',
        quantity: '1',
        unitPrice: '0',
        totalAmount: '0'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '4300'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null, 'https://cabinet.kofd.kz/consumer/?i=727064057371&f=010101779476&s=1484.00&t=20220920T101117')).toThrow()
})
