import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        allowedOperations: [],
        id: '3124483400-5',
        operationDate: '2021-07-01T03:04:35+03:00',
        operationName: 'Капитализация процентов',
        description: 'Депозит',
        iconBg: null,
        iconColor: null,
        iconUrl: null,
        iconSize: 24,
        subjectAmount: 66326,
        subjectUnit: 'UAH',
        filterData: [
          {
            key: 'incomeOutlay',
            value: 'Доход'
          },
          {
            key: 'operationSum',
            value: '66326'
          },
          {
            key: 'operationType',
            value: 'Другое'
          },
          {
            key: 'operationCurrency',
            value: 'Гривна'
          },
          {
            key: 'account',
            value: '1337-DEPOSIT-UAH'
          }
        ]
      },
      {
        comment: 'Капитализация процентов',
        date: new Date('2021-07-01T03:04:35+03:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '3124483400-5',
            invoice: null,
            sum: 663.26
          }
        ]
      }
    ],
    [
      {
        allowedOperations: [],
        id: '285446526-2',
        operationDate: '2021-05-10T23:27:30+03:00',
        operationName: 'OLXDOSTAVKAUAPAY',
        description: 'Почтовые услуги\nДебетовая карта,•1355',
        iconBg: '#623AA2',
        iconColor: '#623AA2',
        iconUrl: null,
        iconSize: 24,
        subjectAmount: 2620,
        subjectUnit: 'UAH',
        filterData: [
          {
            key: 'incomeOutlay',
            value: 'Доход'
          },
          {
            key: 'operationSum',
            value: '2620'
          },
          {
            key: 'operationType',
            value: 'Почтовые услуги'
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
        date: new Date('2021-05-10T23:27:30+03:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'OLXDOSTAVKAUAPAY',
          category: 'Почтовые услуги'
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '285446526-2',
            invoice: null,
            sum: 26.20
          }
        ]
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337' })).toEqual(transaction)
  })
})
