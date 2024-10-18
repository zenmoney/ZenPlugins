/* eslint-disable no-irregular-whitespace */
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        amount: '0,00',
        currency: '',
        date: '10.08.2024',
        description: 'Ежемесячная комиссия за обслуживание карточки Regular Charge',
        expense: '0,00',
        fee: '-150,00',
        income: '0,00'
      },
      {
        hold: false,
        date: new Date('2024-08-10'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -150,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Ежемесячная комиссия за обслуживание карточки Regular Charge'
      }
    ]
  ])('converts fee', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'KZT' })).toEqual(transaction)
  })
})
