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

  it.each([
    [
      {
        date: 1607767383000,
        itemType: 'OPERATION',
        serviceCode: 'DP2',
        bonus:
          {
            bonuslessReason: 'OTHER',
            incomeExpectations: false,
            details: []
          },
        typeName: 'Перевод «Золотая Корона»',
        channel: 'MOBILE',
        movements:
          [
            {
              date: 1607767383000,
              income: false,
              amount: 3030,
              contractId: 1280478,
              currency: 'RUR',
              id: '483192635#926170150',
              type: 'AUTHORIZATION_HOLD'
            },
            {
              date: 1607767397000,
              income: false,
              amount: 3030,
              currency: 'RUR',
              id: '483192635#905569593',
              type: 'WITHDRAW'
            }
          ],
        title: 'Николаев Н. Н.',
        type: 'ZKDP',
        payTemplate:
          {
            code: 'PAY_TEMPLATE221181181',
            repeatable: true,
            name: 'Николаев Н. Н.',
            accepted: true,
            id: '221181181'
          },
        actor: 'CONSUMER',
        connector: 'на имя',
        money:
          {
            income: false,
            amount: 3030,
            amountDetail: { amount: 3000, own: 3030, commission: 30, credit: 0 },
            currency: 'RUR',
            accountAmount: { amount: 3000, currency: 'RUR' }
          },
        paymentDetail:
          {
            payee: 'Николаев Николай Николаевич',
            transferStatus: 'DONE',
            city: 'Молдова, Кишинев',
            transferKey: '631146835'
          },
        cardId: 1565125,
        contractId: 1280478,
        id: 483192635,
        statisticGroup: { code: 'transfers', name: 'Переводы' },
        status: '0#DONE'
      },
      {
        comment: 'Перевод «Золотая Корона»',
        date: new Date('2020-12-12T10:03:03.000Z'),
        hold: false,
        merchant:
          {
            country: 'Молдова',
            city: 'Кишинев',
            title: 'Николаев Н. Н.',
            mcc: null,
            location: null
          },
        movements:
          [
            {
              id: '483192635',
              account: { id: 'c-1565125' },
              invoice: null,
              sum: -3000,
              fee: -30
            },
            {
              id: null,
              account: { type: 'ccard', instrument: 'RUR', company: null, syncIds: null },
              invoice: null,
              sum: 3000,
              fee: 0
            }
          ]
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 1280478: 'c-1565125' })).toEqual(transaction)
  })
})
