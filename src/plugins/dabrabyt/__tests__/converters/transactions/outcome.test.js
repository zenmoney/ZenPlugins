import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        operationName: 'Абонентская плата за ежемесячное обслуживание БПК (Абонентская плата за ежемесячное обслуживание БПК)',
        transactionDate: 1627890960000,
        operationDate: 1627890960000,
        transactionAmount: 0,
        transactionCurrency: 'BYN',
        operationAmount: 1.5,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 5003,
        clientName: 'Николаев Николай Николаевич',
        operationClosingBalance: 0.22,
        operationCode: 30008
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-08-02T07:56:00.000Z'),
        movements: [
          {
            id: '6e5860a4d0ab73ecb1735226d5c94265',
            account: { id: '5020028311' },
            invoice: null,
            sum: -1.5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Абонентская плата за ежемесячное обслуживание БПК (Абонентская плата за ежемесячное обслуживание БПК)'
      }
    ],
    [
      {
        operationName: 'Плата за пользование услугой СМС-оповещение (Плата за пользование услугой СМС-оповещение)',
        transactionDate: 1627638180000,
        operationDate: 1627638180000,
        transactionAmount: 0,
        transactionCurrency: 'BYN',
        operationAmount: 3,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 5003,
        clientName: 'Николаев Николай Николаевич',
        operationClosingBalance: 1.72,
        operationCode: 30008
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-07-30T09:43:00.000Z'),
        movements: [
          {
            id: '32304ec84b41d40c7c5a15c908860499',
            account: { id: '5020028311' },
            invoice: null,
            sum: -3,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Плата за пользование услугой СМС-оповещение (Плата за пользование услугой СМС-оповещение)'
      }
    ],
    [
      {
        operationPlace: 'BLR MINSK ',
        merchantId: '5812',
        transactionAuthCode: '614804',
        operationDate: 1628441081000,
        transactionAmount: 17.4,
        transactionCurrency: 'BYN',
        operationAmount: 17.4,
        operationCurrency: 'BYN',
        operationSign: '-1',
        operationType: 6
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: true,
        date: new Date('2021-08-08T16:44:41.000Z'),
        movements: [
          {
            id: '614804',
            account: { id: '5020028311' },
            invoice: null,
            sum: -17.4,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'BLR MINSK',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        operationName: 'Оплата товаров/услуг в ОТС',
        operationPlace: 'DABRABYT ERIP PAYMENTS',
        merchantId: '340340822000',
        transactionAuthCode: '907906',
        transactionDate: 1623678360000,
        operationDate: 1623531600000,
        mcc: '6012',
        transactionAmount: 320,
        transactionCurrency: 'BYN',
        operationAmount: 320,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 241.72,
        cardPAN: '5127227260553330',
        operationCode: 3
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-06-12T21:00:00.000Z'),
        movements: [
          {
            id: '907906',
            account: { id: '5020028311' },
            invoice: null,
            sum: -320,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'DABRABYT ERIP PAYMENTS',
          mcc: 6012,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
