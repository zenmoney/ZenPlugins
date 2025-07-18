import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        allowedOperations: [],
        id: '262882590-2',
        operationDate: '2021-04-11T18:25:24+03:00',
        operationName: 'PARUNA NAZAR',
        description: 'Переводы\nДебетовая карта,•1355',
        iconBg: '#3477B9',
        iconColor: '#3477B9',
        iconUrl: null,
        iconSize: 24,
        subjectAmount: 100000,
        subjectUnit: 'UAH',
        filterData: [
          {
            key: 'incomeOutlay',
            value: 'Доход'
          },
          {
            key: 'operationSum',
            value: '100000'
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
        comment: 'PARUNA NAZAR',
        date: new Date('2021-04-11T18:25:24+03:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '262882590-2',
            invoice: null,
            sum: 1000.00
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
            sum: -1000.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337' })).toEqual(transaction)
  })
})
