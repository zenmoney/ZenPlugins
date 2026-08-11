import { convertTransactions } from '../../../converters'
import { parseDateInTimezone } from '../../../../../common/momentTimezoneDateUtils'

describe('convertTransactions', () => {
  const accountsbyId = {
    account: {
      id: 'account',
      instrument: 'UAH'
    },
    ccard: {
      id: 'ccard',
      instrument: 'UAH'
    },
    ccard1: {
      id: 'ccard1',
      instrument: 'UAH'
    }
  }
  it.each([
    [
      {
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '02-10-2020 14:28:47',
            DocumentDate: '02-10-2020 00:00:00',
            OperationAmount: '11000',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '11000',
            AccountCurrency: 'UAH',
            OperationDescription: 'Зарахування переказу Moneysend MONODirect(MONO011)',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-10-02T14:28:47', 'Europe/Kiev'),
          movements: [
            {
              id: '02-10-2020 14:28:47-11000',
              account: { id: 'ccard' },
              invoice: null,
              sum: 11000,
              fee: 0
            },
            {
              id: null,
              account: {
                type: 'ccard',
                instrument: 'UAH',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: -11000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Зарахування переказу Moneysend MONODirect(MONO011)'
        }
      ]
    ]
  ])('converts outer income transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, accountsbyId)).toEqual(transaction)
  })
})
