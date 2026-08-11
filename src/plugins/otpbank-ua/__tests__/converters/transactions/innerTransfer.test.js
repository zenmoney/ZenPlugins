import { convertTransactions } from '../../../converters'

describe('convertTransactions', () => {
  const accountsbyId = {
    account: {
      id: 'account',
      instrument: 'UAH'
    },
    ccard: {
      id: 'ccard',
      instrument: 'UAH'
    }
  }
  it.each([
    [
      {
        accountTransactions: [
          {
            Amount: '0.45',
            Date: '23-09-2020',
            Description: 'Поповнення власного рахунку. Без ПДВ',
            TxId: '1',
            Type: '2',
            apiAccountId: 'account'
          },
          {
            Amount: '20.02',
            Date: '02-09-2020',
            Description: 'Поповнення власного рахунку. Без ПДВ',
            TxId: '3',
            Type: '2',
            apiAccountId: 'account'
          }
        ],
        cardTransactions: [
          {
            AccountCurrency: 'UAH',
            BookedDate: '23-09-2020 17:17:14',
            DocumentDate: '23-09-2020 00:00:00',
            OperationAmount: '0.45',
            OperationAmountInAccountCurrency: '0.45',
            OperationCurrency: 'UAH',
            OperationDescription: 'Поповнення власного рахунку. Без ПДВ',
            apiAccountId: 'ccard'
          },
          {
            AccountCurrency: 'UAH',
            BookedDate: '02-09-2020 09:58:54',
            DocumentDate: '02-09-2020 00:00:00',
            OperationAmount: '20.02',
            OperationAmountInAccountCurrency: '20.02',
            OperationCurrency: 'UAH',
            OperationDescription: 'Поповнення власного рахунку. Без ПДВ',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: new Date('2020-09-22T21:00:00.000Z'),
          movements: [
            {
              id: '23-09-2020-0.45',
              account: { id: 'account' },
              invoice: null,
              sum: -0.45,
              fee: 0
            },
            {
              id: null,
              account: { id: 'ccard' },
              invoice: null,
              sum: 0.45,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Поповнення власного рахунку. Без ПДВ'
        },
        {
          hold: false,
          date: new Date('2020-09-01T21:00:00.000Z'),
          movements: [
            {
              id: '02-09-2020-20.02',
              account: { id: 'account' },
              invoice: null,
              sum: -20.02,
              fee: 0
            },
            {
              id: null,
              account: { id: 'ccard' },
              invoice: null,
              sum: 20.02,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Поповнення власного рахунку. Без ПДВ'
        }
      ]
    ],
    [
      {
        accountTransactions: [
          {
            TxId: '4',
            Amount: '1000.00',
            Date: '02-10-2020',
            Description: 'Часткове зняття коштів з депозиту згідно з договором № IB/057760/18 від 03.08.2018',
            Type: '2',
            apiAccountId: 'account'
          }
        ],
        cardTransactions: [
          {
            BookedDate: '02-10-2020 17:08:04',
            DocumentDate: '02-10-2020 00:00:00',
            OperationAmount: '1000',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '1000',
            AccountCurrency: 'UAH',
            OperationDescription: 'Часткове зняття коштів з депозиту згідно з договором № IB/057760/18 від 03.08.2018',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: new Date('2020-10-01T21:00:00.000Z'),
          movements: [
            {
              id: '02-10-2020-1000.00',
              account: { id: 'account' },
              invoice: null,
              sum: -1000,
              fee: 0
            },
            {
              id: null,
              account: { id: 'ccard' },
              invoice: null,
              sum: 1000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Часткове зняття коштів з депозиту згідно з договором № IB/057760/18 від 03.08.2018'
        }
      ]
    ]
  ])('converts inner transfer', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, accountsbyId)).toEqual(transactions)
  })
})
