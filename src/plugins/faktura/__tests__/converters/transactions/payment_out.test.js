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
          bonuslessReason: 'OTHER'
        },
        channel: 'WEB',
        contractId: 9870000,
        counterpartyCode: 'megafon',
        date: 1488341353000,
        eventId: null,
        id: 139939137,
        itemType: 'OPERATION',
        money: {
          amount: 100,
          accountAmount: {
            amount: 100,
            currency: 'RUR'
          },
          income: false,
          amountDetail: {
            amount: 100,
            commission: 0,
            credit: 0,
            own: 100
          },
          currency: 'RUR'
        },
        movements: [
          {
            amount: 100,
            currency: 'RUR',
            date: 1488341353000,
            id: '139939137#244529873',
            income: false,
            type: 'WITHDRAW'
          }
        ],
        serviceCode: 'GIN2S507',
        status: 'DONE',
        title: 'Сотовый - Мегафон (б/н) тел.9210000000',
        type: 'PAYMENT'
      },
      {
        date: new Date(1488341353000),
        movements: [
          {
            id: '139939137',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ],
        comment: null,
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'Сотовый - Мегафон (б/н) тел.9210000000',
          mcc: null,
          location: null
        }
      }
    ]
  ])('converts payment', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
