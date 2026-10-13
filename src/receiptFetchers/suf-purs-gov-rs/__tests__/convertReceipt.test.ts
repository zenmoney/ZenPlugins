import fixture1 from './convertReceipt-01.html'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-05-05',
      time: '19:42:10'
    },
    currency: 'RSD',
    totalAmount: '4048.76',
    merchant: {
      name: 'UNIVEREXPORT',
      address: 'БУЛЕВАР ОСЛОБОЂЕЊА 119 Нови Сад'
    },
    items: [
      {
        name: 'DESERT COK 115G ZOTT (KOM) (Ђ)',
        quantity: '4',
        unitPrice: '68.99',
        totalAmount: '275.96'
      },
      {
        name: 'KOB.PIL.POSEB.320G (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '190.99',
        totalAmount: '190.99'
      },
      {
        name: 'CAJNA KOB.SLAJS 100G (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '229.99',
        totalAmount: '229.99'
      },
      {
        name: 'CIPIRIPI DEZERT 100G (KOM) (Ђ)',
        quantity: '4',
        unitPrice: '71.99',
        totalAmount: '287.96'
      },
      {
        name: 'ZVAKE BUBLE MINT 14G (KOM) (Ђ)',
        quantity: '3',
        unitPrice: '70.99',
        totalAmount: '212.97'
      },
      {
        name: 'VODA ROSA NEGAZ. 6L (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '199.99',
        totalAmount: '199.99'
      },
      {
        name: 'JAB FAMILY 1,5L NEC (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '182.99',
        totalAmount: '182.99'
      },
      {
        name: 'PP PILECI  BATAK 480 (KOM) (Е)',
        quantity: '1',
        unitPrice: '259.99',
        totalAmount: '259.99'
      },
      {
        name: 'KESA SA RUCKOM UNI (KOM) (Ђ)',
        quantity: '3',
        unitPrice: '19',
        totalAmount: '57'
      },
      {
        name: 'KRPA KUH  50x70 1/1 (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '299.99',
        totalAmount: '299.99'
      },
      {
        name: 'KINDER CHOCOFRESH 41 (KOM) (Ђ)',
        quantity: '2',
        unitPrice: '104.99',
        totalAmount: '209.98'
      },
      {
        name: 'MLEKO UHT MK 1,5L (KOM) (Е)',
        quantity: '1',
        unitPrice: '229.99',
        totalAmount: '229.99'
      },
      {
        name: 'PAN.ODRES.P.FILE 700 (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '683.99',
        totalAmount: '683.99'
      },
      {
        name: 'MAJONEZ CLAS 285ML D (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '174.99',
        totalAmount: '174.99'
      },
      {
        name: 'EUROMAX HC 250G (KOM) (Ђ)',
        quantity: '2',
        unitPrice: '275.99',
        totalAmount: '551.98'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '4048.76'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})
