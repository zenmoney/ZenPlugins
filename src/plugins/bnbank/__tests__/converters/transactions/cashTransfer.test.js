import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        accountNumber: '2000000000000000',
        accountType: '1',
        actionGroup: 1802,
        cardPAN: '450000******0000',
        concreteType: '1',
        merchantId: '1600000',
        operationAmount: 3900,
        operationCode: 3,
        operationCurrency: '933',
        operationDate: 1553029200000,
        operationName: 'Снятие со счета наличных в ПВН банка',
        operationPlace: 'POV-7 BNB PVN',
        operationSign: '-1',
        rrn: '3070000',
        transactionAmount: 3900,
        transactionAuthCode: '791000',
        transactionCurrency: '933',
        transactionDate: 1553158380000
      },
      {
        hold: false,
        date: new Date('2019-03-19T21:00:00.000Z'),
        movements: [
          {
            id: '791000',
            account: { id: '2000000000000000' },
            sum: -3900,
            fee: 0,
            invoice: null
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'BYN',
              syncIds: null,
              type: 'cash'
            },
            sum: 3900,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        accountNumber: '2000000000000000',
        operationName: 'Пополнение карт наличными через ЕРИП',
        operationPlace: 'POPOLNENIE KARTY',
        merchantId: '450000000000',
        transactionAuthCode: '496154',
        transactionDate: 1633951680000,
        operationDate: 1633886340000,
        transactionAmount: 100,
        transactionCurrency: '933',
        operationAmount: 100,
        operationCurrency: '933',
        operationSign: '1',
        actionGroup: 1802,
        operationClosingBalance: 300,
        cardPAN: '450000******0000',
        operationCode: 2
      },
      {
        hold: false,
        date: new Date('2021-10-10T17:19:00.000Z'),
        movements: [
          {
            id: '496154',
            account: { id: '2000000000000000' },
            sum: 100,
            fee: 0,
            invoice: null
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'BYN',
              syncIds: null,
              type: 'cash'
            },
            sum: -100,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('convert into cash deposit transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [
      {
        id: '2000000000000000',
        instrument: 'BYN',
        syncID: ['2000000000000000']
      }
    ])).toEqual(transaction)
  })
})
