import { convertPdfStatementTransaction } from '../../converters/transactions'
import { StatementTransaction } from '../../models'
import { AccountType, AccountOrCard } from '../../../../types/zenmoney'

const account: AccountOrCard = {
  id: 'KZ123456789012345',
  instrument: 'KZT',
  syncIds: ['1234'],
  title: 'Deposit Card',
  type: AccountType.ccard
}

it.each([
  [
    {
      hold: false,
      date: '2025-01-01T00:00:00.000',
      originalAmount: '-600.00',
      amount: '-600.00',
      description: 'Airba Fresh Minimarket. Продукты и супермаркет',
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      originString: '01.01.2025-600.00 ₸KZTПокупка Airba Fresh Minimarket. Продукты и супермаркет'
    },
    {
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      transaction: {
        hold: false,
        date: new Date('2025-01-01T00:00:00.000'),
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ123456789012345'
            },
            invoice: null,
            sum: -600.00,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Airba Fresh Minimarket',
          mcc: null,
          location: null
        }
      }
    },
    account
  ],
  [
    {
      hold: false,
      date: '2025-01-01T00:00:00.000',
      originalAmount: '+50000.00',
      amount: '+50000.00',
      description: 'KOPILKA. Между своими счетами',
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      originString: '01.01.2025+50,000.00 ₸KZTПополнениеKOPILKA. Между своими счетами'
    },
    {
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ123456789012345'
            },
            invoice: null,
            sum: 50000,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'KZT',
              syncIds: null,
              type: 'deposit'
            },
            invoice: null,
            sum: -50000,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2025-01-01T00:00:00.000'),
        merchant: {
          fullTitle: 'KOPILKA',
          mcc: null,
          location: null
        }
      }
    },
    account
  ],
  [
    {
      hold: false,
      date: '2025-02-01T00:00:00.000',
      originalAmount: '-30000.00',
      amount: '-30000.00',
      description: 'Vasia V.. По номеру телефона',
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      originString: '01.02.2025-30,000.00 ₸KZTПереводVasia V.. По номеру телефона'
    },
    {
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ123456789012345'
            },
            invoice: null,
            sum: -30000,
            fee: 0
          },
          {
            id: null,
            account: {
              instrument: 'KZT',
              company: null,
              syncIds: null,
              type: 'ccard'
            },
            invoice: null,
            sum: 30000,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2025-02-01T00:00:00.000'),
        merchant: {
          fullTitle: 'Vasia V',
          mcc: null,
          location: null
        }
      }
    },
    account
  ],
  [
    {
      hold: false,
      date: '2025-02-01T00:00:00.000',
      originalAmount: '-159437.57',
      amount: '-159437.57',
      description: 'Депозит KOPILKA. Между своими счетами',
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      originString: '01.02.2025-159,437.57 ₸KZTПеревод Депозит KOPILKA. Между своими счетами'
    },
    {
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ123456789012345'
            },
            invoice: null,
            sum: -159437.57,
            fee: 0
          },
          {
            id: null,
            account: {
              instrument: 'KZT',
              company: null,
              syncIds: null,
              type: 'deposit'
            },
            invoice: null,
            sum: 159437.57,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2025-02-01T00:00:00.000'),
        merchant: {
          fullTitle: 'Депозит KOPILKA',
          location: null,
          mcc: null
        }
      }
    },
    account
  ],
  [
    {
      hold: false,
      date: '2025-02-01T00:00:00.000',
      originalAmount: '+156367.57',
      amount: '+156367.57',
      description: 'IVAN IVANOV>ALMATY KZ. С карты другого банка',
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      originString: '01.02.2025+156,367.57 ₸KZTПополнение IVAN IVANOV>ALMATY KZ. С карты другого банка'
    },
    {
      statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ123456789012345'
            },
            invoice: null,
            sum: 156367.57,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'KZT',
              syncIds: null,
              type: 'ccard'
            },
            invoice: null,
            sum: -156367.57,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2025-02-01T00:00:00.000'),
        merchant: {
          fullTitle: 'IVAN IVANOV>ALMATY KZ',
          location: null,
          mcc: null
        }
      }
    },
    account
  ]
])('converts transaction parsed from pdf statement', (rawTransaction: StatementTransaction, transaction: unknown, account: AccountOrCard) => {
  expect(convertPdfStatementTransaction(
    rawTransaction,
    account
  )).toEqual(transaction)
})
