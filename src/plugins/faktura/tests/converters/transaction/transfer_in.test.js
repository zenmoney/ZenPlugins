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
        '9870000': 'c-1230000'
      }
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '138794791',
      date: 1487764144000,
      income: 100,
      outcome: 100,
      incomeAccount: 'c-1230000',
      outcomeAccount: 'checking#RUB',
      comment: [
        'Перевод по реквизитам'
      ].join('\n')
    }))
  })
})
