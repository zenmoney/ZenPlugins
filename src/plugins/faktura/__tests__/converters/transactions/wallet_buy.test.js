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
    expect(converter(apiTransaction, { 9870000: 'c-1230000' }, { 'w-88410': { id: 'account' } })).toEqual(transaction)
  })

  it.each([
    [
      {
        date: 1508164789000,
        walletId: 297926,
        itemType: 'OPERATION',
        serviceCode: 'WLT_C2W',
        typeName: 'Покупка валюты',
        channel: 'MOBILE',
        movements:
          [
            {
              date: 1508164789000,
              income: false,
              amount: 4069.8,
              currency: 'RUR',
              id: '194268638#300896792',
              type: 'WITHDRAW'
            },
            {
              date: 1508164789001,
              income: true,
              amount: 60,
              currency: 'EUR',
              id: '194268638#300896792#income',
              type: 'INCOME'
            }
          ],
        title: 'Курс 1€ = 67.8300₽',
        type: 'WALLET',
        actor: 'CONSUMER',
        money:
          {
            income: true,
            amount: 60,
            amountDetail: { amount: 4069.8, own: 4069.8, commission: 0, credit: 0 },
            currency: 'EUR',
            accountAmount: { amount: 4069.8, currency: 'RUR' }
          },
        rate: { date: 1508164789000, amount: '67.8300', type: 'SALE' },
        cardId: 943996,
        contractId: 772898,
        id: 194268638,
        statisticGroup: { code: 'wallet-operations', name: 'Покупка валюты' },
        status: '0#DONE'
      },
      {
        date: new Date(1508164789000),
        movements:
          [
            {
              id: '194268638',
              account: { id: 'c-2098804' },
              invoice: { sum: -60, instrument: 'EUR' },
              sum: -4069.8,
              fee: 0
            },
            {
              id: null,
              account: { id: 'w-297926' },
              invoice: null,
              sum: 60,
              fee: 0
            }
          ],
        hold: false,
        merchant: null,
        comment: 'Покупка валюты Курс 1€ = 67.8300₽'
      }
    ]
  ])('converts buy euro', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 772898: 'c-2098804', 1750460: 'w-297926' }, { 'w-297926': { id: '1750460' } })).toEqual(transaction)
  })

  it.each([
    [
      {
        date: 1607405492000,
        walletId: 409906,
        itemType: 'OPERATION',
        serviceCode: 'WLT_C2W',
        typeName: 'Покупка валюты',
        channel: 'MOBILE',
        movements:
          [
            {
              date: 1607405492000,
              income: false,
              amount: 271.14,
              currency: 'RUR',
              id: '481827537#923921212',
              type: 'WITHDRAW'
            },
            {
              date: 1607405492001,
              income: true,
              amount: 3,
              currency: 'EUR',
              id: '481827537#923921212#income',
              type: 'INCOME'
            }
          ],
        title: 'Курс 1€ = 90.3800₽',
        type: 'WALLET',
        actor: 'CONSUMER',
        counterpartyCode: 'eur',
        money:
          {
            income: true,
            amount: 3,
            amountDetail: { amount: 271.14, own: 271.14, commission: 0, credit: 0 },
            currency: 'EUR',
            accountAmount: { amount: 271.14, currency: 'RUR' }
          },
        rate: { date: 1607405492000, amount: '90.3800', type: 'SALE' },
        cardId: 738893,
        contractId: 589282,
        id: 481827537,
        statisticGroup: { name: 'Покупка валюты', code: 'wallet-operations' },
        status: '0#DONE'
      },
      {
        comment: 'Покупка валюты Курс 1€ = 90.3800₽',
        date: new Date(1607405492000),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: '481827537',
              account: { id: 'c-738893' },
              invoice: { sum: -3, instrument: 'EUR' },
              sum: -271.14,
              fee: 0
            },
            {
              id: null,
              account: { type: 'ccard', instrument: 'EUR', company: null, syncIds: null },
              invoice: null,
              sum: 3,
              fee: 0
            }
          ]
      }
    ]
  ])('converts not account', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 589282: 'c-738893', 1750460: 'w-297926' }, { 'w-297926': { id: '1750460' } })).toEqual(transaction)
  })
})
