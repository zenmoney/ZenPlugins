import { convertPdfStatementTransaction } from '../../converters/transactions'
import { StatementTransaction } from '../../models'
import { AccountType } from '../../../../types/zenmoney'

it.each([
  [
    {
      hold: false,
      date: '2023-01-14T00:00:00.000',
      originalAmount: '(-17 EGP)',
      amount: '- 271,52 ',
      description: 'UBER *TRIP HELP.UBER.COM',
      statementUid: 'a31336ea-6a68-4760-91a9-5ea78977a3c5'
    },
    {
      statementUid: 'a31336ea-6a68-4760-91a9-5ea78977a3c5',
      transaction: {
        hold: false,
        date: new Date('2023-01-14T00:00:00.000'),
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ11111'
            },
            invoice: {
              sum: -17,
              instrument: 'EGP'
            },
            sum: -271.52,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'UBER *TRIP HELP.UBER.COM',
          mcc: null,
          location: null
        }
      }
    }
  ],
  [
    {
      hold: false,
      date: '2022-11-24T00:00:00.000',
      originalAmount: null,
      amount: '+ 108 213,06 ',
      description: 'по номеру счета PAYDALA LLP',
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e'
    },
    {
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e',
      transaction: {
        comment: 'по номеру счета',
        movements: [
          {
            id: null,
            account: {
              id: 'KZ11111'
            },
            invoice: null,
            sum: 108213.06,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2022-11-24T00:00:00.000'),
        merchant: {
          fullTitle: 'PAYDALA LLP',
          mcc: null,
          location: null
        }
      }
    }
  ],
  [
    {
      hold: false,
      date: '2022-10-31T00:00:00.000',
      originalAmount: null,
      amount: '+ 22 000,00 ',
      description: 'В Kaspi Банкомате',
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e'
    },
    {
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e',
      transaction: {
        comment: 'В Kaspi Банкомате',
        movements: [
          {
            id: null,
            account: {
              id: 'KZ11111'
            },
            invoice: null,
            sum: 22000,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2022-10-31T00:00:00.000'),
        merchant: null
      }
    }
  ]
])('converts transaction parsed from pdf statement', (rawTransaction: StatementTransaction, transaction: unknown) => {
  expect(convertPdfStatementTransaction(
    rawTransaction,
    {
      date: new Date(),
      account: {
        balance: 80995.97,
        id: 'KZ11111',
        instrument: 'KZT',
        title: 'KASPI GOLD *0111',
        syncIds: ['KZ11111'],
        type: AccountType.ccard
      }
    }
  )).toEqual(transaction)
})
