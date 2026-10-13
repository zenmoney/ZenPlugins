import fixture1 from './convertReceipt-01.html'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-05-05',
      time: '14:34:25'
    },
    currency: 'MDL',
    totalAmount: '35.8',
    merchant: {
      name: 'MOLDRETAIL GROUP S.R.L.',
      address: 'mun. Chisinau str. Albisoara, 80/5A'
    },
    items: [
      {
        name: 'SURPRISE Inghetata Triple Chocolate 110ml',
        quantity: '1',
        unitPrice: '10.2',
        totalAmount: '10.2'
      },
      {
        name: 'OM Apa potabila purif.carbo 0.75l',
        quantity: '1',
        unitPrice: '9.9',
        totalAmount: '9.9'
      },
      {
        name: 'DRANCOR Inghetata TOAMNA DE AUR pah.90g',
        quantity: '1',
        unitPrice: '15.7',
        totalAmount: '15.7'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '35.8'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})
