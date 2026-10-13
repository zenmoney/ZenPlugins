import fixture1 from './convertReceipt-01.html'
import fixture2 from './convertReceipt-02.html'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-06-26',
      time: '18:35:00'
    },
    currency: 'RUB',
    totalAmount: '299.99',
    merchant: {
      name: 'АО "Тандер"',
      address: 'Краснодарский край, , Краснодар г, , им Петра Метальникова ул, 5, 2,  | 5, 1-ый этаж - магазин "Магнит"',
      identifiers: [
        {
          value: '2310031475',
          countryCode: 'RU',
          scheme: 'INN'
        }
      ]
    },
    items: [
      {
        name: 'Настойка горькая "МЕДОВУХА ГРЕЧИШНАЯ" с ароматом мёда',
        quantity: '1',
        unitPrice: '299.99',
        totalAmount: '299.99'
      }
    ],
    operation: 'unknown'
  })
})

test('converts source case 02', () => {
  expect(convertReceipt(fixture2)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-06-28',
      time: '19:53:07'
    },
    currency: 'RUB',
    totalAmount: '739.8',
    merchant: {
      name: 'ООО "СПАР МИДДЛ ВОЛГА"',
      address: 'Москва Город, , , , Новоясеневский Проспект, 1,,  | этаж 1, часть помещения III',
      identifiers: [
        {
          value: '5258056945',
          countryCode: 'RU',
          scheme: 'INN'
        }
      ]
    },
    items: [
      {
        name: 'Вино выдержанное из региона Хумилья красное сухое "Алаха Крианца Хумилья"',
        quantity: '1',
        unitPrice: '449.9',
        totalAmount: '449.9'
      },
      {
        name: 'Водка "ГРАФ ЛЕДОФФ"',
        quantity: '1',
        unitPrice: '289.9',
        totalAmount: '289.9'
      }
    ],
    operation: 'unknown'
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})
