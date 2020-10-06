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
          incomeExpectations: false,
          bonuslessReason: 'OTHER'
        },
        channel: 'WEB',
        contractId: 9870000,
        date: 1487764144000,
        eventId: null,
        id: 138794791,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 100,
            currency: 'RUR'
          },
          amount: 100,
          amountDetail: {
            amount: 100,
            own: 100,
            credit: 0,
            commission: 0
          },
          currency: 'RUR',
          income: true
        },
        movements: [
          {
            amount: 100,
            currency: 'RUR',
            date: 1487764144000,
            id: '138794791#241321238',
            income: true,
            type: 'INCOME'
          }
        ],
        status: 'DONE',
        title: 'Перевод по реквизитам',
        type: 'TRANSFER'
      },
      {
        date: new Date(1487764144000),
        movements: [
          {
            id: '138794791',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 100,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: null
      }
    ]
  ])('converts income outer transfer', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
