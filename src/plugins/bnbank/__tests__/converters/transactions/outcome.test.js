import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        accountType: '1',
        concreteType: '1',
        accountNumber: '3001779330015745',
        operationName: 'Оплата товаров, работ или услуг',
        operationPlace: 'YM*playo',
        merchantId: '9296162365',
        transactionAuthCode: '639081',
        transactionDate: 1645183320000,
        operationDate: 1645006320000,
        transactionAmount: 500,
        transactionCurrency: '643',
        operationAmount: 17.43,
        operationCurrency: '933',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 179.61,
        cardPAN: '5265520001083209',
        operationCode: 3
      },
      [
        {
          id: '3001779330015745',
          type: 'card',
          title: 'Цифровая карта 1-2-3, BYN',
          currencyCode: '933',
          instrument: 'BYN',
          balance: 16.36,
          syncID: ['3001779330015745', '3209'],
          rkcCode: '5761',
          cardHash: 'KWentZ2gnMJh-X-nu5P0n_pI1NH3yRcQWSIo6L9yosYbPAiEDT7s4Do1WKRhS3qrUqn4Vf2ghhj2LLhW-fA3Fg'
        }
      ],
      {
        date: new Date('2022-02-16T10:12:00.000Z'),
        hold: false,
        movements: [
          {
            account: { id: '3001779330015745' },
            fee: 0,
            id: '639081',
            invoice: {
              instrument: 'RUB',
              sum: -500
            },
            sum: -17.43
          }
        ],
        merchant: {
          fullTitle: 'YM*playo',
          location: null,
          mcc: null
        },
        comment: 'Оплата товаров, работ или услуг'
      }
    ],
    [
      {
        accountType: '1',
        concreteType: '1',
        accountNumber: '3001779330015745',
        operationName: 'Оплата товаров, работ или услуг',
        operationPlace: 'YM*playo',
        merchantId: '9296162365',
        transactionAuthCode: '657049',
        transactionDate: 1645183320000,
        operationDate: 1645007280000,
        transactionAmount: 500,
        transactionCurrency: '643',
        operationAmount: 17.43,
        operationCurrency: '933',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 162.18,
        cardPAN: '5265520001083209',
        operationCode: 3
      },
      [
        {
          id: '3001779330015745',
          type: 'card',
          title: 'Цифровая карта 1-2-3, BYN',
          currencyCode: '933',
          instrument: 'BYN',
          balance: 16.36,
          syncID: ['3001779330015745', '3209'],
          rkcCode: '5761',
          cardHash: 'KWentZ2gnMJh-X-nu5P0n_pI1NH3yRcQWSIo6L9yosYbPAiEDT7s4Do1WKRhS3qrUqn4Vf2ghhj2LLhW-fA3Fg'
        }
      ],
      {
        date: new Date('2022-02-16T10:28:00.000Z'),
        hold: false,
        movements: [
          {
            account: { id: '3001779330015745' },
            fee: 0,
            id: '657049',
            invoice: {
              instrument: 'RUB',
              sum: -500
            },
            sum: -17.43
          }
        ],
        merchant: {
          fullTitle: 'YM*playo',
          location: null,
          mcc: null
        },
        comment: 'Оплата товаров, работ или услуг'
      }
    ],
    [
      {
        accountNumber: '2007549330000000',
        accountType: '1',
        cardPAN: '1*** **** **** 1234',
        merchantId: '1234',
        operationAmount: 3.49,
        operationCurrency: '840',
        operationDate: 1635058305000,
        operationPlace: 'APPLE.COM/BILL',
        operationSign: '-1',
        transactionAmount: 8.64,
        transactionAuthCode: '342346',
        transactionCurrency: '933'
      },
      [
        {
          id: '2007549330000000',
          type: 'card',
          title: 'Личные, BYN - "Maxima Plus"',
          currencyCode: '933',
          instrument: 'BYN',
          balance: 99.9,
          syncID: ['2007549330000000'],
          rkcCode: '004'
        }
      ],
      {
        hold: false,
        date: new Date(1635058305000),
        movements: [
          {
            id: '342346',
            account: { id: '2007549330000000' },
            sum: -8.64,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: 'APPLE.COM/BILL',
          location: null,
          mcc: null
        },
        comment: '3.49 USD'
      }
    ],
    [
      {
        accountType: '1',
        concreteType: '1',
        accountNumber: '3001788400000904',
        operationName: 'Оплата товаров, работ или услуг',
        operationPlace: 'GOOGLE *YouTubePremium',
        merchantId: '249057000020254',
        transactionAuthCode: '925039',
        transactionDate: 1647518940000,
        operationDate: 1647376500000,
        transactionAmount: 119,
        transactionCurrency: '32',
        operationAmount: 1.2,
        operationCurrency: '840',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 4.33,
        cardPAN: '5265520002109409',
        operationCode: 3
      },
      [
        {
          id: '3001788400000904',
          type: 'card',
          title: 'Цифровая карта 1-2-3, USD',
          currencyCode: '840',
          instrument: 'USD',
          balance: 22.65,
          syncID: [
            '3001788400000904',
            '9409'
          ],
          rkcCode: '5761'
        }
      ],
      {
        date: new Date('2022-03-15T20:35:00.000Z'),
        movements:
          [
            {
              id: '925039',
              account: { id: '3001788400000904' },
              invoice: {
                sum: -119,
                instrument: 'ARS'
              },
              sum: -1.2,
              fee: 0
            }
          ],
        merchant:
          {
            mcc: null,
            location: null,
            fullTitle: 'GOOGLE *YouTubePremium'
          },
        comment: 'Оплата товаров, работ или услуг',
        hold: false
      }
    ]
  ])('converts outcome', (apiTransaction, accounts, transaction) => {
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
