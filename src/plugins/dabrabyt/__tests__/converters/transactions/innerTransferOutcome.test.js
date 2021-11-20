import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        operationName: 'Перевод средств между своими карточками в Дабрабыт-онлайн',
        operationPlace: 'PEREVOD NA 421487******4131',
        merchantId: '340340822003',
        transactionAuthCode: '680939',
        transactionDate: 1624018020000,
        operationDate: 1623877200000,
        transactionAmount: 747,
        transactionCurrency: 'BYN',
        operationAmount: 300,
        operationCurrency: 'USD',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 0,
        cardPAN: '5127229215986946',
        operationCode: 3
      },
      { id: '6000077126', type: 'ccard', instrument: 'USD' },
      {
        hold: false,
        date: new Date(1623877200000),
        movements: [
          {
            id: '680939',
            account: { id: '6000077126' },
            invoice: null,
            sum: -300,
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
            invoice: { sum: 300, instrument: 'USD' },
            sum: 747,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'PEREVOD NA 421487******4131',
        groupKeys: [
          '2021-06-17_BYN_747_421487******4131'
        ]
      }
    ],
    [
      {
        operationName: 'Перевод средств между своими карточками в Дабрабыт-онлайн',
        operationPlace: 'PEREVOD NA 421487******6083',
        merchantId: '340340822003',
        transactionAuthCode: '684037',
        transactionDate: 1624018020000,
        operationDate: 1623877200000,
        transactionAmount: 747,
        transactionCurrency: 'BYN',
        operationAmount: 747,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 0.39,
        cardPAN: '4214878092554131',
        operationCode: 3
      },
      { id: '6370004760', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date(1623877200000),
        movements: [
          {
            id: '684037',
            account: { id: '6370004760' },
            invoice: null,
            sum: -747,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: ['421487******6083']
            },
            invoice: null,
            sum: 747,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'PEREVOD NA 421487******6083',
        groupKeys: [
          '2021-06-17_BYN_747_421487******6083'
        ]
      }
    ],
    [
      {
        operationName: 'Перевод средств между своими карточками в Дабрабыт-онлайн',
        operationPlace: 'PEREVOD NA 512722******6946',
        merchantId: '340340822003',
        transactionAuthCode: '354250',
        transactionDate: 1621252800000,
        operationDate: 1621026000000,
        transactionAmount: 100,
        transactionCurrency: 'USD',
        operationAmount: 255,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 1476.14,
        cardPAN: '4214878092554131',
        operationCode: 3
      },
      { id: '6370004760', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date(1621026000000),
        movements: [
          {
            id: '354250',
            account: { id: '6370004760' },
            invoice: null,
            sum: -255,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'USD',
              company: null,
              syncIds: ['512722******6946']
            },
            invoice: { sum: 255, instrument: 'BYN' },
            sum: 100,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'PEREVOD NA 512722******6946',
        groupKeys: [
          '2021-05-15_USD_100_512722******6946'
        ]
      }
    ]
  ])('converts InnerOutcome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
