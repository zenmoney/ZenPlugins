/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'
import { entity } from '../../../zenmoney_entity/transaction'

describe('transaction converter', () => {
  it('should return zenmoney transaction object', () => {
    const transaction = converter(
      {
        date: 1487764144000,
        itemType: 'OPERATION',
        authCode: '764635',
        bonus:
          {
            bonuslessReason: 'MCC',
            incomeExpectations: false,
            details: []
          },
        channel: 'POS',
        description: 'TINKOFF BANK CARD2CARD, MOSCOW',
        movements:
          [
            {
              date: 1589877008000,
              income: true,
              amount: 2000,
              currency: 'RUR',
              id: '431830758#822215859',
              type: 'AUTHORIZATION_HOLD'
            },
            {
              date: 1589880260000,
              income: false,
              amount: -2000,
              currency: 'RUR',
              id: '431830758#868976643',
              type: 'WITHDRAW'
            }
          ],
        title: 'Tinkoff Bank',
        mcc:
          {
            code: '6536',
            groupDescription: 'Переводы на другие карты',
            description: 'Перевод на другую карту',
            groupCode: 'money-send'
          },
        type: 'TRANSFER',
        actor: 'EXT_CONSUMER',
        counterpartyCode: 'tinkoff',
        money:
          {
            income: true,
            amount: -2000,
            amountDetail:
              {
                amount: -2000,
                acquirerCommission: 0,
                own: 2000,
                commission: 0,
                credit: 0
              },
            currency: 'RUR',
            accountAmount: { amount: -2000, currency: 'RUR' }
          },
        contractId: 9870000,
        id: 138794791,
        statisticGroup: { code: 'income-transfers', name: 'Переводы' },
        status: 'DONE'
      },
      {
        9870000: 'c-1230000'
      }
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '138794791',
      date: 1487764144000,
      income: 2000,
      outcome: 2000,
      mcc: 6536,
      payee: 'TINKOFF BANK CARD2CARD, MOSCOW',
      incomeAccount: 'c-1230000',
      outcomeAccount: 'checking#RUB',
      comment: [
        'Tinkoff Bank'
      ].join('\n')
    }))
  })
})
