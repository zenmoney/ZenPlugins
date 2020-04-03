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
        counterpartyCode: 'megafon',
        date: 1488341353000,
        eventId: null,
        id: 139939137,
        itemType: 'OPERATION',
        money: {
          amount: 100,
          accountAmount: {
            amount: 100,
            currency: 'RUR'
          },
          income: false,
          amountDetail: {
            amount: 100,
            commission: 0,
            credit: 0,
            own: 100
          },
          currency: 'RUR'
        },
        movements: [
          {
            amount: 100,
            currency: 'RUR',
            date: 1488341353000,
            id: '139939137#244529873',
            income: false,
            type: 'WITHDRAW'
          }
        ],
        serviceCode: 'GIN2S507',
        status: 'DONE',
        title: 'Сотовый - Мегафон (б/н) тел.9210000000',
        type: 'PAYMENT'
      },
      {
        9870000: 'c-1230000'
      }
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '139939137',
      date: 1488341353000,
      income: 0,
      outcome: 100,
      incomeAccount: 'c-1230000',
      outcomeAccount: 'c-1230000',
      comment: [
        'Сотовый - Мегафон (б/н) тел.9210000000'
      ].join('\n')
    }))
  })
})
