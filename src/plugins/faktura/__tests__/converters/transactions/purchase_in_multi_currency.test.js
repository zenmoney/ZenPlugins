/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'

describe('transaction converter PURCHASE', () => {
  it('should return zenmoney transaction object', () => {
    const transaction = converter(
      {
        actor: 'CONSUMER',
        bonus: {
          amount: 25,
          availabilityDate: 1485997837000,
          currency: 'BAL',
          income: false,
          incomeDate: 1484791076000,
          incomeExpectations: true
        },
        channel: 'POS',
        contractId: 9870000,
        date: 1484788237000,
        description: 'WWW ALIEXPRESS COM, LONDON',
        eventId: null,
        id: 131935128,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 502.46,
            currency: 'RUR'
          },
          amount: 8.49,
          amountDetail: {
            amount: 502.46,
            own: 502.46,
            commission: 0,
            credit: 0
          },
          currency: 'USD',
          income: true
        },
        movements: [
          {
            amount: 502.46,
            currency: 'RUR',
            date: 1484788237000,
            id: '131935128#220883105',
            income: true,
            type: 'INCOME'
          },
          {
            amount: 25,
            currency: 'BAL',
            date: 1484791076000,
            id: '131935128#159175390',
            income: false,
            type: 'BONUS_WITHDRAW'
          }
        ],
        operationAddress: 'WWW ALIEXPRESS COM, LONDON',
        status: 'DONE',
        terminalLocationName: 'WWW ALIEXPRESS COM, LONDON',
        title: 'Возврат платежа: WWW ALIEXPRESS COM',
        type: 'PURCHASE'
      },
      {
        9870000: 'c-1230000'
      }
    )

    expect(transaction).toEqual({
      date: new Date(1484788237000),
      movements: [
        {
          id: '131935128',
          account: { id: 'c-1230000' },
          invoice: { sum: 8.49, instrument: 'USD' },
          sum: 502.46,
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
    })
  })
})
