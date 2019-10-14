/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'
import { entity } from '../../../zenmoney_entity/transaction'

describe('transaction converter', () => {
  it('should return zenmoney transaction object', () => {
    const transaction = converter(
      {
        date: 1563096391000,
        itemType: 'OPERATION',
        authCode: '216316',
        bonus:
          {
            bonuslessReason: 'MCC',
            incomeExpectations: false,
            details: []
          },
        typeName: 'Комиссия за запрос баланса',
        channel: 'WEB',
        description: 'Vahram Papazyan st, YEREVAN',
        movements:
          [
            {
              date: 1563096391000,
              income: false,
              amount: 35,
              rate: 0,
              currency: 'RUR',
              id: '361896907#662382428',
              type: 'AUTHORIZATION_HOLD'
            },
            {
              date: 1563150160000,
              income: false,
              amount: 35,
              currency: 'RUR',
              id: '361896907#809185460',
              type: 'WITHDRAW'
            }
          ],
        title: 'Vahram Papazyan st',
        mcc:
          {
            code: '6011',
            groupDescription: 'Снятие наличных',
            description: 'Снятие наличных',
            groupCode: 'get-cash'
          },
        type: 'PAYMENT',
        actor: 'CONSUMER',
        connector: 'в банкомате',
        money:
          {
            income: false,
            amount: 35,
            amountDetail:
              {
                amount: 35,
                acquirerCommission: 0,
                own: 35,
                commission: 0,
                credit: 0
              },
            currency: 'RUR',
            accountAmount: { amount: 0, currency: 'RUR' }
          },
        contractId: 9870000,
        id: 361896907,
        status: 'DONE'
      },
      {
        '9870000': 'c-1230000'
      }
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '361896907',
      incomeAccount: 'c-1230000',
      income: 0,
      outcomeAccount: 'c-1230000',
      outcome: 35,
      mcc: 6011,
      payee: 'Vahram Papazyan st, YEREVAN',
      date: 1563096391000,
      comment: [
        'Комиссия за запрос баланса: Vahram Papazyan st'
      ].join('\n')
    }))
  })
})
