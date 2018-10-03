/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'
import { entity } from '../../../zenmoney_entity/transaction'

describe('transaction converter PURCHASE', () => {
  it('should return zenmoney transaction object', () => {
    const transaction = converter(
      {
        actor: 'CONSUMER',
        bonus: {
          amount: 18,
          availabilityDate: 1504072639000,
          currency: 'BAL',
          details: [
            {
              action: 'Базовая акция по картам Standart 0.5%',
              amount: 18
            }
          ],
          income: true,
          incomeDate: 1503019362000,
          incomeExpectations: true
        },
        channel: 'POS',
        contractId: 9870000,
        counterpartyCode: 'aliexpress',
        date: 1502863039000,
        description: 'ALIEXPRESS.COM, London',
        eventId: null,
        id: 176520706,
        itemType: 'OPERATION',
        mcc: {
          description: 'Торговля по каталогам',
          code: '5964',
          groupDescription: 'Торговля по каталогам',
          groupCode: 'catalog-marketing'
        },
        money: {
          accountAmount: {
            amount: 351.94,
            currency: 'RUR'
          },
          amount: 5.94,
          amountDetail: {
            amount: 351.94,
            own: 351.94,
            credit: 0,
            commission: 0,
            acquirerCommission: 0
          },
          currency: 'USD',
          income: false
        },
        movements: [
          {
            amount: 373.76,
            currency: 'RUR',
            date: 1502863039000,
            id: '176520706#266667796',
            income: false,
            rate: 59.93,
            type: 'AUTHORIZATION_HOLD'
          },
          {
            amount: 351.94,
            currency: 'RUR',
            date: 1503018131000,
            id: '176520706#344261397',
            income: false,
            rate: 59.25,
            type: 'WITHDRAW'
          },
          {
            amount: 18,
            currency: 'BAL',
            date: 1503019362000,
            id: '176520706#267729288',
            income: true,
            type: 'BONUS_INCOME'
          }
        ],
        status: 'DONE',
        title: 'Aliexpress',
        type: 'PURCHASE'
      },
      {
        '9870000': 'c-1230000'
      }
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '176520706',
      date: 1502863039000,
      income: 0,
      outcome: 351.94,
      incomeAccount: 'c-1230000',
      outcomeAccount: 'c-1230000',
      opOutcome: 5.94,
      opOutcomeInstrument: 'USD',
      payee: 'ALIEXPRESS.COM, London',
      mcc: 5964,
      comment: [
        'Aliexpress'
      ].join('\n')
    }))
  })
})
