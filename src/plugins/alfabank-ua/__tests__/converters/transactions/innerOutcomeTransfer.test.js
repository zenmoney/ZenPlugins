import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        allowedOperations: ['RECEIPT', 'REPAY'],
        id: '613169366-2',
        operationDate: '2022-02-01T16:59:36+02:00',
        operationName: 'Погашення кредиту',
        description: 'Переводы\nЗарплатная карта,•3825',
        iconBg: null,
        iconColor: null,
        iconUrl: 'https://alfabank.ua/upload/primob/product_2.svg',
        iconSize: 40,
        categoryPFM: false,
        orderId: '3JPlOwasDW7k',
        subjectAmount: -581382,
        subjectUnit: 'UAH',
        filterData:
          [
            {
              key: 'incomeOutlay',
              value: 'Расход'
            },
            {
              key: 'operationSum',
              value: '-581382'
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
              value: '10010820-CARD-UAH'
            }
          ]
      },
      {
        comment: null,
        date: new Date('2022-02-01T14:59:36.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '1337' },
            fee: 0,
            id: '613169366-2',
            invoice: null,
            sum: -5813.82
          }
        ],
        groupKeys: [
          '2022-02-01_UAH_5813.82'
        ]
      }
    ]
  ])('converts inner outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337', instrument: 'UAH' })).toEqual(transaction)
  })
})
