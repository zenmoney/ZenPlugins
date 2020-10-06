/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'

describe('transaction converter', () => {
  it.each([
    [
      {
        actor: 'CONSUMER',
        bonus: {
          bonuslessReason: 'OTHER',
          incomeExpectations: false
        },
        channel: 'POS',
        contractId: 9870000,
        date: 1462966384000,
        eventId: null,
        id: 74501568,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 900.01,
            currency: 'RUR'
          },
          amount: 900.01,
          amountDetail: {
            amount: 900.01,
            own: 900.01,
            commission: 0,
            credit: 0
          },
          currency: 'RUR',
          income: true
        },
        movements: [
          {
            amount: 900.01,
            currency: 'RUR',
            date: 1462966384000,
            id: '74501568#95402930',
            income: true,
            type: 'INCOME'
          }
        ],
        status: 'DONE',
        title: 'Начисление процентов на остаток',
        type: 'PAYMENT'
      },
      {
        date: new Date(1462966384000),
        movements: [
          {
            id: '74501568',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 900.01,
            fee: 0
          }
        ],
        comment: 'Начисление процентов на остаток',
        hold: false,
        merchant: null
      }
    ]
  ])('converts payment with comment', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
