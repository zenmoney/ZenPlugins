import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        allowedOperations: [
          'RECEIPT'
        ],
        id: '297793972-2',
        operationDate: '2021-05-26T23:26:15+03:00',
        operationName: 'PROM.UA DEBIT',
        description: 'Переводы\nДебетовая карта,•1355',
        iconBg: '#3477B9',
        iconColor: '#3477B9',
        iconUrl: null,
        iconSize: 24,
        subjectAmount: -73000,
        subjectUnit: 'UAH',
        filterData: [
          {
            key: 'incomeOutlay',
            value: 'Расход'
          },
          {
            key: 'operationSum',
            value: '-73000'
          },
          {
            key: 'operationType',
            value: 'Переводы'
          },
          {
            key: 'operationCurrency',
            value: 'Гривна'
          },
          {
            key: 'account',
            value: '1337-CARD-UAH'
          }
        ]
      },
      {
        comment: 'PROM.UA DEBIT',
        date: new Date('2021-05-26T23:26:15+03:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '297793972-2',
            invoice: null,
            sum: -730.00
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'UAH',
              syncIds: null,
              type: 'ccard'
            },
            invoice: null,
            sum: 730.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        allowedOperations: ['RECEIPT'],
        id: '821229651-2',
        operationDate: '2022-10-03T19:39:04+03:00',
        operationName: 'Міжнародний переказ',
        targetAmount: -115200,
        targetUnit: 'UAH',
        description: 'transaction.details.general.info.description.fee\nПереводы\nКредитная карта,•5572',
        categoryIconUrl: 'https://sensebank.com.ua/upload/primob/categories_white/perekaz_1.svg',
        iconBg: null,
        iconColor: null,
        iconUrl: 'https://sensebank.com.ua/upload/primob/perekaz_2.png',
        iconSize: 40,
        categoryPFM: true,
        subjectAmount: -2995200,
        subjectUnit: 'UAH',
        filterData:
          [
            {
              key: 'incomeOutlay',
              value: 'Расход'
            },
            {
              key: 'operationSum',
              value: '-2995200'
            },
            {
              key: 'operationType',
              value: 'Переводы'
            },
            {
              key: 'operationCurrency',
              value: 'Гривна'
            },
            {
              key: 'account',
              value: '11665368-CARD-UAH'
            }
          ]
      },
      {
        hold: false,
        date: new Date('2022-10-03T19:39:04+03:00'),
        movements:
          [
            {
              id: '821229651-2',
              account: { id: '1337' },
              invoice: null,
              sum: -28800,
              fee: -1152
            },
            {
              id: null,
              account: {
                company: null,
                instrument: 'UAH',
                syncIds: null,
                type: 'ccard'
              },
              invoice: null,
              sum: 28800,
              fee: 0
            }
          ],
        merchant: null,
        comment: 'Міжнародний переказ'
      }
    ],
    [
      {
        allowedOperations: ['RECEIPT', 'CREATE_TEMPLATE'],
        id: '853737462-2',
        operationDate: '2022-11-21T11:11:04+02:00',
        operationName: '→ 516875******5702',
        targetAmount: -1500,
        targetUnit: 'UAH',
        description: 'transaction.details.general.info.description.fee\nПереводы\nЗарплатная карта,•6437',
        categoryIconUrl: 'https://sensebank.com.ua/upload/primob/categories_white/perekaz_1.svg',
        iconBg: '#57BFDC',
        iconColor: null,
        iconUrl: 'https://sensebank.com.ua/upload/primob/perekaz_2.png',
        iconSize: 40,
        categoryPFM: true,
        orderId: 'YllGNe1sLJjj',
        subjectAmount: -101500,
        subjectUnit: 'UAH',
        filterData: [
          {
            key: 'incomeOutlay',
            value: 'Расход'
          },
          {
            key: 'operationSum',
            value: '-101500'
          },
          {
            key: 'operationType',
            value: 'Переводы'
          },
          {
            key: 'operationCurrency',
            value: 'Гривна'
          },
          {
            key: 'account',
            value: '12235538-CARD-UAH'
          }
        ]
      },
      {
        hold: false,
        date: new Date('2022-11-21T11:11:04+02:00'),
        movements: [
          {
            id: '853737462-2',
            account: { id: '1337' },
            invoice: null,
            sum: -1000,
            fee: -15
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'UAH',
              syncIds: null,
              type: 'ccard'
            },
            invoice: null,
            sum: 1000,
            fee: 0
          }
        ],
        merchant: null,
        comment: '→ 516875******5702'
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337' })).toEqual(transaction)
  })
})
