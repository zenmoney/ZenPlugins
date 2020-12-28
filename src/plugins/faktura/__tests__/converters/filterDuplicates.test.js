import { filterDuplicates } from '../../converters/transaction'

describe('filterDuplicates', () => {
  it.each([
    [
      [
        {
          comment: 'Продажа валюты Курс 1$ = 76.5700₽',
          date: new Date('2020-11-11T20:10:43.000Z'),
          hold: false,
          merchant: null,
          movements:
            [
              {
                id: '472348711',
                account: { id: 'c-3208453' },
                invoice: { sum: 184.99, instrument: 'USD' },
                sum: 14164.68,
                fee: 0
              },
              {
                id: null,
                account: { type: 'ccard', instrument: 'USD', company: null, syncIds: null },
                invoice: null,
                sum: -184.99,
                fee: 0
              }
            ]
        },
        {
          date: new Date(1498810400000),
          movements: [
            {
              id: '166189057',
              account: { id: 'c-1230000' },
              invoice: {
                sum: 1041.01,
                instrument: 'USD'
              },
              sum: 61523.69,
              fee: 0
            },
            {
              id: null,
              account: { id: 'w-88410' },
              invoice: null,
              sum: -1041.01,
              fee: 0
            }
          ],
          hold: false,
          merchant: null,
          comment: 'Продажа валюты Курс 1$ = 59.1000₽'
        },
        {
          date: new Date(1508164789000),
          movements:
            [
              {
                id: '194268638',
                account: { id: 'c-2098804' },
                invoice: { sum: -60, instrument: 'EUR' },
                sum: -4069.8,
                fee: 0
              },
              {
                id: null,
                account: { id: 'w-297926' },
                invoice: null,
                sum: 60,
                fee: 0
              }
            ],
          hold: false,
          merchant: null,
          comment: 'Покупка валюты Курс 1€ = 67.8300₽'
        },
        {
          comment: 'Продажа валюты Курс 1$ = 76.5700₽',
          date: new Date('2020-11-11T20:10:43.000Z'),
          hold: false,
          merchant: null,
          movements:
            [
              {
                id: '472348711',
                account: { id: 'c-3208453' },
                invoice: { sum: 184.99, instrument: 'USD' },
                sum: 14164.60,
                fee: 0
              },
              {
                id: null,
                account: { type: 'ccard', instrument: 'USD', company: null, syncIds: null },
                invoice: null,
                sum: -184.99,
                fee: 0
              }
            ]
        },
        {
          date: new Date(1498810400000), // Дубль
          movements: [
            {
              id: '166189057',
              account: { id: 'c-1230000' },
              invoice: {
                sum: 1041.01,
                instrument: 'USD'
              },
              sum: 61523.69,
              fee: 0
            },
            {
              id: null,
              account: { id: 'w-88410' },
              invoice: null,
              sum: -1041.01,
              fee: 0
            }
          ],
          hold: false,
          merchant: null,
          comment: 'Продажа валюты Курс 1$ = 59.1000₽'
        },
        {
          date: new Date(1486649343000),
          movements: [
            {
              id: '135914720',
              account: { id: 'c-1230000' },
              invoice: {
                sum: -30,
                instrument: 'USD'
              },
              sum: -1771.18,
              fee: 0
            },
            {
              id: null,
              account: { id: 'w-88410' },
              invoice: null,
              sum: 30,
              fee: 0
            }
          ],
          hold: false,
          merchant: null,
          comment: 'Покупка валюты Курс 1$ = 59.0392₽'
        },
        {
          date: new Date(1508164789000), // Дубль
          movements:
            [
              {
                id: '194268638',
                account: { id: 'c-2098804' },
                invoice: { sum: -60, instrument: 'EUR' },
                sum: -4069.8,
                fee: 0
              },
              {
                id: null,
                account: { id: 'w-297926' },
                invoice: null,
                sum: 60,
                fee: 0
              }
            ],
          hold: false,
          merchant: null,
          comment: 'Покупка валюты Курс 1€ = 67.8300₽'
        }
      ],
      [
        {
          comment: 'Продажа валюты Курс 1$ = 76.5700₽',
          date: new Date('2020-11-11T20:10:43.000Z'),
          hold: false,
          merchant: null,
          movements:
            [
              {
                id: '472348711',
                account: { id: 'c-3208453' },
                invoice: { sum: 184.99, instrument: 'USD' },
                sum: 14164.68,
                fee: 0
              },
              {
                id: null,
                account: { type: 'ccard', instrument: 'USD', company: null, syncIds: null },
                invoice: null,
                sum: -184.99,
                fee: 0
              }
            ]
        },
        {
          date: new Date(1498810400000),
          movements: [
            {
              id: '166189057',
              account: { id: 'c-1230000' },
              invoice: {
                sum: 1041.01,
                instrument: 'USD'
              },
              sum: 61523.69,
              fee: 0
            },
            {
              id: null,
              account: { id: 'w-88410' },
              invoice: null,
              sum: -1041.01,
              fee: 0
            }
          ],
          hold: false,
          merchant: null,
          comment: 'Продажа валюты Курс 1$ = 59.1000₽'
        },
        {
          date: new Date(1508164789000),
          movements:
            [
              {
                id: '194268638',
                account: { id: 'c-2098804' },
                invoice: { sum: -60, instrument: 'EUR' },
                sum: -4069.8,
                fee: 0
              },
              {
                id: null,
                account: { id: 'w-297926' },
                invoice: null,
                sum: 60,
                fee: 0
              }
            ],
          hold: false,
          merchant: null,
          comment: 'Покупка валюты Курс 1€ = 67.8300₽'
        },
        {
          comment: 'Продажа валюты Курс 1$ = 76.5700₽',
          date: new Date('2020-11-11T20:10:43.000Z'),
          hold: false,
          merchant: null,
          movements:
            [
              {
                id: '472348711',
                account: { id: 'c-3208453' },
                invoice: { sum: 184.99, instrument: 'USD' },
                sum: 14164.6,
                fee: 0
              },
              {
                id: null,
                account: { type: 'ccard', instrument: 'USD', company: null, syncIds: null },
                invoice: null,
                sum: -184.99,
                fee: 0
              }
            ]
        },
        {
          date: new Date(1486649343000),
          movements: [
            {
              id: '135914720',
              account: { id: 'c-1230000' },
              invoice: {
                sum: -30,
                instrument: 'USD'
              },
              sum: -1771.18,
              fee: 0
            },
            {
              id: null,
              account: { id: 'w-88410' },
              invoice: null,
              sum: 30,
              fee: 0
            }
          ],
          hold: false,
          merchant: null,
          comment: 'Покупка валюты Курс 1$ = 59.0392₽'
        }
      ]
    ]
  ])('filters duplicates', (transactions, filteredTransactions) => {
    expect(filterDuplicates(transactions)).toEqual(filteredTransactions)
  })
})
