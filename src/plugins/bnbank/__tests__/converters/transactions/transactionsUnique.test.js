import { convertTestTransactions } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      [
        {
          accountType: '1',
          concreteType: '1',
          accountNumber: '3000000000000004',
          operationName: 'Оплата товаров, работ или услуг',
          operationPlace: 'FACEBK *4ZU6LGKAV2',
          merchantId: '180000000000000',
          transactionAuthCode: '985208',
          transactionDate: 1661342820000,
          operationDate: 1661215860000,
          transactionAmount: 9,
          transactionCurrency: '978',
          operationAmount: 9,
          operationCurrency: '978',
          operationSign: '-1',
          actionGroup: 1802,
          operationClosingBalance: 33.48,
          cardPAN: '526552******7140',
          operationCode: 3
        },
        {
          accountType: '1',
          concreteType: '1',
          accountNumber: '3000000000000004',
          operationName: 'Оплата товаров, работ или услуг',
          operationPlace: 'FACEBK *HC3NLGKAV2',
          merchantId: '180000000000000',
          transactionAuthCode: '843013',
          transactionDate: 1661426400000,
          operationDate: 1661268360000,
          transactionAmount: 9,
          transactionCurrency: '978',
          operationAmount: 9,
          operationCurrency: '978',
          operationSign: '-1',
          actionGroup: 1802,
          operationClosingBalance: 24.48,
          cardPAN: '526552******7140',
          operationCode: 3
        },
        {
          accountType: '1',
          concreteType: '1',
          accountNumber: '3000000000000004',
          operationName: 'Оплата товаров, работ или услуг',
          operationPlace: 'FACEBK *DXD5SKK9V2',
          merchantId: '180000000000000',
          transactionAuthCode: '196955',
          transactionDate: 1661515200000,
          operationDate: 1661379600000,
          transactionAmount: 9,
          transactionCurrency: '978',
          operationAmount: 9,
          operationCurrency: '978',
          operationSign: '-1',
          actionGroup: 1802,
          operationClosingBalance: 15.48,
          cardPAN: '526552******7140',
          operationCode: 3
        }
      ],
      [
        {
          id: '3000000000000004',
          type: 'card',
          title: 'Цифровая карта 1-2-3, EUR',
          currencyCode: '978',
          instrument: 'EUR',
          balance: 15.48,
          syncID: ['3000000000000004', '7140'],
          rkcCode: '5761',
          cardHash: 'VM0kPmMChd54A9pwdy_xWoeXOmK6SxHs1EQI-wz5EFqBPEhz40J89NpNV-yWuVcjSZcIbsBim_zfQP-puP9IbA'
        }
      ],
      [
        {
          comment: null,
          date: new Date('2022-08-23T00:51:00.000Z'),
          hold: false,
          merchant: {
            fullTitle: 'FACEBK *4ZU6LGKAV2',
            location: null,
            mcc: null
          },
          movements: [
            {
              account: { id: '3000000000000004' },
              fee: 0,
              id: '985208',
              invoice: null,
              sum: -9
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-08-23T15:26:00.000Z'),
          hold: false,
          merchant: {
            fullTitle: 'FACEBK *HC3NLGKAV2',
            location: null,
            mcc: null
          },
          movements: [
            {
              account: { id: '3000000000000004' },
              fee: 0,
              id: '843013',
              invoice: null,
              sum: -9
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-08-24T22:20:00.000Z'),
          hold: false,
          merchant: {
            fullTitle: 'FACEBK *DXD5SKK9V2',
            location: null,
            mcc: null
          },
          movements: [
            {
              account: { id: '3000000000000004' },
              fee: 0,
              id: '196955',
              invoice: null,
              sum: -9
            }
          ]
        }
      ]
    ]
  ])('converts outcome', (apiTransactions, accounts, transactions) => {
    expect(convertTestTransactions(apiTransactions, accounts)).toEqual(transactions)
  })
})
