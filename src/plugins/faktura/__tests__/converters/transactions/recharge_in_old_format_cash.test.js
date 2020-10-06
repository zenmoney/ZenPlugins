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
        channel: 'WEB',
        contractId: 9870000,
        date: 1470128822000,
        eventId: null,
        id: 93330490,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 37000,
            currency: 'RUR'
          },
          amount: 37000,
          amountDetail: {
            amount: 37000,
            own: 37000,
            commission: 0,
            credit: 0
          },
          currency: 'RUR',
          income: true
        },
        movements: [
          {
            amount: 37000,
            currency: 'RUR',
            date: 1470128822000,
            id: '93330490#129253646',
            income: true,
            type: 'INCOME'
          }
        ],
        status: 'DONE',
        title: 'Пополнение',
        type: 'RECHARGE'
      },
      {
        date: new Date(1470128822000),
        movements: [
          {
            id: '93330490',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 37000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -37000,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash replenishment 2', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
