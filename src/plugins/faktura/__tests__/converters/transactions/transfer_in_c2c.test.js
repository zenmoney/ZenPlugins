/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'

describe('transaction converter', () => {
  it.each([
    [
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
        date: new Date(1487764144000),
        movements: [
          {
            id: '138794791',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 2000,
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
            sum: -2000,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: null
      }
    ]
  ])('converts income transfer from card', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
