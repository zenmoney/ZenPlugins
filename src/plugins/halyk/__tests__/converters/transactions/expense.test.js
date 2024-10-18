/* eslint-disable no-irregular-whitespace */
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        amount: '-6 719,00',
        currency: 'KZT',
        date: '09.08.2024',
        description: 'Операция оплаты у коммерсанта OZON.KZ',
        expense: '-6 719,00',
        fee: '0,00',
        income: '0,00'
      },
      {
        hold: false,
        date: new Date('2024-08-09'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -6719,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'OZON.KZ',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts expense', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'KZT' })).toEqual(transaction)
  })
})
