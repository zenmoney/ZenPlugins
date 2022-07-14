import { convertTransaction } from '../../../converters'

const accounts = [
  {
    balance: 952.93,
    currencyCode: '933',
    id: '3001779330081234',
    instrument: 'BYN',
    rkcCode: '5761',
    syncID: ['1234'],
    title: 'Цифровая карта 1-2-3, BYN',
    type: 'card'
  }
]

describe('convertTransaction', () => {
  it.each([
    [
      {
        operationPlace: 'BLR MINSK.R-N ',
        merchantId: '5411',
        transactionAuthCode: '343839',
        operationDate: 1657210399000,
        transactionAmount: 32.89,
        transactionCurrency: '933',
        operationAmount: 32.89,
        operationCurrency: '933',
        operationSign: '-1',
        operationType: 6,
        cardPAN: '5*** **** **** 1234'
      },
      {
        comment: null,
        date: new Date('2022-07-07T16:13:19.000Z'),
        hold: true,
        merchant: null,
        movements: [
          {
            account: {
              id: '3001779330081234'
            },
            fee: 0,
            id: '343839',
            invoice: null,
            sum: -32.89
          }
        ]
      }
    ],
    [
      {
        operationPlace: 'BLR  MINSK.R-N ',
        merchantId: '5411',
        transactionAuthCode: '019578',
        operationDate: 1657725260000,
        transactionAmount: 24.76,
        transactionCurrency: '933',
        operationAmount: 24.76,
        operationCurrency: '933',
        operationSign: '-1',
        operationType: 6,
        cardPAN: '5*** **** **** 1234'
      },
      {
        comment: null,
        date: new Date('2022-07-13T15:14:20.000Z'),
        hold: true,
        merchant: null,
        movements: [
          {
            account: {
              id: '3001779330081234'
            },
            fee: 0,
            id: '019578',
            invoice: null,
            sum: -24.76
          }
        ]
      }
    ],
    [
      {
        operationPlace: 'BLR  MINSK ',
        merchantId: '5411',
        transactionAuthCode: '663417',
        operationDate: 1657705642000,
        transactionAmount: 8.69,
        transactionCurrency: '933',
        operationAmount: 8.69,
        operationCurrency: '933',
        operationSign: '-1',
        operationType: 6,
        cardPAN: '5*** **** **** 1234'
      },
      {
        comment: null,
        date: new Date('2022-07-13T09:47:22.000Z'),
        hold: true,
        merchant: null,
        movements: [
          {
            account: {
              id: '3001779330081234'
            },
            fee: 0,
            id: '663417',
            invoice: null,
            sum: -8.69
          }
        ]
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction({
      accountNumber: '1234',
      ...apiTransaction
    }, accounts, true)).toEqual(transaction)
  })
})
