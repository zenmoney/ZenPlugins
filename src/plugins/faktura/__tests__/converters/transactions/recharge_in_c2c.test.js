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
        channel: 'POS',
        contractId: 9870000,
        date: 1487711481000,
        eventId: null,
        id: 138487007,
        itemType: 'OPERATION',
        money: {
          amount: 5000,
          amountDetail: {
            amount: 5000,
            commission: 0
          },
          currency: 'RUR',
          income: true
        },
        movements: [
          {
            amount: 5000,
            currency: 'RUR',
            date: 1487711481000,
            id: '138487007#240263798',
            income: true,
            type: 'INCOME'
          }
        ],
        status: 'DONE',
        title: 'MASTERCARD',
        type: 'RECHARGE',
        typeName: 'Перевод с карты'
      },
      {
        date: new Date(1487711481000),
        movements: [
          {
            id: '138487007',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 5000,
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
            sum: -5000,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: null
      }
    ]
  ])('converts income outer transfer from card', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
