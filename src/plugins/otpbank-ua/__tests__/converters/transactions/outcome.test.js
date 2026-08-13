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
        accountTransactions: [
          {
            Amount: '10000.00',
            Date: '01-07-2020',
            Description: 'Списання з Ощадного рахунку',
            TxId: '7',
            Type: '2',
            apiAccountId: 'account'
          }
        ],
        cardTransactions:
        [
          {
            AccountCurrency: 'UAH',
            BookedDate: '16-07-2020 09:30:10',
            DocumentDate: '17-07-2020 00:00:00',
            OperationAmount: '-20',
            OperationAmountInAccountCurrency: '-20',
            OperationCurrency: 'UAH',
            OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-07-01T00:00:00', 'Europe/Kiev'),
          movements: [
            {
              id: '01-07-2020-10000.00',
              account: { id: 'account' },
              invoice: null,
              sum: -10000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Списання з Ощадного рахунку'
        },
        {
          hold: false,
          date: parseDateInTimezone('2020-07-16T09:30:10', 'Europe/Kiev'),
          movements: [
            {
              id: '16-07-2020 09:30:10--20',
              account: { id: 'ccard' },
              invoice: null,
              sum: -20,
              fee: 0
            }
          ],
          merchant: {
            title: 'OTP_PAY-SERV',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '01-10-2020 19:23:19',
            DocumentDate: null,
            OperationAmount: '-259',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-259',
            AccountCurrency: 'UAH',
            OperationDescription: 'POS Purchase MICROSOFT*SUBSCRIPTION',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-10-01T19:23:19', 'Europe/Kiev'),
          movements: [
            {
              id: '01-10-2020 19:23:19--259',
              account: { id: 'ccard' },
              invoice: null,
              sum: -259,
              fee: 0
            }
          ],
          merchant: {
            title: 'MICROSOFT*SUBSCRIPTION',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '30-09-2020 20:30:40',
            DocumentDate: null,
            OperationAmount: '-575.8',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-575.8',
            AccountCurrency: 'UAH',
            OperationDescription: 'POS Purchase Apteka',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-09-30T20:30:40', 'Europe/Kiev'),
          movements: [
            {
              id: '30-09-2020 20:30:40--575.8',
              account: { id: 'ccard' },
              invoice: null,
              sum: -575.8,
              fee: 0
            }
          ],
          merchant: {
            title: 'Apteka',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '30-09-2020 20:24:23',
            DocumentDate: null,
            OperationAmount: '-110.3',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-110.3',
            AccountCurrency: 'UAH',
            OperationDescription: 'POS Purchase Aptechniypunkt 2',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-09-30T20:24:23', 'Europe/Kiev'),
          movements: [
            {
              id: '30-09-2020 20:24:23--110.3',
              account: { id: 'ccard' },
              invoice: null,
              sum: -110.3,
              fee: 0
            }
          ],
          merchant: {
            title: 'Aptechniypunkt 2',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '30-09-2020 00:00:00',
            DocumentDate: '02-10-2020 00:00:00',
            OperationAmount: '-1379',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-1379',
            AccountCurrency: 'UAH',
            OperationDescription: 'Покупка (Оплата цифровим токеном) KLINIKA MEDIKOM(50921330)',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-09-30T00:00:00', 'Europe/Kiev'),
          movements: [
            {
              id: '30-09-2020 00:00:00--1379',
              account: { id: 'ccard' },
              invoice: null,
              sum: -1379,
              fee: 0
            }
          ],
          merchant: {
            title: 'KLINIKA MEDIKOM',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '30-09-2020 00:00:00',
            DocumentDate: '02-10-2020 00:00:00',
            OperationAmount: '-60',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-60',
            AccountCurrency: 'UAH',
            OperationDescription: 'Покупка (Оплата цифровим токеном) TOV ANC TM APTEKA 21(20906671)',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-09-30T00:00:00', 'Europe/Kiev'),
          movements: [
            {
              id: '30-09-2020 00:00:00--60',
              account: { id: 'ccard' },
              invoice: null,
              sum: -60,
              fee: 0
            }
          ],
          merchant: {
            title: 'TOV ANC TM APTEKA 21',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '26-09-2020 00:00:00',
            DocumentDate: '28-09-2020 00:00:00',
            OperationAmount: '-200',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-200',
            AccountCurrency: 'UAH',
            OperationDescription: 'Покупка PORTMONE LTD*LIFECELL(20908975)',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-09-26T00:00:00', 'Europe/Kiev'),
          movements: [
            {
              id: '26-09-2020 00:00:00--200',
              account: { id: 'ccard' },
              invoice: null,
              sum: -200,
              fee: 0
            }
          ],
          merchant: {
            title: 'PORTMONE LTD*LIFECELL',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '03-09-2020 00:00:00',
            DocumentDate: '07-09-2020 00:00:00',
            OperationAmount: '-79',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: '-79.51',
            AccountCurrency: 'UAH',
            OperationDescription: 'Покупка GOOGLE *YouTube Music()',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-09-03T00:00:00', 'Europe/Kiev'),
          movements: [
            {
              id: '03-09-2020 00:00:00--79.51',
              account: { id: 'ccard' },
              invoice: null,
              sum: -79.51,
              fee: 0
            }
          ],
          merchant: {
            title: 'GOOGLE *YouTube Music',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '01-09-2020 00:00:00',
            DocumentDate: '03-09-2020 00:00:00',
            OperationAmount: '-6',
            OperationCurrency: 'USD',
            OperationAmountInAccountCurrency: '-166.2',
            AccountCurrency: 'UAH',
            OperationDescription: 'Покупка Patreon* Membership()',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-09-01T00:00:00', 'Europe/Kiev'),
          movements: [
            {
              id: '01-09-2020 00:00:00--166.2',
              account: { id: 'ccard' },
              invoice: {
                instrument: 'USD',
                sum: -6
              },
              sum: -166.2,
              fee: 0
            }
          ],
          merchant: {
            title: 'Patreon* Membership',
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
        accountTransactions: [],
        cardTransactions: [
          {
            BookedDate: '14-10-2020 12:41:44',
            DocumentDate: null,
            OperationAmount: '-5',
            OperationCurrency: 'UAH',
            OperationAmountInAccountCurrency: null,
            AccountCurrency: null,
            OperationDescription: 'Комісія за переказ на картку іншого банку',
            apiAccountId: 'ccard'
          }
        ]
      },
      [
        {
          hold: false,
          date: parseDateInTimezone('2020-10-14T12:41:44', 'Europe/Kiev'),
          movements: [
            {
              id: '14-10-2020 12:41:44--5',
              account: { id: 'ccard' },
              invoice: null,
              sum: -5,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Комісія за переказ на картку іншого банку'
        }
      ]
    ]
  ])('converts outcome transactions', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, accountsbyId)).toEqual(transaction)
  })
})
