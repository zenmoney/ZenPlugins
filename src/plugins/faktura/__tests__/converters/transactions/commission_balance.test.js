/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'

describe('transaction converter', () => {
  it.each([
    [
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
        date: new Date(1563096391000),
        movements: [
          {
            id: '361896907',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: -35,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: 'Комиссия за запрос баланса Vahram Papazyan st, YEREVAN'
      }
    ]
  ])('converts transaction with comission', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
