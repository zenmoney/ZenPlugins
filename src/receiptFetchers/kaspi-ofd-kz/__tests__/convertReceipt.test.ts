import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.html'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1483.
// The adjacent fixture preserves the entire observed provider response.
test('preserves all 16 rounded source lines and their included taxes', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: {
      date: '2026-10-07',
      time: '13:51:06.954000'
    },
    totalAmount: '9930',
    merchant: {
      name: 'ТОО "MAGNUM E-COMMERCE KAZAKHSTAN"',
      address: 'г. Алматы, Медеуский р-н, тр-т Кульджинский зд. 22/6',
      identifiers: [
        {
          value: '210640039783',
          countryCode: 'KZ',
          scheme: 'BIN'
        }
      ]
    },
    items: [
      {
        name: 'Лук репчатый Казахстан',
        quantity: '0.77',
        unitPrice: '99',
        totalAmount: '76',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '10.48',
            percent: '16'
          }
        ]
      },
      {
        name: 'Морковь отборная Казахстан',
        quantity: '0.946',
        unitPrice: '207',
        totalAmount: '195',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '26.9',
            percent: '16'
          }
        ]
      },
      {
        name: 'Сахар',
        quantity: '1.996',
        unitPrice: '455',
        totalAmount: '908',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '125.24',
            percent: '16'
          }
        ]
      },
      {
        name: 'Яйцо Qarqus 30 шт 60-65 гр',
        quantity: '1',
        unitPrice: '2235',
        totalAmount: '2235',
        unit: 'шт.',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '308.28',
            percent: '16'
          }
        ]
      },
      {
        name: 'Картофель фермерский Казахстан',
        quantity: '2.978',
        unitPrice: '199',
        totalAmount: '592',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '81.66',
            percent: '16'
          }
        ]
      },
      {
        name: 'Груша Лесная красавица Казахстан',
        quantity: '0.85',
        unitPrice: '599',
        totalAmount: '509',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '70.21',
            percent: '16'
          }
        ]
      },
      {
        name: 'Слива Ташкентская Узбекистан',
        quantity: '0.482',
        unitPrice: '679',
        totalAmount: '327',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '45.1',
            percent: '16'
          }
        ]
      },
      {
        name: 'Лимон Узбекистан',
        quantity: '0.214',
        unitPrice: '1625',
        totalAmount: '347',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '47.86',
            percent: '16'
          }
        ]
      },
      {
        name: 'Баклажан Казахстан',
        quantity: '0.778',
        unitPrice: '549',
        totalAmount: '427',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '58.9',
            percent: '16'
          }
        ]
      },
      {
        name: 'Филе сельди Cанта Бремор Матиас отборное 300 гр',
        quantity: '1',
        unitPrice: '1735',
        totalAmount: '1735',
        unit: 'шт.',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '239.31',
            percent: '16'
          }
        ]
      },
      {
        name: 'Кабачки Казахстан',
        quantity: '1.066',
        unitPrice: '359',
        totalAmount: '382',
        unit: 'кг',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '52.69',
            percent: '16'
          }
        ]
      },
      {
        name: 'Майонез Махеевъ провансаль 50,5% 770 гр',
        quantity: '1',
        unitPrice: '999',
        totalAmount: '999',
        unit: 'шт.',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '137.79',
            percent: '16'
          }
        ]
      },
      {
        name: 'Макароны Султан спираль 400 гр',
        quantity: '1',
        unitPrice: '339',
        totalAmount: '339',
        unit: 'шт.',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '46.76',
            percent: '16'
          }
        ]
      },
      {
        name: 'Макароны Cултан ракушки 400 гр',
        quantity: '1',
        unitPrice: '339',
        totalAmount: '339',
        unit: 'шт.',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '46.76',
            percent: '16'
          }
        ]
      },
      {
        name: 'Макароны Султан лингвини 400 гр',
        quantity: '1',
        unitPrice: '445',
        totalAmount: '445',
        unit: 'шт.',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '61.38',
            percent: '16'
          }
        ]
      },
      {
        name: 'Упаковка',
        quantity: '1',
        unitPrice: '75',
        totalAmount: '75',
        unit: 'шт.',
        adjustments: [
          {
            kind: 'tax',
            name: 'НДС',
            amount: '10.34',
            percent: '16'
          }
        ]
      }
    ],
    payments: [
      {
        method: 'card',
        amount: '9930'
      }
    ]
  })
})
