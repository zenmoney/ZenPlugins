import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      // холд
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
        cardPAN: '5*** **** **** 1234',
        accountNumber: '3001779330085555'
      },
      [
        {
          balance: 952.93,
          cardHash: 'aqnytX6wrixe76-CvJlnpPWOtilM4UryO-MmvcsMykxrQaMH46Yvt1dE0FixgRu9AFGAI4j_GstJa1bZGwMOGw',
          currencyCode: '933',
          id: '3001779330085555',
          instrument: 'BYN',
          rkcCode: '5761',
          syncID: [
            '3001779330085555',
            '1234',
            '4567'
          ],
          title: 'Цифровая карта 1-2-3, BYN',
          type: 'card'
        }
      ],
      {
        comment: null,
        date: new Date('2022-07-07T16:13:19.000Z'),
        hold: true,
        merchant: null,
        movements: [
          {
            account: {
              id: '3001779330085555'
            },
            fee: 0,
            id: '343839',
            invoice: null,
            sum: -32.89
          }
        ]
      }
    ]
  ])('converts outcome', (apiTransaction, accounts, transaction) => {
    expect(convertTransaction(apiTransaction, accounts, true)).toEqual(transaction)
  })
})
