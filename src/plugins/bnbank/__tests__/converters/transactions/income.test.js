import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        accountType: '1',
        concreteType: '1',
        accountNumber: '3001779330014439',
        operationName: 'Возврат (refund) в устройствах других банков',
        operationPlace: 'AEROFLOT PAO',
        merchantId: '121440',
        transactionDate: 1646309880000,
        operationDate: 1646161620000,
        transactionAmount: 14808,
        transactionCurrency: '643',
        operationAmount: 514.11,
        operationCurrency: '933',
        operationSign: '1',
        actionGroup: 1802,
        operationClosingBalance: 1450.53,
        cardPAN: '5265520001946900',
        operationCode: 2
      },
      [
        {
          id: '3001779330014439',
          type: 'card',
          title: 'Цифровая карта 1-2-3, BYN',
          currencyCode: '933',
          instrument: 'BYN',
          balance: 528.44,
          syncID: ['3001779330014439', '6900'],
          rkcCode: '5761',
          cardHash: 'P-KdaFwKcI8_vOG004LaKNy9VnILWSZEnlnXDajOMP3_ThO2Kuwu-g_zvo-wlgxZw4fm7wsNN7muTG9RQfMkoA'
        }
      ],
      {
        date: new Date('2022-03-01T19:07:00.000Z'),
        movements:
          [
            {
              id: null,
              account: { id: '3001779330014439' },
              invoice: {
                instrument: 'RUB',
                sum: 14808
              },
              sum: 514.11,
              fee: 0
            }
          ],
        merchant: {
          mcc: null,
          location: null,
          fullTitle: 'AEROFLOT PAO'
        },
        comment: 'Возврат (refund) в устройствах других банков',
        hold: false
      }
    ],
    [
      {
        accountType: '0',
        concreteType: '0',
        accountNumber: '1107239780000085',
        operationName: 'Капитализация. Удержано подоходного налога 3.13',
        transactionDate: 1668485142000,
        operationDate: 1668485142000,
        transactionAmount: 24.08,
        transactionCurrency: '978',
        operationAmount: 24.08,
        operationCurrency: '978',
        operationSign: '1',
        actionGroup: 19,
        clientName: 'Николаев Николай Николаевич',
        operationClosingBalance: 8279.47,
        operationCode: 999
      },
      [
        {
          id: '1107239780000085',
          type: 'deposit',
          title: 'Депозит Безотзывный online-вклад',
          currencyCode: '978',
          instrument: 'EUR',
          balance: 8279.47,
          syncID: ['1107239780000085']
        }
      ],
      {
        date: new Date('2022-11-15T04:05:42.000Z'),
        movements:
          [
            {
              id: null,
              account: { id: '1107239780000085' },
              invoice: null,
              sum: 20.95,
              fee: 3.13
            }
          ],
        merchant: null,
        comment: 'Капитализация',
        hold: false
      }
    ]
  ])('converts income', (apiTransaction, accounts, transaction) => {
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
