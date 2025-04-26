/* eslint-disable no-irregular-whitespace */
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        amount: '-150 000,00',
        currency: 'KZT',
        date: '14.08.2024',
        description: 'Перевод на другую карту',
        expense: '-150 150,00',
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
            sum: -150000,
            fee: -150
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'KZT',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 150000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод на другую карту'
      }
    ]
  ])('converts outer transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'KZT' })).toEqual(transaction)
  })
})
