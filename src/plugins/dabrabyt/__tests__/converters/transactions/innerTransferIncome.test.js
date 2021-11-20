import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        operationName: 'Зачисление перевода с карточки',
        operationPlace: 'PEREVOD S 512722******6946',
        merchantId: '340340822003',
        transactionAuthCode: '680942',
        transactionDate: 1624015080000,
        operationDate: 1623877200000,
        transactionAmount: 747,
        transactionCurrency: 'BYN',
        operationAmount: 747,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 1802,
        operationClosingBalance: 797.38,
        cardPAN: '4214878092554131',
        operationCode: 2
      },
      { id: '6370004760', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date(1623877200000),
        movements: [
          {
            id: '680942',
            account: { id: '6370004760' },
            invoice: null,
            sum: 747,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: ['512722******6946']
            },
            invoice: null,
            sum: -747,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'PEREVOD S 512722******6946',
        groupKeys: [
          '2021-06-17_BYN_747_421487******4131'
        ]
      }
    ],
    [
      {
        operationName: 'Зачисление перевода с карточки',
        operationPlace: 'PEREVOD S 421487******4131',
        merchantId: '340340822003',
        transactionAuthCode: '684040',
        transactionDate: 1624015080000,
        operationDate: 1623877200000,
        transactionAmount: 747,
        transactionCurrency: 'BYN',
        operationAmount: 747,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 1802,
        operationClosingBalance: 1831.09,
        cardPAN: '4214879003476083',
        operationCode: 2
      },
      { id: '502-1403 BYR', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date(1623877200000),
        movements: [
          {
            id: '684040',
            account: { id: '502-1403 BYR' },
            invoice: null,
            sum: 747,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: ['421487******4131']
            },
            invoice: null,
            sum: -747,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'PEREVOD S 421487******4131',
        groupKeys: [
          '2021-06-17_BYN_747_421487******6083'
        ]
      }
    ],
    [
      {
        operationName: 'Зачисление перевода с карточки',
        operationPlace: 'PEREVOD S 421487******4131',
        merchantId: '340340822003',
        transactionAuthCode: '354251',
        transactionDate: 1621248600000,
        operationDate: 1621026000000,
        transactionAmount: 100,
        transactionCurrency: 'USD',
        operationAmount: 100,
        operationCurrency: 'USD',
        operationSign: '1',
        actionGroup: 1802,
        operationClosingBalance: 300,
        cardPAN: '5127229215986946',
        operationCode: 2
      },
      { id: '6000077126', type: 'ccard', instrument: 'USD' },
      {
        hold: false,
        date: new Date(1621026000000),
        movements: [
          {
            id: '354251',
            account: { id: '6000077126' },
            invoice: null,
            sum: 100,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'USD',
              company: null,
              syncIds: ['421487******4131']
            },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'PEREVOD S 421487******4131',
        groupKeys: [
          '2021-05-15_USD_100_512722******6946'
        ]
      }
    ]
  ])('converts OuterIncome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
