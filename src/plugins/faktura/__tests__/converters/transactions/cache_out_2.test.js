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
          bonuslessReason: 'MCC'
        },
        channel: 'ATM',
        connector: 'в банкомате',
        contractId: 9870000,
        date: 1487014700000,
        description: 'VB24, SPB',
        eventId: null,
        id: 136788480,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 1000,
            currency: 'RUR'
          },
          amount: 1000,
          amountDetail: {
            amount: 1000,
            own: 1000,
            credit: 0,
            commission: 0,
            acquirerCommission: 0
          },
          currency: 'RUR',
          income: false
        },
        movements: [
          {
            amount: 1000,
            currency: 'RUR',
            date: 1487014700000,
            id: '136788480#170345846',
            income: false,
            type: 'AUTHORIZATION_HOLD'
          },
          {
            amount: 1000,
            currency: 'RUR',
            date: 1487210613000,
            id: '136788480#236861693',
            income: false,
            type: 'WITHDRAW'
          }
        ],
        status: 'DONE',
        title: 'VB24',
        type: 'CASH',
        typeName: 'Снятие наличных'
      },
      {
        date: new Date(1487014700000),
        movements: [
          {
            id: '136788480',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: -1000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 1000,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: 'VB24, SPB'
      }
    ]
  ])('converts cash withdrawal 2', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
