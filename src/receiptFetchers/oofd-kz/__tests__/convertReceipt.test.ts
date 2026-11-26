import { cloneDeep, set } from 'lodash'
import fixture1 from './convertReceipt-01.json'
import mixedRounding from './convertReceipt-02.json'
import basketRounding from './convertReceipt-03.json'
import { convertReceipt } from '../converters'

// Complete existing OOFD response: ticket 531282_10602, foundDate 2021-05-06.
// The separate discount row and its modifiers repeat one document-level effect.
test('preserves the document discount once and the applied card payment', () => {
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
          countryCode: 'KZ',
          scheme: 'IIN/BIN'
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
    adjustments: [{ kind: 'discount', name: 'Скидка', amount: '-3844' }],
    payments: [{ method: 'card', amount: '5766' }],
    operation: 'sale'
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

// Complete OOFD lookup response retrieved on 2026-11-26 for build 9 report 233367.
// The binary fiscal protocol envelopes are redacted.
test('preserves upward and downward rounding separately from the taxed goods', () => {
  expect(convertReceipt(mixedRounding)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: { date: '2026-11-21', time: '17:33:41.000' },
    totalAmount: '13828',
    merchant: {
      name: 'ТОВАРИЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "АЛМАСТОР"',
      address: 'г. Алматы, р-н Бостандыкский,  г. Алматы, ул. Сатпаева д. 90В',
      identifiers: [{ value: '100540002064', countryCode: 'KZ', scheme: 'IIN/BIN' }]
    },
    items: [
      {
        name: 'НАПИТОК DIZZY PARADISE ENERGY 0,33Л СТ/Б (шт)',
        quantity: '1',
        unit: 'шт',
        unitPrice: '530',
        totalAmount: '530',
        adjustments: [{ kind: 'tax', amount: '73.1', percent: '16' }]
      },
      {
        name: 'ШОКОЛАД ТЕМНЫЙ LINDT EXCELLENCE С ВАФЕЛЬНЫМИ КУСОЧКАМИ 100 ГР (шт)',
        quantity: '1',
        unit: 'шт',
        unitPrice: '799',
        totalAmount: '799',
        adjustments: [{ kind: 'tax', amount: '110.21', percent: '16' }]
      },
      {
        name: 'МОЛОКО ADAL ПРОДУКТЫ НАШИХ ФЕРМ 2,5% 0,950Л UHT (шт)',
        quantity: '2',
        unit: 'шт',
        unitPrice: '875',
        totalAmount: '1750',
        adjustments: [{ kind: 'tax', amount: '241.38', percent: '16' }]
      },
      {
        name: 'ТОМАТЫ БРИОЗА МИКС КОКТЕЙЛЬНЫЕ КАЗАХСТАН ШТ (шт)',
        quantity: '1',
        unit: 'шт',
        unitPrice: '1599',
        totalAmount: '1599',
        adjustments: [{ kind: 'tax', amount: '220.55', percent: '16' }]
      },
      {
        name: 'ЯЙЦО FOODZ ФЕРМЕРСКОЕ ОТБОРНОЕ 15ШТ (шт)',
        quantity: '1',
        unit: 'шт',
        unitPrice: '1505',
        totalAmount: '1505',
        adjustments: [{ kind: 'tax', amount: '207.59', percent: '16' }]
      },
      {
        name: 'Булочка ромовая баба вес (кг)',
        quantity: '0.41',
        unit: 'кг',
        unitPrice: '3050',
        totalAmount: '1250.5',
        adjustments: [{ kind: 'tax', amount: '172.48', percent: '16' }]
      },
      {
        name: 'ГОЛУБИКА 125ГР ШТ (шт)',
        quantity: '1',
        unit: 'шт',
        unitPrice: '899',
        totalAmount: '899',
        adjustments: [{ kind: 'tax', amount: '124', percent: '16' }]
      },
      {
        name: 'БАНАНЫ ВЕС (кг)',
        quantity: '0.836',
        unit: 'кг',
        unitPrice: '990',
        totalAmount: '827.64',
        adjustments: [{ kind: 'tax', amount: '114.16', percent: '16' }]
      },
      {
        name: 'СУХАРИКИ ПРОТЕИНОВЫЕ BOMBBAR СО ВКУСОМ БАВАРСКИЕ КОЛБАСКИ С ПЕРЦЕМ 50ГР (шт)',
        quantity: '1',
        unit: 'шт',
        unitPrice: '560',
        totalAmount: '560',
        adjustments: [{ kind: 'tax', amount: '77.24', percent: '16' }]
      },
      {
        name: 'ПАЛОЧКИ КУКУРУЗНЫЕ BOMBBAR ПРОТЕИНОВЫЕ ЛУК И СМЕТАНА 60 ГР (шт)',
        quantity: '1',
        unit: 'шт',
        unitPrice: '1375',
        totalAmount: '1375',
        adjustments: [{ kind: 'tax', amount: '189.66', percent: '16' }]
      },
      {
        name: 'МАНДАРИН С ЛИСТЬЯМИ ВЕС (кг)',
        quantity: '0.526',
        unit: 'кг',
        unitPrice: '799',
        totalAmount: '420.27',
        adjustments: [{ kind: 'tax', amount: '57.97', percent: '16' }]
      },
      {
        name: 'ЗЕФИР NEO - BOTANICA NO SUGAR ADDED С МАЛИНОЙ КАРКАДЕ И ВИТАМИНАМИ 135ГР (шт)',
        quantity: '2',
        unit: 'шт',
        unitPrice: '1145',
        totalAmount: '2290',
        adjustments: [{ kind: 'tax', amount: '315.86', percent: '16' }]
      },
      {
        name: 'Пакет A-Store 380*2*80*600*17 (шт)',
        quantity: '2',
        unit: 'шт',
        unitPrice: '11',
        totalAmount: '22',
        adjustments: [{ kind: 'tax', amount: '3.03', percent: '16' }]
      }
    ],
    adjustments: [
      { kind: 'rounding', name: 'Коррекция округления', amount: '0.5' },
      { kind: 'rounding', name: 'Коррекция округления', amount: '0.36' },
      { kind: 'rounding', name: 'Коррекция округления', amount: '-0.27' }
    ],
    payments: [{ method: 'card', amount: '13828' }]
  })
})

// Complete OOFD lookup response retrieved on 2026-11-26 for build 9 report 235496.
// The binary fiscal protocol envelopes are redacted.
test('keeps the final ROUND entry as a basket rounding adjustment', () => {
  expect(convertReceipt(basketRounding)).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'sale',
    issuedAt: { date: '2026-11-25', time: '15:51:34.000' },
    totalAmount: '2693',
    merchant: {
      name: 'ФИЛИАЛ ТОВАРИЩЕСТВА С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "MAGNUM CASH&CARRY" № 4',
      address: 'г. Алматы, р-н Медеуский,  г. Алматы, ул. Халиуллина д. 194',
      identifiers: [{ value: '120741003950', countryCode: 'KZ', scheme: 'IIN/BIN' }]
    },
    items: [
      {
        name: '2155924003144 КЕБЕКТІ БИДАЙ НАНЫ, КГ',
        quantity: '0.314',
        unit: 'кг',
        unitPrice: '990',
        totalAmount: '310.86',
        adjustments: [{ kind: 'tax', amount: '42.88', percent: '16' }]
      },
      {
        name: '4870091000847 СУЛТАН   МАКАРОН  ШИЫРШЫҚ  400 Г',
        quantity: '2',
        unit: 'шт',
        unitPrice: '349',
        totalAmount: '698',
        adjustments: [{ kind: 'tax', amount: '96.28', percent: '16' }]
      },
      {
        name: '4870091000663 СУЛТАН   МАКАРОН  СПАГЕТТИ 400 Г',
        quantity: '2',
        unit: 'шт',
        unitPrice: '445',
        totalAmount: '890',
        adjustments: [{ kind: 'tax', amount: '122.76', percent: '16' }]
      },
      {
        name: '4870254130558 FLINT КЕПТІРІЛГЕН НАНДАР КРАБ 100ГР ФЛ/П',
        quantity: '1',
        unit: 'шт',
        unitPrice: '465',
        totalAmount: '465',
        adjustments: [{ kind: 'tax', amount: '64.14', percent: '16' }]
      },
      {
        name: '2127542012747 СҰЛЫ ҚАУЫЗДАР ГЕРКУЛЕСІ КГ',
        quantity: '1.274',
        unit: 'кг',
        unitPrice: '259',
        totalAmount: '329.97',
        adjustments: [{ kind: 'tax', amount: '45.51', percent: '16' }]
      }
    ],
    adjustments: [
      { kind: 'rounding', name: 'ROUND', amount: '-0.83' }
    ],
    payments: [{ method: 'card', amount: '2693' }]
  })
})
