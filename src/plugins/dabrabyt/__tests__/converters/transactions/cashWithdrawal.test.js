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
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 750,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'ATMALF HO16 TROPINKA',
          mcc: null,
          location: null
        },
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
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 745,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'MTB INSTITUTION',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        operationName: 'Внесение наличных в ПВН',
        operationPlace: 'GOLOVNOY OFIS',
        merchantId: '340340671020',
        transactionAuthCode: '362838',
        transactionDate: 1623670620000,
        operationDate: 1623358800000,
        transactionAmount: 2280,
        transactionCurrency: 'BYN',
        operationAmount: 2280,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 1802,
        operationClosingBalance: 2318.31,
        cardPAN: '5127227260553330',
        operationCode: 2
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-06-10T21:00:00.000Z'),
        movements: [
          {
            id: '362838',
            account: { id: '5020028311' },
            invoice: null,
            sum: 2280,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -2280,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'GOLOVNOY OFIS',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts cashWithdrawal transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
