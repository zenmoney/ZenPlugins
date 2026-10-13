import fixture1 from './convertReceipt-01.html'
import fixture2 from './convertReceipt-02.html'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-05-28',
      time: '16:03:25'
    },
    currency: 'MDL',
    totalAmount: '258.46',
    merchant: {
      name: '47TH PARALLEL S.R.L.',
      address: 'mun.Chisinau, str.Zelinski 7'
    },
    items: [
      {
        name: 'Oua de gaina',
        quantity: '1',
        unitPrice: '31.9',
        totalAmount: '31.9'
      },
      {
        name: 'Cioc.Bucuria',
        quantity: '2',
        unitPrice: '28.32',
        totalAmount: '56.64'
      },
      {
        name: 'Cioc.Bucuria',
        quantity: '2',
        unitPrice: '28.32',
        totalAmount: '56.64'
      },
      {
        name: 'Cioc.Bucuria',
        quantity: '2',
        unitPrice: '28.32',
        totalAmount: '56.64'
      },
      {
        name: 'Cioc.Bucuria',
        quantity: '2',
        unitPrice: '28.32',
        totalAmount: '56.64'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '258.46'
      }
    ]
  })
})

test('converts source case 02', () => {
  expect(convertReceipt(fixture2)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-05-28',
      time: '16:23:19'
    },
    currency: 'MDL',
    totalAmount: '1120',
    merchant: {
      name: '47TH PARALLEL S.R.L.',
      address: 'mun.Chisinau, str.Zelinski 7'
    },
    items: [
      {
        name: 'Tigari SOBRAN',
        quantity: '20',
        unitPrice: '56',
        totalAmount: '1120'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '1120'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})
