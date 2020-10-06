/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'

describe('transaction converter', () => {
  it.each([
    [
      {
        actor: 'CONSUMER',
        cardId: 1230000,
        channel: 'MOBILE',
        contractId: 9870000,
        date: 1486649343000,
        eventId: null,
        id: 135914720,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 1771.18,
            currency: 'RUR'
          },
          amount: 30,
          amountDetail: {
            amount: 1771.18,
            own: 1771.18,
            credit: 0,
            commission: 0
          },
          currency: 'USD',
          income: true
        },
        movements: [
          {
            amount: 1771.18,
            currency: 'RUR',
            date: 1486649343000,
            id: '135914720#168353555',
            income: false,
            type: 'WITHDRAW'
          },
          {
            amount: 30,
            currency: 'USD',
            date: 1486649343001,
            id: '135914720#168353555#income',
            income: true,
            type: 'INCOME'
          }
        ],
        rate: {
          amount: '59.0392',
          date: 1486649343000,
          type: 'SALE'
        },
        serviceCode: 'WLT_C2W',
        status: '0#DONE',
        title: 'Курс 1$ = 59.0392₽',
        type: 'WALLET',
        typeName: 'Покупка валюты',
        walletId: 88410
      },
      {
        date: new Date(1486649343000),
        movements: [
          {
            id: '135914720',
            account: { id: 'c-1230000' },
            invoice: {
              sum: -30,
              instrument: 'USD'
            },
            sum: -1771.18,
            fee: 0
          },
          {
            id: null,
            account: { id: 'w-88410' },
            invoice: null,
            sum: 30,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: 'Покупка валюты Курс 1$ = 59.0392₽'
      }
    ]
  ])('converts buy dollars', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
