import { convertPdfStatementTransaction } from '../../converters/transactions'
import { StatementTransaction, ConvertedAccount } from '../../models'
import { AccountType } from '../../../../types/zenmoney'

const deposit: ConvertedAccount = {
  date: new Date(),
  account: {
    id: 'KZ2222',
    balance: 1112.06,
    instrument: 'USD',
    syncIds: [
      'KZ2222'
    ],
    title: 'Депозит *7777',
    type: AccountType.deposit,
    endDateOffsetInterval: 'year',
    startDate: new Date('2022-03-04T21:00:00.000Z'),
    startBalance: 0,
    endDateOffset: 1,
    capitalization: true,
    percent: 1,
    payoffInterval: null,
    payoffStep: 0
  }
}

it.each([
  [
    {
      hold: false,
      date: '2024-02-10T00:00:00.000',
      originalAmount: null,
      amount: '+ 20 000,00 ',
      description: 'Пополнение С карты другого банка',
      statementUid: 'd2d2e0c3-3d16-4c6f-8e3e-ccf7064e7c9c',
      originString: '10.02.24+ 20 000,00 ₸   Пополнение      С карты другого банка\n'
    },
    {
      statementUid: 'd2d2e0c3-3d16-4c6f-8e3e-ccf7064e7c9c',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ11111'
            },
            invoice: null,
            sum: 20000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: AccountType.ccard,
              instrument: 'KZT',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -20000,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2024-02-10T00:00:00.000'),
        merchant: null
      }
    },
    null
  ],
  [
    {
      hold: false,
      date: '2025-04-12T00:00:00.000',
      originalAmount: null,
      amount: '- 6 600,00 ',
      description: 'Перевод На Kaspi Депозит',
      statementUid: 'b8c0b7e0-9c4a-4a11-bf14-8f2a2f1e4b51',
      originString: '12.04.25- 6 600,00 ₸ Перевод На Kaspi Депозит\n'
    },
    {
      statementUid: 'b8c0b7e0-9c4a-4a11-bf14-8f2a2f1e4b51',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ11111'
            },
            invoice: null,
            sum: -6600,
            fee: 0
          },
          {
            id: null,
            account: {
              type: AccountType.deposit,
              instrument: 'KZT',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 6600,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2025-04-12T00:00:00.000'),
        merchant: {
          fullTitle: 'На Kaspi Депозит',
          mcc: null,
          location: null
        }
      }
    },
    null
  ],
  [
    {
      hold: false,
      date: '2025-04-13T00:00:00.000',
      originalAmount: null,
      amount: '+ 6 600,00 ',
      description: 'Перевод С Kaspi Депозита',
      statementUid: 'fa4d1b2f-75c8-4f3f-a6b3-1f9b1b3a1b1a',
      originString: '13.04.25+ 6 600,00 ₸ Перевод С Kaspi Депозита\n'
    },
    {
      statementUid: 'fa4d1b2f-75c8-4f3f-a6b3-1f9b1b3a1b1a',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ11111'
            },
            invoice: null,
            sum: 6600,
            fee: 0
          },
          {
            id: null,
            account: {
              type: AccountType.deposit,
              instrument: 'KZT',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -6600,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2025-04-13T00:00:00.000'),
        merchant: {
          fullTitle: 'С Kaspi Депозита',
          mcc: null,
          location: null
        }
      }
    },
    null
  ],
  [
    {
      hold: false,
      date: '2025-04-14T00:00:00.000',
      originalAmount: null,
      amount: '- 1 200,00 ',
      description: 'Перевод Тест Т.',
      statementUid: 'b1f2d3e4-5678-4a9b-8c0d-1e2f3a4b5c6d',
      originString: '14.04.25- 1 200,00 ₸ Перевод Тест Т.\n'
    },
    {
      statementUid: 'b1f2d3e4-5678-4a9b-8c0d-1e2f3a4b5c6d',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ11111'
            },
            invoice: null,
            sum: -1200,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2025-04-14T00:00:00.000'),
        merchant: {
          fullTitle: 'Тест Т.',
          mcc: null,
          location: null
        }
      }
    },
    null
  ],
  [
    {
      hold: false,
      date: '2025-12-05T00:00:00.000',
      originalAmount: null,
      amount: '+ 12 790,20 ',
      description: 'Пополнение С Kaspi Gold через kaspi.kz',
      statementUid: '1c40f18a-93dd-45dd-9f5b-1b8312f6dfaa',
      originString: '05.12.25+12 790,20 ₸ПополнениеС Kaspi Gold через kaspi.kz13 928,35 ₸'
    },
    {
      statementUid: '1c40f18a-93dd-45dd-9f5b-1b8312f6dfaa',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ2222'
            },
            invoice: null,
            sum: 12790.2,
            fee: 0
          },
          {
            id: null,
            account: {
              type: AccountType.ccard,
              instrument: 'USD',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -12790.2,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2025-12-05T00:00:00.000'),
        merchant: {
          fullTitle: 'С Kaspi Gold через kaspi.kz',
          mcc: null,
          location: null
        }
      }
    },
    deposit
  ],
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
    },
    null
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
    },
    null
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
    },
    null
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
    },
    null
  ],
  [
    {
      hold: false,
      date: '2022-03-05T00:00:00.000',
      originalAmount: null,
      amount: '+ 200,00',
      description: 'Пополнение',
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e',
      originString: '05.03.22+ $200,00Пополнение$200,00'
    },
    {
      statementUid: '8bea793d-6645-4fb4-ab99-d3e1fe4a267e',
      transaction: {
        comment: null,
        movements: [
          {
            id: null,
            account: {
              id: 'KZ2222'
            },
            invoice: null,
            sum: 200,
            fee: 0
          }
        ],
        hold: false,
        date: new Date('2022-03-05T00:00:00.000'),
        merchant: null
      }
    },
    deposit
  ]
])('converts transaction parsed from pdf statement', (rawTransaction: StatementTransaction, transaction: unknown, account: ConvertedAccount | null) => {
  const defaultAccount: ConvertedAccount = {
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
  expect(convertPdfStatementTransaction(
    rawTransaction,
    account ?? defaultAccount
  )).toEqual(transaction)
})

it.each([
  [
    {
      hold: false,
      date: '2025-07-06T00:00:00.000',
      originalAmount: null,
      amount: '+ 0,00 ',
      description: 'YANDEX.GO',
      statementUid: 'ba0da886-9d90-47e7-a7dd-c5e54061da63',
      originString: '06.07.25 + 0,00 ₸ Покупка YANDEX.GO\n'
    },
    null,
    null
  ]
])('skips specific transactions', (rawTransaction: StatementTransaction, transaction: unknown, account: ConvertedAccount | null) => {
  const defaultAccount: ConvertedAccount = {
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
  expect(convertPdfStatementTransaction(
    rawTransaction,
    account ?? defaultAccount
  )).toEqual(transaction)
})
