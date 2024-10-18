/* eslint-disable no-irregular-whitespace */
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        amount: '-500 000,00',
        currency: 'KZT',
        date: '14.08.2024',
        description: 'Перевод на депозит',
        expense: '-500 000,00',
        fee: '0,00',
        income: '0,00'
      },
      {
        hold: false,
        date: new Date('2024-08-14'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -500000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод на депозит',
        groupKeys: [
          '2024-08-14_KZT_500000'
        ]
      }
    ]
  ])('converts inner transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'KZT' })).toEqual(transaction)
  })
})
