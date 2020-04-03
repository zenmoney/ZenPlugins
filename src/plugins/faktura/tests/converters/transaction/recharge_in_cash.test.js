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
          bonuslessReason: 'OTHER',
          details: []
        },
        channel: 'WEB',
        comment: 'Оформление карты',
        connector: 'в салоне',
        contractId: 9870000,
        date: 1487424751000,
        eventId: null,
        id: 137884380,
        itemType: 'OPERATION',
        money: {
          amount: 500,
          income: true,
          amountDetail: {
            amount: 500,
            commission: 0
          },
          currency: 'RUR'
        },
        movements: [
          {
            amount: 500,
            currency: 'RUR',
            date: 1487424751000,
            id: '137884380#238688587',
            income: true,
            type: 'INCOME'
          }
        ],
        status: 'DONE',
        title: 'ул. Пушкина, дом Колотушкина',
        type: 'RECHARGE',
        typeName: 'Пополнение наличными'
      },
      {
        9870000: 'c-1230000'
      }
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '137884380',
      date: 1487424751000,
      income: 500,
      outcome: 500,
      incomeAccount: 'c-1230000',
      outcomeAccount: 'cash#RUB',
      comment: [
        'Пополнение наличными: ул. Пушкина, дом Колотушкина',
        'Оформление карты'
      ].join('\n')
    }))
  })
})
