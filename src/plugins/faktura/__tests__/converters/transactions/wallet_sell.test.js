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
        date: 1498810400000,
        eventId: null,
        id: 166189057,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 61523.69,
            currency: 'RUR'
          },
          amount: 1041.01,
          amountDetail: {
            amount: 61523.69,
            own: 61523.69,
            commission: 0
          },
          currency: 'USD',
          income: false
        },
        movements: [
          {
            amount: 1041.01,
            currency: 'USD',
            date: 1498810400000,
            id: '166189057#241316215',
            income: false,
            type: 'WITHDRAW'
          },
          {
            amount: 61523.69,
            currency: 'RUR',
            date: 1498810400001,
            id: '166189057#241316215#income',
            income: true,
            type: 'INCOME'
          }
        ],
        rate: {
          amount: '59.1000',
          date: 1498810400000,
          type: 'PURCHASE'
        },
        serviceCode: 'WLT_W2C',
        status: '0#DONE',
        title: 'Курс 1$ = 59.1000₽',
        type: 'WALLET',
        typeName: 'Продажа валюты',
        walletId: 88410
      },
      {
        date: new Date(1498810400000),
        movements: [
          {
            id: '166189057',
            account: { id: 'c-1230000' },
            invoice: {
              sum: 1041.01,
              instrument: 'USD'
            },
            sum: 61523.69,
            fee: 0
          },
          {
            id: null,
            account: { id: 'w-88410' },
            invoice: null,
            sum: -1041.01,
            fee: 0
          }
        ],
        hold: false,
        merchant: null,
        comment: 'Продажа валюты Курс 1$ = 59.1000₽'
      }
    ]
  ])('converts sale dollars', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' }, { 'w-88410': { id: 'account' } })).toEqual(transaction)
  })

  it.each([
    [
      {
        date: 1605125443000,
        walletId: 403872,
        itemType: 'OPERATION',
        serviceCode: 'WLT_CLOSE',
        typeName: 'Продажа валюты',
        channel: 'MOBILE',
        movements:
          [
            {
              date: 1605125443000,
              income: false,
              amount: 184.99,
              currency: 'USD',
              id: '472348711#910263109',
              type: 'WITHDRAW'
            },
            {
              date: 1605125443001,
              income: true,
              amount: 14164.68,
              currency: 'RUR',
              id: '472348711#910263109#income',
              type: 'INCOME'
            }
          ],
        title: 'Курс 1$ = 76.5700₽',
        type: 'WALLET',
        actor: 'CONSUMER',
        counterpartyCode: 'usd',
        money:
          {
            income: false,
            amount: 184.99,
            amountDetail: { amount: 14164.68, own: 14164.68, commission: 0 },
            currency: 'USD',
            accountAmount: { amount: 14164.68, currency: 'RUR' }
          },
        rate: { date: 1605125443000, amount: '76.5700', type: 'PURCHASE' },
        cardId: 3208453,
        contractId: 2248303,
        id: 472348711,
        statisticGroup: { name: 'Прочее', code: 'income-undefined-operations' },
        status: '0#DONE'
      },
      {
        comment: 'Продажа валюты Курс 1$ = 76.5700₽',
        date: new Date('2020-11-11T20:10:43.000Z'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: '472348711',
              account: { id: 'c-3208453' },
              invoice: { sum: 184.99, instrument: 'USD' },
              sum: 14164.68,
              fee: 0
            },
            {
              id: null,
              account: { type: 'ccard', instrument: 'USD', company: null, syncIds: null },
              invoice: null,
              sum: -184.99,
              fee: 0
            }
          ]
      }
    ]
  ])('converts sale dollars from closed wallet', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 224830: 'c-320845', 2248303: 'c-3208453', 22483: 'c-32084' }, {})).toEqual(transaction)
  })
})
