import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.json'
import source2 from './convertReceipt-02.json'
import source3 from './convertReceipt-03.json'

// Complete public /api/tickets response captured 2026-11-05; receipts.csv row 330.
// Item totals and included tax incorporate only the explicitly attached rounding corrections.
test('converts the complete observed receipt 1', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: {
      date: '2026-08-16',
      time: '15:02:14'
    },
    totalAmount: '7962',
    merchant: {
      name: 'ТОО "TOIMART"',
      address: 'г.Алматы, Медеуский район, ул. Кунаева,  д. 153',
      identifiers: [
        {
          value: '990840000082',
          countryCode: 'KZ',
          scheme: 'BIN'
        }
      ]
    },
    items: [
      {
        name: 'КӨК КИНЗА САЛМ//ЗЕЛЕНЬ КИНЗА ВЕС',
        quantity: '0.126',
        unit: 'Килограмм/Килограмм',
        totalAmount: '378',
        unitPrice: '3000',
        originalUnitPrice: '2999',
        originalTotalAmount: '377.87',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '52.14'
          },
          {
            kind: 'rounding',
            name: 'Коррекция округления',
            amount: '0.13'
          }
        ]
      },
      {
        name: 'ФУНЧЕЗА КАЗРУСПРОДУКТ 350 Г ПАК. //ФУНЧЕЗА КАЗ РУСПРОДУКТ 350 Г ПАК.',
        quantity: '1',
        unit: 'Дана/Штука',
        totalAmount: '829',
        unitPrice: '829',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '114.34'
          }
        ]
      },
      {
        name: '630 ЭНОКИ САҢЫРАУҚҰЛАҒЫ //ГРИБЫ ЭНОКИ ВЕС',
        quantity: '0.322',
        unit: 'Килограмм/Килограмм',
        totalAmount: '320',
        originalUnitPrice: '995',
        originalTotalAmount: '320.39',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '44.14'
          },
          {
            kind: 'rounding',
            name: 'Коррекция округления',
            amount: '-0.39'
          }
        ]
      },
      {
        name: '630 ЭНОКИ САҢЫРАУҚҰЛАҒЫ //ГРИБЫ ЭНОКИ ВЕС',
        quantity: '0.332',
        unit: 'Килограмм/Килограмм',
        totalAmount: '330',
        originalUnitPrice: '995',
        originalTotalAmount: '330.34',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '45.51'
          },
          {
            kind: 'rounding',
            name: 'Коррекция округления',
            amount: '-0.34'
          }
        ]
      },
      {
        name: 'ЛИМОНАД HOLIDAY 1 Л PET/6//ЛИМОНАД HOLIDAY 1 Л PET',
        quantity: '1',
        unit: 'Дана/Штука',
        totalAmount: '449',
        unitPrice: '449',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '61.93'
          }
        ]
      },
      {
        name: 'БАНАН ЭКВАДОР САЛМ//БАНАН ЭКВАДОР ВЕС',
        quantity: '0.702',
        unit: 'Килограмм/Килограмм',
        totalAmount: '624',
        originalUnitPrice: '889',
        originalTotalAmount: '624.08',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '86.07'
          },
          {
            kind: 'rounding',
            name: 'Коррекция округления',
            amount: '-0.08'
          }
        ]
      },
      {
        name: 'БОЛГАР БҰРЫШЫ ЛАСТОЧКА САЛМ//ПЕРЕЦ БОЛГАРСКИЙ ЛАСТОЧКА ВЕС',
        quantity: '0.204',
        unit: 'Килограмм/Килограмм',
        totalAmount: '89',
        originalUnitPrice: '435',
        originalTotalAmount: '88.74',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '12.28'
          },
          {
            kind: 'rounding',
            name: 'Коррекция округления',
            amount: '0.26'
          }
        ]
      },
      {
        name: 'КУС ВКУС БРОЙЛЕР-БАЛАПАНЫ ЖАМБАС ЖҰМСАҚ ЕТІ СА ЛҚЫНДАТЫЛҒАН САЛМАҒЫ//ФИЛЕ БЕДРА КУС ВКУС ЦЫПЛ ЕНКА-БРО',
        quantity: '0.908',
        unit: 'Килограмм/Килограмм',
        totalAmount: '2692',
        originalUnitPrice: '2965',
        originalTotalAmount: '2692.22',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '371.31'
          },
          {
            kind: 'rounding',
            name: 'Коррекция округления',
            amount: '-0.22'
          }
        ]
      },
      {
        name: 'КУС ВКУС БРОЙЛЕР-БАЛАПАНЫ ТӨМЕНГІ АЯҒЫ САЛҚЫНД АТЫЛҒАН САЛМАҒЫ//ГОЛЕНЬ КУС ВКУС ЦЫПЛЕНКА-БРОЙ ЛЕРА ОХЛ',
        quantity: '0.952',
        unit: 'Килограмм/Килограмм',
        totalAmount: '2251',
        originalUnitPrice: '2365',
        originalTotalAmount: '2251.48',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '310.48'
          },
          {
            kind: 'rounding',
            name: 'Коррекция округления',
            amount: '-0.48'
          }
        ]
      }
    ],
    payments: [
      {
        method: 'card',
        amount: '7962'
      }
    ]
  })
})

// Complete public /api/tickets response captured 2026-11-05; receipts.csv row 426.
// Item totals and included tax incorporate only the explicitly attached rounding corrections.
test('converts the complete observed receipt 2', () => {
  expect(convertReceipt(source2)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: {
      date: '2026-11-03',
      time: '20:03:41'
    },
    totalAmount: '4240',
    merchant: {
      name: 'ТОО THE CASPIAN INTERNATIONAL RESTAURANTS COMPANY (КАСПИАН ИНТЕРНЭШНЛ РЕСТРОНГЗ КОМПАНИ)',
      address: 'г.Астана, район Есиль, пр. Қабанбай Батыр,  зд. 62',
      identifiers: [
        {
          value: '070440007370',
          countryCode: 'KZ',
          scheme: 'BIN'
        }
      ]
    },
    items: [
      {
        name: 'НОВИНКА! Гранд Титан Биф Комбо M',
        quantity: '1',
        unit: 'Дана/Штука',
        totalAmount: '4240',
        unitPrice: '4240',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '584.83'
          }
        ]
      }
    ],
    payments: [
      {
        method: 'card',
        amount: '4240'
      }
    ]
  })
})

// Complete public /api/tickets response captured 2026-11-05; receipts.csv row 887.
// Item totals and included tax incorporate only the explicitly attached rounding corrections.
test('converts the complete observed receipt 3', () => {
  expect(convertReceipt(source3)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: {
      date: '2026-04-18',
      time: '19:22:36'
    },
    totalAmount: '2995',
    merchant: {
      name: 'ТОО "Super Cool Retail"',
      address: 'г.Алматы, Турксибский район, ул. Зорге, сооруж. 18',
      identifiers: [
        {
          value: '250840015453',
          countryCode: 'KZ',
          scheme: 'BIN'
        }
      ]
    },
    items: [
      {
        name: 'KV-2 (Халықаралық) Қағаз сатып алу сөмкесі кіш і',
        quantity: '1',
        unit: 'Дана/Штука',
        totalAmount: '80',
        unitPrice: '80',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '11.03'
          }
        ]
      },
      {
        name: 'Печенье',
        quantity: '1',
        unit: 'Дана/Штука',
        totalAmount: '595',
        unitPrice: '595',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '82.07'
          }
        ]
      },
      {
        name: 'Печенье',
        quantity: '1',
        unit: 'Дана/Штука',
        totalAmount: '890',
        unitPrice: '890',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '122.76'
          }
        ]
      },
      {
        name: 'Ауа тазартқыш',
        quantity: '1',
        unit: 'Дана/Штука',
        totalAmount: '1430',
        unitPrice: '1430',
        adjustments: [
          {
            kind: 'tax',
            name: 'ҚҚС/НДС',
            amount: '197.24'
          }
        ]
      }
    ],
    payments: [
      {
        method: 'card',
        amount: '2995'
      }
    ]
  })
})
