import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.html'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1173.
// The adjacent fixture preserves the entire observed provider response.
test('maps RUP to PRB without changing the 26 line amounts', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'PRB',
    operation: 'sale',
    issuedAt: {
      date: '2026-07-31',
      time: '21:34:05'
    },
    totalAmount: '1070.63',
    merchant: {
      name: 'ООО «ШЕРИФ» Супермаркет "ШЕРИФ-4"',
      address: 'г.Дубоссары, ул.Дзержинского, 2а'
    },
    items: [
      {
        name: 'Пакет420(95*2)*680 М6 Шериф ПМ',
        quantity: '2',
        unitPrice: '1.8',
        totalAmount: '3.6'
      },
      {
        name: 'Пиво ДОБРОВАР Венское 1,5 ПЭТ',
        quantity: '2',
        unitPrice: '29',
        totalAmount: '58'
      },
      {
        name: 'Мак.изд.МАКФА Спирал-экспр.0,4',
        quantity: '1',
        unitPrice: '14',
        totalAmount: '14'
      },
      {
        name: 'Салат листовой пучок ПМР',
        quantity: '1',
        unitPrice: '11.7',
        totalAmount: '11.7'
      },
      {
        name: 'Сметана СП Брест-Литов.20% 180',
        quantity: '1',
        unitPrice: '15.2',
        totalAmount: '15.2'
      },
      {
        name: 'Сыр VALIO Olterman.б л 17% 250',
        quantity: '1',
        unitPrice: '60',
        totalAmount: '60'
      },
      {
        name: 'Масло сл.VALIO 82% 200гр',
        quantity: '1',
        unitPrice: '50',
        totalAmount: '50'
      },
      {
        name: 'Кофе JACOBS Monarch раст130м у',
        quantity: '1',
        unitPrice: '164',
        totalAmount: '164'
      },
      {
        name: 'Чипсы риф.LAY S креветка 105г',
        quantity: '1',
        unitPrice: '33.3',
        totalAmount: '33.3'
      },
      {
        name: 'Чипсы BON GIOR Хамон 80г',
        quantity: '1',
        unitPrice: '20.9',
        totalAmount: '20.9'
      },
      {
        name: 'Сухарики ФЛИНТ бекон 140г',
        quantity: '1',
        unitPrice: '13.3',
        totalAmount: '13.3'
      },
      {
        name: 'Каша ФрутоНяня мол овсянка 190',
        quantity: '1',
        unitPrice: '45',
        totalAmount: '45'
      },
      {
        name: 'Арахис BIG BOB сол.бастурма 60',
        quantity: '1',
        unitPrice: '10',
        totalAmount: '10'
      },
      {
        name: 'Карт.АКВАФОР A5H',
        quantity: '1',
        unitPrice: '110',
        totalAmount: '110'
      },
      {
        name: 'Мор.ГРАН-ПРИ какао рож.155гр',
        quantity: '1',
        unitPrice: '16.2',
        totalAmount: '16.2'
      },
      {
        name: 'Мор.РУДЬ Пломбир 100% 1кг',
        quantity: '1',
        unitPrice: '60',
        totalAmount: '60'
      },
      {
        name: 'Палочки кукур.МАКДАК Клас.75г',
        quantity: '1',
        unitPrice: '7.6',
        totalAmount: '7.6'
      },
      {
        name: 'Шарики START глаз.с какао 500г',
        quantity: '1',
        unitPrice: '30.8',
        totalAmount: '30.8'
      },
      {
        name: 'Каша ФрутоНяня зл печ манго200',
        quantity: '1',
        unitPrice: '53.5',
        totalAmount: '53.5'
      },
      {
        name: 'БМК Колб.Сливочная вар.в с вес',
        quantity: '0.276',
        unitPrice: '128',
        totalAmount: '35.33'
      },
      {
        name: 'Кр-мыло ФП Овсяное безе 290мл',
        quantity: '1',
        unitPrice: '36.9',
        totalAmount: '36.9'
      },
      {
        name: 'Пюре ФрутоНяня кабачок 80г',
        quantity: '3',
        unitPrice: '12.5',
        totalAmount: '37.5'
      },
      {
        name: 'Пюре Мал.Счастье хек 80г с б',
        quantity: '2',
        unitPrice: '25',
        totalAmount: '50'
      },
      {
        name: 'Пюре HAME телятина 100г ж б',
        quantity: '3',
        unitPrice: '27.6',
        totalAmount: '82.8'
      },
      {
        name: 'Филе СБ МАТИАС оригинал.кус200',
        quantity: '1',
        unitPrice: '36.5',
        totalAmount: '36.5'
      },
      {
        name: 'Зефир ZERFER DUO Marshm.90 KDV',
        quantity: '1',
        unitPrice: '14.5',
        totalAmount: '14.5'
      }
    ],
    adjustments: [
      {
        kind: 'discount',
        name: 'доп. скидка',
        amount: '0'
      },
      {
        kind: 'surcharge',
        name: 'Наценка',
        amount: '0'
      }
    ],
    payments: [
      {
        method: 'card',
        amount: '1070.63'
      }
    ]
  })
})
