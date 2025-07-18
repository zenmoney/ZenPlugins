import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        allowedOperations: [],
        id: '-4675068905-5',
        operationDate: '2022-02-01T16:59:38+02:00',
        operationName: 'Погашение кредита',
        description: 'Кредит',
        categoryPFM: false,
        subjectAmount: 581382,
        subjectUnit: 'UAH',
        filterData:
          [
            {
              key: 'incomeOutlay',
              value: 'Доход'
            },
            {
              key: 'operationSum',
              value: '581382'
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
      {
        comment: null,
        date: new Date('2022-02-01T14:59:38.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '1337' },
            fee: 0,
            id: '-4675068905-5',
            invoice: null,
            sum: 5813.82
          }
        ],
        groupKeys: [
          '2022-02-01_UAH_5813.82'
        ]
      }
    ]
  ])('converts inner intcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337' })).toEqual(transaction)
  })
})
