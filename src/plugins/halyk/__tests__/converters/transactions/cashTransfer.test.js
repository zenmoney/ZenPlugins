/* eslint-disable no-irregular-whitespace */
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        amount: '-300 000,00',
        currency: 'KZT',
        date: '19.06.2024',
        description: 'Снятие денег через банкомат EVRAZIYA-3 TTS',
        expense: '-300 000,00',
        fee: '0,00',
        income: '0,00'
      },
      {
        hold: false,
        date: new Date('2024-06-19'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -300000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'KZT',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 300000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Снятие денег через банкомат EVRAZIYA-3 TTS'
      }
    ]
  ])('converts cash transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'KZT' })).toEqual(transaction)
  })
})
