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
            BookedDate: '19-10-2020 16:38:21',
            DocumentDate: '19-10-2020 00:00:00',
            OperationAmount: '-3000',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-3000',
            AccountCurrency: 'UAH',
            OperationDescription: 'Приватний переказ. Без ПДВ',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-10-19T16:38:21', 'Europe/Kiev'),
          movements: [
            {
              id: '19-10-2020 16:38:21--3000',
              account: { id: 'ccard' },
              invoice: null,
              sum: -3000,
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
              sum: 3000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Приватний переказ. Без ПДВ'
        }
      ]
    ],
    [
      {
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '20-10-2020 22:39:04',
            DocumentDate: '22-10-2020 00:00:00',
            OperationAmount: '-105',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-105',
            AccountCurrency: 'UAH',
            OperationDescription: 'Списання переказу Moneysend OTPBANK_P2P(E7258740)',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-10-20T22:39:04', 'Europe/Kiev'),
          movements: [
            {
              id: '20-10-2020 22:39:04--105',
              account: { id: 'ccard' },
              invoice: null,
              sum: -105,
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
              sum: 105,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Списання переказу Moneysend OTPBANK_P2P(E7258740)'
        }
      ]
    ]
  ])('converts outer outcome transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, accountsbyId)).toEqual(transaction)
  })
})
