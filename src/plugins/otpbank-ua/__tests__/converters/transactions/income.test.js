import { convertTransactions } from '../../../converters'
import { parseDateInTimezone } from '../../../../../common/momentTimezoneDateUtils'

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
        accountTransactions: [
          {
            Amount: '0.15',
            Date: '14-09-2020',
            Description: 'Виплата нарахованих відсотків за вкладом на вимогу, зг. договору №IB/108989/19 від 15-ЛИС-19',
            TxId: '2',
            Type: '1',
            apiAccountId: 'account'
          }
        ],
        cardTransactions: []
      },
      [
        {
          hold: false,
          date: new Date('2020-09-13T21:00:00.000Z'),
          movements: [
            {
              id: '14-09-2020-0.15',
              account: { id: 'account' },
              invoice: null,
              sum: 0.15,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Виплата нарахованих відсотків за вкладом на вимогу, зг. договору №IB/108989/19 від 15-ЛИС-19'
        }
      ]
    ],
    [
      {
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '28-09-2020 16:04:08',
            DocumentDate: '28-09-2020 00:00:00',
            OperationAmount: '1701.48',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '1701.48',
            AccountCurrency: 'UAH',
            OperationDescription: 'Заробітна плата і аванси (Зарплата за другу половину місяця співробітникам ТОВ "ІТ ДІСТРІБЬЮШН" за вересень 2020р., згідно Договору № SP/001/003086/15 від 11.02',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-09-28T16:04:08', 'Europe/Kiev'),
          movements: [
            {
              id: '28-09-2020 16:04:08-1701.48',
              account: { id: 'ccard' },
              invoice: null,
              sum: 1701.48,
              fee: 0
            }
          ],
          merchant: {
            title: 'ТОВ "ІТ ДІСТРІБЬЮШН"',
            city: null,
            country: null,
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ],
    [
      {
        accountTransactions: [
          {
            TxId: '1',
            Amount: '176.64',
            Date: '23-02-2022',
            Description: 'Капіталізація відсотків, нарахованих з 23.01.2022 по 22.02.2022',
            Type: '4',
            CorrIBAN: 'UA953005280000026207455223141',
            apiAccountId: 'account'
          }
        ],
        cardTransactions: []
      },
      [
        {
          hold: false,
          date: new Date('2022-02-23T00:00:00+02:00'),
          movements:
            [
              {
                id: '23-02-2022-176.64',
                account: { id: 'account' },
                invoice: null,
                sum: 176.64,
                fee: 0
              }
            ],
          merchant: null,
          comment: 'Капіталізація відсотків, нарахованих з 23.01.2022 по 22.02.2022'
        }
      ]
    ]
  ])('converts income', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, accountsbyId)).toEqual(transactions)
  })
})
