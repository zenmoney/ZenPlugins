import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
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
        accountTransactions:
        [{
          Amount: '2600.00',
          Date: '09-06-2020',
          Description: 'Видача готівки з вкладного рахунку',
          TxId: '9',
          Type: '2',
          apiAccountId: 'account'
        }]
      },
      [{
        hold: false,
        date: new Date('2020-06-08T21:00:00.000Z'),
        movements: [
          {
            id: '09-06-2020-2600.00',
            account: { id: 'account' },
            invoice: null,
            sum: -2600.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 2600.00,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }]
    ]
  ])('converts cash transfer outcome', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, accountsbyId)).toEqual(transactions)
  })
})
