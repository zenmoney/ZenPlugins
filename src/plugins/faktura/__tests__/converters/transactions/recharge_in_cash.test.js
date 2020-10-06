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
        date: new Date(1487424751000),
        movements: [
          {
            id: '137884380',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 500,
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
            sum: -500,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: 'ул. Пушкина, дом Колотушкина'
      }
    ]
  ])('converts cash replenishment', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
