import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        allowedOperations: [],
        id: '939966769-1',
        operationDate: '2021-10-13T15:53:14+03:00',
        operationName: 'MEGASPORT 18',
        description: 'Спорт и фитнес\nКредитная карта,•0172',
        iconBg: '#FF7651',
        iconColor: '#FF7651',
        iconUrl: 'https://alfabank.ua/upload/primob/categories_white/Sport_1.svg',
        iconSize: 24,
        subjectAmount: 0,
        subjectUnit: 'UAH',
        filterData:
          [
            {
              key: 'incomeOutlay',
              value: 'Расход'
            },
            {
              key: 'operationSum',
              value: '0'
            },
            {
              key: 'operationType',
              value: 'Спорт и фитнес'
            },
            {
              key: 'operationCurrency',
              value: 'Гривна'
            },
            {
              key: 'account',
              value: '5057489-CARD-UAH'
            }
          ]
      },
      null
    ],
    [
      {
        allowedOperations: [],
        id: '3573479691-5',
        operationDate: '2022-05-10T14:08:18+03:00',
        operationName: 'Погашение процентов',
        description: 'Кредит',
        categoryPFM: false,
        subjectAmount: 28463,
        subjectUnit: 'UAH',
        filterData:
          [
            {
              key: 'incomeOutlay',
              value: 'Доход'
            },
            {
              key: 'operationSum',
              value: '28463'
            },
            {
              key: 'operationCurrency',
              value: 'Гривна'
            },
            {
              key: 'account',
              value: '504/89675|DOUBLE-CREDIT-UAH'
            }
          ]
      },
      null
    ],
    [
      {
        allowedOperations: [],
        id: '3573479947-5',
        operationDate: '2022-05-10T14:08:18+03:00',
        operationName: 'Погашение тела кредита',
        description: 'Кредит',
        categoryPFM: false,
        subjectAmount: 220257,
        subjectUnit: 'UAH',
        filterData:
          [
            {
              key: 'incomeOutlay',
              value: 'Доход'
            },
            {
              key: 'operationSum',
              value: '220257'
            },
            {
              key: 'operationCurrency',
              value: 'Гривна'
            },
            {
              key: 'account',
              value: '504/89675-CREDIT-UAH'
            }
          ]
      },
      null
    ],
    [
      {
        allowedOperations: [],
        id: 'credit-limit-change-1',
        operationDate: '2026-05-09T12:00:00+03:00',
        operationName: 'Збільшення кредитного ліміту',
        description: 'Кредитний ліміт',
        categoryPFM: false,
        subjectAmount: 2700000,
        subjectUnit: 'UAH',
        filterData: [
          { key: 'incomeOutlay', value: 'Доход' },
          { key: 'operationSum', value: '2700000' },
          { key: 'operationCurrency', value: 'Гривна' }
        ]
      },
      null
    ],
    [
      {
        allowedOperations: [],
        id: 'credit-limit-change-2',
        operationDate: '2026-05-10T12:00:00+03:00',
        operationName: 'Уменьшение кредитного лимита',
        description: 'Кредитный лимит',
        categoryPFM: false,
        subjectAmount: -500000,
        subjectUnit: 'UAH',
        filterData: [
          { key: 'incomeOutlay', value: 'Расход' },
          { key: 'operationSum', value: '-500000' },
          { key: 'operationCurrency', value: 'Гривна' }
        ]
      },
      null
    ]
  ])('converts skipped transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337' })).toEqual(transaction)
  })
})
