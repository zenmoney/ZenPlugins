import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.html'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 841.
// The adjacent fixture preserves the entire observed provider response.
test('retains fractional quantity and the discount attached to the last item', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'UAH',
    operation: 'sale',
    issuedAt: {
      date: '2024-11-09',
      time: '18:01:35'
    },
    totalAmount: '241.5',
    merchant: {
      name: 'ТОВ "Меркурій-К"',
      address: 'УКРАЇНА, СУМСЬКА ОБЛАСТЬ, М.ОХТИРКА вул. Шевченко,3',
      identifiers: [
        {
          value: '386022718195',
          countryCode: 'UA',
          scheme: 'PN'
        }
      ]
    },
    items: [
      {
        name: 'Бананваг.',
        quantity: '1.246',
        unitPrice: '57.9',
        totalAmount: '72.14'
      },
      {
        name: 'ХлібКулиничіТостовийбілийєвропейський330г',
        quantity: '1',
        unitPrice: '24.4',
        totalAmount: '24.4'
      },
      {
        name: 'СоковийнапійСандорасицилійськийчервонийапельсин0,95л',
        quantity: '2',
        unitPrice: '72.48',
        totalAmount: '144.96',
        originalTotalAmount: '145',
        originalUnitPrice: '72.5',
        adjustments: [
          {
            kind: 'discount',
            amount: '-0.04',
            name: 'Знижка'
          }
        ]
      }
    ],
    id: 'b8rKhKHlRII',
    payments: [
      {
        method: 'card',
        amount: '241.5'
      }
    ]
  })
})
