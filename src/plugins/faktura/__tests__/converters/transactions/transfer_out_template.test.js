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
        cardId: 1230000,
        channel: 'WEB',
        contractId: 9870000,
        date: 1493300365000,
        eventId: null,
        id: 152495210,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 300,
            currency: 'RUR'
          },
          amount: 300,
          amountDetail: {
            amount: 300,
            own: 300,
            credit: 0,
            commission: 0
          },
          currency: 'RUR',
          income: false
        },
        movements: [
          {
            amount: 300,
            contractId: 9870000,
            currency: 'RUR',
            date: 1493300365000,
            id: '152495210#207042606',
            income: false,
            type: 'AUTHORIZATION_HOLD'
          },
          {
            amount: 300,
            currency: 'RUR',
            date: 1493300383000,
            id: '152495210#278157877',
            income: false,
            type: 'WITHDRAW'
          },
          {
            amount: 300,
            contractId: 9870000,
            currency: 'RUR',
            date: 1493300402000,
            id: '152495210#152495448',
            income: true,
            type: 'INCOME'
          }
        ],
        payTemplate: {
          id: '24596799',
          name: '2960117000000'
        },
        paymentDetail: {
          transferKey: '655437000',
          ean: '2 960117 000000',
          targetName: 'Иван'
        },
        serviceCode: 'DP1Self',
        status: '0#DONE',
        title: '2960117000000',
        type: 'TRANSFER',
        typeName: 'Перевод на свою карту'
      },
      {
        date: new Date(1493300365000),
        movements: [
          {
            id: '152495210',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: -300,
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
            sum: 300,
            fee: 0
          }
        ],
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'Перевод на свою карту 2960117000000',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome transfer to card 2', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
