import { duplicatesTransactions } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      [
        {
          allowedOperations: ['RECEIPT'],
          id: '86194242-3',
          operationDate: '2021-11-06T21:30:37+02:00',
          operationName: 'BOLT.EU O2111062130',
          description: 'Такси\nКредитная карта,•9262',
          iconBg: '#1B8ABA',
          iconColor: '#1B8ABA',
          iconUrl: 'https://alfabank.ua/upload/primob/categories_white/Taxi_1.svg',
          iconSize: 24,
          subjectAmount: -4405,
          subjectUnit: 'UAH',
          filterData:
            [
              { key: 'incomeOutlay', value: 'Расход' },
              { key: 'operationSum', value: '-4405' },
              { key: 'operationType', value: 'Такси' },
              { key: 'operationCurrency', value: 'Гривна' },
              { key: 'account', value: '9110319-CARD-UAH' }
            ]
        },
        {
          allowedOperations: ['RECEIPT'],
          id: '86036768-3',
          operationDate: '2021-11-06T21:30:37+02:00',
          operationName: 'BOLT.EU /O/2111062130',
          description: 'Такси\nКредитная карта,•9262',
          iconBg: '#1B8ABA',
          iconColor: '#1B8ABA',
          iconUrl: 'https://alfabank.ua/upload/primob/categories_white/Taxi_1.svg',
          iconSize: 24,
          subjectAmount: -4405,
          subjectUnit: 'UAH',
          filterData:
            [
              { key: 'incomeOutlay', value: 'Расход' },
              { key: 'operationSum', value: '-4405' },
              { key: 'operationType', value: 'Такси' },
              { key: 'operationCurrency', value: 'Гривна' },
              { key: 'account', value: '9110319-CARD-UAH' }
            ]
        }
      ],
      [
        {
          allowedOperations: ['RECEIPT'],
          id: '86194242-3',
          operationDate: '2021-11-06T21:30:37+02:00',
          operationName: 'BOLT.EU O2111062130',
          description: 'Такси\nКредитная карта,•9262',
          iconBg: '#1B8ABA',
          iconColor: '#1B8ABA',
          iconUrl: 'https://alfabank.ua/upload/primob/categories_white/Taxi_1.svg',
          iconSize: 24,
          subjectAmount: -4405,
          subjectUnit: 'UAH',
          filterData:
            [
              { key: 'incomeOutlay', value: 'Расход' },
              { key: 'operationSum', value: '-4405' },
              { key: 'operationType', value: 'Такси' },
              { key: 'operationCurrency', value: 'Гривна' },
              { key: 'account', value: '9110319-CARD-UAH' }
            ]
        }
      ]
    ]
  ])('converts outcome', (apiTransactions, transaction) => {
    expect(duplicatesTransactions(apiTransactions)).toEqual(transaction)
  })
})
