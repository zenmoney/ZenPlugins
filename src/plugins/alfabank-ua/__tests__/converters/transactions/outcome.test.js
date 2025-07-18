import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        allowedOperations: [
          'RECEIPT',
          'SPLIT'
        ],
        id: '894957403-1',
        operationDate: '2021-09-01T14:24:23+03:00',
        operationName: 'APTEKA ZNZHAR GORODOTSKA',
        description: 'Аптеки\nДебетовая карта,•1355',
        iconBg: '#F33688',
        iconColor: '#F33688',
        iconUrl: 'https://alfabank.ua/upload/primob/categories_white/Pharma_2.svg',
        iconSize: 24,
        subjectAmount: -24000,
        subjectUnit: 'UAH',
        filterData: [
          {
            key: 'incomeOutlay',
            value: 'Расход'
          },
          {
            key: 'operationSum',
            value: '-24000'
          },
          {
            key: 'operationType',
            value: 'Аптеки'
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
        comment: null,
        date: new Date('2021-09-01T14:24:23+03:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'APTEKA ZNZHAR GORODOTSKA',
          category: 'Аптеки'
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '894957403-1',
            invoice: null,
            sum: -240.00
          }
        ]
      }
    ],
    [
      {
        allowedOperations: [
          'RECEIPT'
        ],
        targetAmount: -133,
        targetUnit: 'USD',
        id: '329299915-2',
        operationDate: '2021-07-03T08:30:17+03:00',
        operationName: 'AWS EMEA',
        description: 'Услуги\nДебетовая карта,•1355',
        iconBg: '#623AA2',
        iconColor: '#623AA2',
        iconUrl: null,
        iconSize: 24,
        subjectAmount: -3704,
        subjectUnit: 'UAH',
        filterData: [
          {
            key: 'incomeOutlay',
            value: 'Расход'
          },
          {
            key: 'operationSum',
            value: '-3704'
          },
          {
            key: 'operationType',
            value: 'Услуги'
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
        comment: null,
        date: new Date('2021-07-03T08:30:17+03:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'AWS EMEA',
          category: 'Услуги'
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '329299915-2',
            invoice: {
              instrument: 'USD',
              sum: -1.33
            },
            sum: -37.04
          }
        ]
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337' })).toEqual(transaction)
  })
})
