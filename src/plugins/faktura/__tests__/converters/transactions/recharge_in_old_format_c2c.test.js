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
          bonuslessReason: 'OTHER',
          incomeExpectations: false
        },
        channel: 'WEB',
        contractId: 9870000,
        date: 1486798986000,
        eventId: null,
        id: 136250704,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 5000,
            currency: 'RUR'
          },
          amount: 5000,
          amountDetail: {
            amount: 5000,
            own: 5000,
            commission: 0,
            credit: 0
          },
          currency: 'RUR',
          income: true
        },
        movements: [
          {
            amount: 5000,
            currency: 'RUR',
            date: 1486798986000,
            id: '136250704#233873187',
            income: true,
            type: 'INCOME'
          }
        ],
        status: 'DONE',
        title: 'Пополнение с карты MASTERCARD',
        type: 'RECHARGE'
      },
      {
        date: new Date(1486798986000),
        movements: [
          {
            id: '136250704',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 5000,
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
            sum: -5000,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: null
      }
    ]
  ])('converts transfer from card 2', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
