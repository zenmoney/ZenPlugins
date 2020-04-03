/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'
import { entity } from '../../../zenmoney_entity/transaction'

describe('transaction converter', () => {
  it('should return zenmoney transaction object', () => {
    const transaction = converter(
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
        9870000: 'c-1230000'
      }
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '93330490',
      date: 1470128822000,
      income: 37000,
      outcome: 37000,
      incomeAccount: 'c-1230000',
      outcomeAccount: 'cash#RUB',
      comment: [
        'Пополнение'
      ].join('\n')
    }))
  })
})
