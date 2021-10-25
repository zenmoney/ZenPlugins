import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        operationName: 'Зачисление перевода с карточки',
        operationPlace: 'PEREVOD S 421487******0738',
        merchantId: '340340822004',
        transactionAuthCode: '269898',
        transactionDate: 1634554620000,
        operationDate: 1634418000000,
        transactionAmount: 150,
        transactionCurrency: 'BYN',
        operationAmount: 150,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 1802,
        operationClosingBalance: 1916.8,
        cardPAN: '4214879003476083',
        operationCode: 2
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-10-17T00:00:00+03:00'),
        movements: [
          {
            id: '269898',
            account: { id: '5020028311' },
            invoice: null,
            sum: 150,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: ['421487******0738']
            },
            invoice: null,
            sum: -150,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'PEREVOD S 421487******0738',
        groupKeys: [
          '2021-10-17_BYN_150_421487******6083'
        ]
      }
    ]
  ])('converts OuterIncome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
