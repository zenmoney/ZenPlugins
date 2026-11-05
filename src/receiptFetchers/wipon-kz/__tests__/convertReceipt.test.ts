import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.html'
import source2 from './convertReceipt-02.html'
import source3 from './convertReceipt-03.html'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 135.
// The adjacent fixture preserves the entire observed provider response.
test('preserves the final discounted line and cash settlement', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: {
      date: '2026-07-31',
      time: '22:04'
    },
    totalAmount: '2835',
    merchant: {
      name: 'ТОО "CU Central Asia"',
      address: 'г.Алматы, р-н Алмалинский, ул. Байтурсынулы, д. 78, н.п. 16',
      identifiers: [
        {
          value: '230640015773',
          countryCode: 'KZ',
          scheme: 'BIN'
        }
      ]
    },
    items: [
      {
        name: 'ЛАПША OTTOGI РАМЕН СГРИБАМИ 110ГР СТ',
        quantity: '2',
        unitPrice: '1175',
        totalAmount: '2350',
        unit: 'шт',
        originalUnitPrice: '1290',
        originalTotalAmount: '2580',
        adjustments: [
          {
            kind: 'discount',
            amount: '-230'
          }
        ]
      },
      {
        name: 'ЧАЙ ЗЕЛЕНЫЙ AI TEA МАНГО МАРАКУЙЯ 05Л',
        quantity: '1',
        unitPrice: '475',
        totalAmount: '475',
        unit: 'шт'
      },
      {
        name: 'Бамбуковые палочки для еды 100пар/пач',
        quantity: '1',
        unitPrice: '10',
        totalAmount: '10',
        unit: 'шт'
      }
    ],
    payments: [
      {
        method: 'cash',
        amount: '2835'
      }
    ]
  })
})

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 140.
// The adjacent fixture preserves the entire observed provider response.
test('retrieves the legacy sales-check layout', () => {
  expect(convertReceipt(source2)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: {
      date: '2026-07-05',
      time: '18:20:27'
    },
    totalAmount: '11000',
    merchant: {
      name: 'ИП Sunflower',
      address: 'Астана, проспект Мангилик Ел, 36',
      identifiers: [
        {
          value: '650326402061',
          countryCode: 'KZ',
          scheme: 'IIN/BIN'
        }
      ]
    },
    items: [
      {
        name: 'Браслет аквамарин с золотыми вставками',
        quantity: '1',
        unitPrice: '6000',
        totalAmount: '6000'
      },
      {
        name: 'Moon чокер 5000',
        quantity: '1',
        unitPrice: '5000',
        totalAmount: '5000'
      }
    ],
    payments: [
      {
        method: 'card',
        amount: '11000'
      }
    ]
  })
})

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1167.
// Only the anonymous page CSRF token is replaced with an inert fixture value.
// The adjacent fixture preserves the entire observed provider response.
test('supports Nurkassa as a Wipon domain', () => {
  expect(convertReceipt(source3)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: {
      date: '2026-07-17',
      time: '20:22'
    },
    totalAmount: '14560',
    merchant: {
      name: 'ИП "АЛЬБЕК"',
      address: 'р-нБурлинский, г. Аксай, ул. Сырым Датулы, ст-е 6/4:',
      identifiers: [
        {
          value: '891001350325',
          countryCode: 'KZ',
          scheme: 'BIN'
        }
      ]
    },
    items: [
      {
        name: '"Leffe Blonde 0.33 стекло"',
        quantity: '4',
        unitPrice: '1900',
        totalAmount: '7600'
      },
      {
        name: '"Пакет"',
        quantity: '1',
        unitPrice: '30',
        totalAmount: '30'
      },
      {
        name: '"Жигулевское 1969 свет.неф.0,45 ж/б"',
        quantity: '1',
        unitPrice: '680',
        totalAmount: '680'
      },
      {
        name: '"Fessla Helles свет.неф.0,45 ж/б"',
        quantity: '1',
        unitPrice: '850',
        totalAmount: '850'
      },
      {
        name: '"Рыба вакуум в ассортименте 40г"',
        quantity: '2',
        unitPrice: '600',
        totalAmount: '1200'
      },
      {
        name: '"Fessla Pilsner свет.неф.0,45 ж/б"',
        quantity: '1',
        unitPrice: '850',
        totalAmount: '850'
      },
      {
        name: '"Fessla 44 пшенич.ж/б 0,45л"',
        quantity: '1',
        unitPrice: '950',
        totalAmount: '950'
      },
      {
        name: '"Fessla Hefeweissbier weizen ж/б 0.45л н/ф"',
        quantity: '1',
        unitPrice: '850',
        totalAmount: '850'
      },
      {
        name: '"Fessla Костанайское мягкое 0,45 ж/б"',
        quantity: '1',
        unitPrice: '600',
        totalAmount: '600'
      },
      {
        name: '"Fessla 11 свет.неф.0,45 ж/б"',
        quantity: '1',
        unitPrice: '950',
        totalAmount: '950'
      }
    ],
    payments: [
      {
        method: 'card',
        amount: '14560'
      }
    ]
  })
})
