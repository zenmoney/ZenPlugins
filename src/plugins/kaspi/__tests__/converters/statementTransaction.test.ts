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
      statementUid: 'a31336ea-6a68-4760-91a9-5ea78977a3c5',
      originString: '15.01.23- 271,52 ₸   Покупка      UBER *TRIP HELP.UBER.COM\n(-17 EGP)'
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
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e',
      originString: '25.11.22+ 108 213,06 ₸   Пополнение      по номеру счета PAYDALA LLP\n'
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
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e',
      originString: '01.11.22+ 22 000,00 ₸   Пополнение      В Kaspi Банкомате\n'
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
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'KZT',
              syncIds: null,
              type: 'cash'
            },
            invoice: null,
            sum: -22000,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2022-10-31T00:00:00.000'),
        merchant: null
      }
    }
  ],
  [
    {
      hold: false,
      date: '2023-04-29T00:00:00.000',
      originalAmount: null,
      amount: '- 2 000,00 ',
      description: 'Банкомат VN Akbulak 31 Miras Store',
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e',
      originString: '29.04.23- 2 000,00 ₸ Снятие Банкомат VN Akbulak 31 Miras Store\n'
    },
    {
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ11111'
            },
            invoice: null,
            sum: -2000,
            fee: 0
          },
          {
            id: null,
            account: {
              instrument: 'KZT',
              company: null,
              syncIds: null,
              type: 'cash'
            },
            invoice: null,
            sum: 2000,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2023-04-29T00:00:00.000'),
        merchant: {
          fullTitle: 'Банкомат VN Akbulak Miras Store',
          location: null,
          mcc: null
        }
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
