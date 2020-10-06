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
          amount: 3,
          availabilityDate: 1493775906000,
          currency: 'BAL',
          details: [],
          income: false,
          incomeDate: 1493775906000,
          incomeExpectations: true
        },
        channel: 'POS',
        connector: ':',
        contractId: 9870000,
        date: 1493774221000,
        description: 'WWW ALIEXPRESS COM, LONDON',
        eventId: null,
        id: 153786878,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 50.69,
            currency: 'RUR'
          },
          amount: 0.89,
          amountDetail: {
            amount: 50.69,
            own: 50.69,
            credit: 0,
            commission: 0
          },
          currency: 'USD',
          income: true
        },
        movements: [
          {
            amount: 50.69,
            currency: 'RUR',
            date: 1493774221000,
            id: '153786878#281473632',
            income: true,
            type: 'INCOME'
          },
          {
            amount: 3,
            currency: 'BAL',
            date: 1493775906000,
            id: '153786878#210018277',
            income: false,
            type: 'BONUS_WITHDRAW'
          }
        ],
        operationAddress: 'WWW ALIEXPRESS COM, LONDON',
        status: 'DONE',
        terminalLocationName: 'WWW ALIEXPRESS COM, LONDON',
        title: 'WWW ALIEXPRESS COM',
        type: 'REFUND',
        typeName: 'Возврат платежа'
      },
      {
        date: new Date(1493774221000),
        movements: [
          {
            id: '153786878',
            account: { id: 'c-1230000' },
            invoice: { sum: 0.89, instrument: 'USD' },
            sum: 50.69,
            fee: 0
          }
        ],
        comment: 'Возврат платежа',
        hold: false,
        merchant: {
          country: null,
          city: 'LONDON',
          title: 'WWW ALIEXPRESS COM',
          mcc: null,
          location: null
        }
      }
    ]
  ])('converts refund', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
