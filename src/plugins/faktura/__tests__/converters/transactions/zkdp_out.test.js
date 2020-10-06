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
        cardId: 1230000,
        channel: 'WEB',
        connector: 'на имя',
        contractId: 1141426,
        date: 1487138070000,
        eventId: null,
        id: 137032162,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 20,
            currency: 'USD'
          },
          amount: 20,
          amountDetail: {
            amount: 20,
            own: 20,
            credit: 0,
            commission: 0
          },
          currency: 'USD',
          income: false
        },
        movements: [
          {
            amount: 20,
            currency: 'USD',
            date: 1487138070000,
            id: '137032162#170897529',
            income: false,
            type: 'AUTHORIZATION_HOLD'
          },
          {
            amount: 20,
            currency: 'USD',
            date: 1487138077000,
            id: '137032162#236000724',
            income: false,
            type: 'WITHDRAW'
          }
        ],
        paymentDetail: {
          transferKey: '648543240',
          transferStatus: 'DONE',
          city: 'Россия, Санкт-Петербург, coreWalletId: 88000'
        },
        serviceCode: 'DP2Wallet',
        status: '0#DONE',
        title: 'Петров Иван Иванович',
        type: 'ZKDP',
        typeName: 'Перевод «Золотая Корона»',
        walletId: 88410
      },
      {
        date: new Date(1487138070000),
        movements: [
          {
            id: '137032162',
            account: { id: 'w-88410' },
            invoice: null,
            sum: -20,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'USD',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 20,
            fee: 0
          }
        ],
        hold: false,
        merchant: {
          country: 'Россия',
          city: 'Санкт-Петербург',
          title: 'Петров Иван Иванович',
          mcc: null,
          location: null
        },
        comment: 'Перевод «Золотая Корона»'
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, {})).toEqual(transaction)
  })
})
