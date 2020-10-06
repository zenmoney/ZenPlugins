import { converter } from '../../../converters/transaction'

describe('convertTransactions', () => {
  it.each([
    [
      {
        date: 1577958588000,
        itemType: 'OPERATION',
        bonus: {
          bonuslessReason: 'OTHER',
          incomeExpectations: false,
          details: []
        },
        typeName: 'Пополнение с карты',
        channel: 'MOBILE',
        movements: [
          {
            date: 1577958588000,
            income: true,
            amount: 10000.0,
            currency: 'RUR',
            id: '401018486#06a5bd15-81e5-4648-8839-d59cae674c6c',
            type: 'INCOME'
          }
        ],
        title: 'Тинькофф *8897',
        type: 'RECHARGE',
        actor: 'CONSUMER',
        counterpartyCode: 'tinkoff',
        money: {
          income: true,
          amount: 10000.0,
          amountDetail: {
            amount: 10000.0,
            commission: 0.0
          },
          currency: 'RUR',
          accountAmount: {
            amount: 10000.0,
            currency: 'RUR'
          }
        },
        paymentDetail: {
          rechargeCardWithdraw: 10000.0,
          sourcePaySys: 'MASTERCARD'
        },
        contractId: 3353117,
        id: 401018486,
        statisticGroup: {
          code: 'pulling',
          name: 'С привязанной карты'
        },
        status: '0#DONE'
      },
      {
        hold: false,
        date: new Date(1577958588000),
        movements: [
          {
            id: '401018486',
            account: { id: 'account' },
            invoice: null,
            sum: 10000,
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
            sum: -10000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Тинькофф *8897',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        date: 1586198805000,
        itemType: 'OPERATION',
        bonus: {
          bonuslessReason: 'OTHER',
          incomeExpectations: false,
          details: []
        },
        typeName: 'Пополнение с карты',
        channel: 'MOBILE',
        movements: [
          {
            date: 1586198805000,
            income: true,
            amount: 3000.0,
            currency: 'RUR',
            id: '423572354#c39fe6cb-c695-47c4-9c1d-81d7424d39c0',
            type: 'INCOME'
          }
        ],
        title: 'MASTERCARD *8897',
        type: 'RECHARGE',
        actor: 'CONSUMER',
        counterpartyCode: 'mastercard',
        money: {
          income: true,
          amount: 3000.0,
          amountDetail: {
            amount: 3000.0,
            commission: 0.0
          },
          currency: 'RUR',
          accountAmount: {
            amount: 3000.0,
            currency: 'RUR'
          }
        },
        paymentDetail: {
          rechargeCardWithdraw: 3000.0,
          sourcePaySys: 'MASTERCARD'
        },
        contractId: 3353117,
        id: 423572354,
        statisticGroup: {
          code: 'pulling',
          name: 'С привязанной карты'
        },
        status: '0#DONE'
      },
      {
        hold: false,
        date: new Date(1586198805000),
        movements: [
          {
            id: '423572354',
            account: { id: 'account' },
            invoice: null,
            sum: 3000,
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
            sum: -3000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: '*8897',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 3353117: 'account' })).toEqual(transaction)
  })
})
