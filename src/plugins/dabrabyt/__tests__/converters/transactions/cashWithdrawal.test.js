import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        operationName: 'снятие наличных в устройствах банков-партнеров',
        operationPlace: 'ATMALF HO16 TROPINKA',
        merchantId: '000027090016',
        transactionAuthCode: '526491',
        transactionDate: 1620821220000,
        operationDate: 1620334800000,
        transactionAmount: 750,
        transactionCurrency: 'BYN',
        operationAmount: 750,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 2.92,
        cardPAN: '5127227260553330',
        operationCode: 3
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-05-06T21:00:00.000Z'),
        movements: [
          {
            id: '526491',
            account: { id: '5020028311' },
            invoice: null,
            sum: -750,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'BYN',
              company: 'ATMALF HO16 TROPINKA',
              syncIds: null
            },
            invoice: null,
            sum: 750,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        operationName: 'снятие наличных в устройствах иных банков ',
        operationPlace: 'MTB INSTITUTION',
        merchantId: 'MTB INSTITUTION',
        transactionAuthCode: '121872',
        transactionDate: 1626091380000,
        operationDate: 1625778000000,
        transactionAmount: 745,
        transactionCurrency: 'BYN',
        operationAmount: 745,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 4.72,
        cardPAN: '5127227260553330',
        operationCode: 3
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-07-08T21:00:00.000Z'),
        movements: [
          {
            id: '121872',
            account: { id: '5020028311' },
            invoice: null,
            sum: -745,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'BYN',
              company: 'MTB INSTITUTION',
              syncIds: null
            },
            invoice: null,
            sum: 745,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
