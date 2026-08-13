import { AccountType, Account } from '../../../types/zenmoney'
import { convertAccounts, convertTransaction, convertTransactions } from '../converters'
import { ProductKind } from '../models'

describe('convertAccounts', () => {
  it('converts current account and loan', () => {
    expect(convertAccounts([
      {
        accountId: 'test-current-account-id',
        productId: 'test-current-product-id',
        productType: 'account',
        productName: 'Текущий счет физического лица',
        accountNumber: 'TEST-CURRENT-ACCOUNT-NUMBER',
        balance: {
          amount: 123456,
          currency: {
            code: 'RUB'
          }
        },
        availableBalance: 120000
      },
      {
        id: 'test-loan-id',
        productType: 'loan',
        productName: 'Автокредит "Стандарт"',
        contractNumber: 'TEST-LOAN-CONTRACT',
        openDate: '01.02.2030',
        maturityDate: '01.02.2031',
        amount: 250000,
        currentDebt: 200000,
        currency: 'RUB',
        interestRate: 12.5
      }
    ])).toEqual([
      {
        account: {
          id: 'test-current-account-id',
          type: AccountType.checking,
          title: 'Текущий счет физического лица',
          instrument: 'RUB',
          syncIds: ['test-current-account-id', 'TEST-CURRENT-ACCOUNT-NUMBER'],
          savings: false,
          balance: 123456,
          available: 120000
        },
        product: {
          id: 'test-current-product-id',
          accountId: 'test-current-account-id',
          kind: ProductKind.account
        }
      },
      {
        account: expect.objectContaining({
          id: 'test-loan-id',
          type: AccountType.loan,
          title: 'Автокредит "Стандарт"',
          instrument: 'RUB',
          syncIds: ['test-loan-id', 'TEST-LOAN-CONTRACT'],
          balance: -200000,
          startBalance: 250000,
          percent: 12.5
        }),
        product: {
          id: 'test-loan-id',
          accountId: 'test-loan-id',
          kind: ProductKind.loan
        }
      }
    ])
  })

  it('converts card-like products and normalizes string numbers', () => {
    expect(convertAccounts([
      {
        cardAccountId: 'test-card-account-id',
        cardId: 'test-card-product-id',
        productType: 'card',
        cardName: 'Тестовая карта',
        maskedPan: '000000******0000',
        balance: {
          value: '12 345,67',
          currency: {
            shortName: 'RUB'
          }
        },
        availableBalance: '10 000,50',
        cardLimit: '5 000',
        active: false
      }
    ])).toEqual([
      {
        account: {
          id: 'test-card-account-id',
          type: AccountType.ccard,
          title: 'Тестовая карта',
          instrument: 'RUB',
          syncIds: ['test-card-account-id', '000000******0000'],
          savings: false,
          balance: 12345.67,
          available: 10000.5,
          creditLimit: 5000,
          archived: true
        },
        product: {
          id: 'test-card-product-id',
          accountId: 'test-card-account-id',
          kind: ProductKind.card
        }
      }
    ])
  })
})

describe('convertTransaction', () => {
  const account: Account = {
    id: 'test-account-id',
    type: AccountType.checking,
    title: 'Текущий счет физического лица',
    instrument: 'RUB',
    syncIds: ['test-account-id'],
    savings: false,
    balance: 0
  }

  it('converts income transaction', () => {
    expect(convertTransaction({
      id: 'test-operation-income',
      operDate: '03.04.2030',
      accountAmount: {
        amount: 250000,
        currency: {
          code: 'RUB'
        }
      },
      details: 'Тестовое зачисление',
      pfmCategoryTO: {
        enName: 'Other Income'
      }
    }, account)).toEqual({
      hold: null,
      date: new Date(2030, 3, 3),
      movements: [
        {
          id: expect.stringMatching(/^[a-f0-9]{32}$/),
          account: { id: 'test-account-id' },
          invoice: null,
          sum: 250000,
          fee: 0
        }
      ],
      merchant: {
        fullTitle: 'Тестовое зачисление',
        mcc: null,
        location: null
      },
      comment: 'Other Income'
    })
  })

  it('converts outcome transaction', () => {
    expect(convertTransaction({
      id: 'test-operation-outcome',
      operDate: '04.04.2030',
      accountAmount: {
        amount: -1639.34,
        currency: {
          code: 'RUB'
        }
      },
      details: 'ПАО СКБ Приморья "Примсоцбанк"//Комиссия банка',
      pfmCategoryTO: {
        enName: 'Others'
      }
    }, account)).toEqual({
      hold: null,
      date: new Date(2030, 3, 4),
      movements: [
        {
          id: expect.stringMatching(/^[a-f0-9]{32}$/),
          account: { id: 'test-account-id' },
          invoice: null,
          sum: -1639.34,
          fee: 0
        }
      ],
      merchant: {
        fullTitle: 'ПАО СКБ Приморья "Примсоцбанк"//Комиссия банка',
        mcc: null,
        location: null
      },
      comment: 'Others'
    })
  })

  it('keeps successful state transactions', () => {
    expect(convertTransactions([
      {
        id: 'operation-success',
        operDate: '05.04.2030',
        amount: -1000,
        currency: {
          code: 'RUB'
        },
        details: 'Получатель перевода',
        state: {
          name: 'Исполнен',
          code: 'successes'
        },
        hold: false
      }
    ], account)).toEqual([
      {
        hold: false,
        date: new Date(2030, 3, 5),
        movements: [
          {
            id: expect.stringMatching(/^[a-f0-9]{32}$/),
            account: { id: 'test-account-id' },
            invoice: null,
            sum: -1000,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Получатель перевода',
          mcc: null,
          location: null
        },
        comment: null
      }
    ])
  })

  it('skips failed state transactions', () => {
    expect(convertTransactions([
      {
        id: 'operation-failed',
        operDate: '05.04.2030',
        amount: -1000,
        currency: {
          code: 'RUB'
        },
        details: 'Получатель перевода',
        state: {
          name: 'Не исполнен',
          code: 'rejected'
        },
        hold: false
      }
    ], account)).toEqual([])
  })

  it('converts debit and credit fields into a single movement sum', () => {
    expect(convertTransaction({
      transactionId: 'test-operation-credit-debit',
      operationDate: '06.04.2030 07:08:09',
      creditAmount: '1 500,50',
      debitAmount: '100.25',
      currencyCode: 'RUB',
      description: 'Корректировка по счету',
      commissionAmount: '10,50',
      pending: true
    }, account)).toEqual({
      hold: true,
      date: new Date(2030, 3, 6, 7, 8, 9),
      movements: [
        {
          id: expect.stringMatching(/^[a-f0-9]{32}$/),
          account: { id: 'test-account-id' },
          invoice: null,
          sum: 1400.25,
          fee: 10.5
        }
      ],
      merchant: {
        fullTitle: 'Корректировка по счету',
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('adds invoice when original transaction currency differs from account currency', () => {
    expect(convertTransaction({
      documentId: 'test-operation-fx',
      postingDate: '07.04.2030',
      accountAmount: {
        value: -950,
        currency: {
          code: 'RUB'
        }
      },
      originalAmount: {
        value: -10,
        currency: {
          code: 'USD'
        }
      },
      merchant: {
        name: 'Test Merchant'
      }
    }, account).movements[0]).toEqual({
      id: expect.stringMatching(/^[a-f0-9]{32}$/),
      account: { id: 'test-account-id' },
      invoice: {
        sum: -10,
        instrument: 'USD'
      },
      sum: -950,
      fee: 0
    })
  })

  it('keeps movement id stable when bank transaction id changes', () => {
    const first = convertTransaction({
      id: 'temporary-bank-operation-id',
      operDate: '08.04.2030 09:10:11',
      amount: -500,
      currency: {
        code: 'RUB'
      },
      details: 'Тестовая покупка'
    }, account)
    const second = convertTransaction({
      id: 'posted-bank-operation-id',
      operDate: '08.04.2030 09:10:11',
      amount: -500,
      currency: {
        code: 'RUB'
      },
      details: 'Тестовая покупка'
    }, account)

    expect(first.movements[0].id).toBe(second.movements[0].id)
    expect(first.movements[0].id).not.toBe('temporary-bank-operation-id')
  })

  it('keeps movement id stable when bank enrichment fields change', () => {
    const first = convertTransaction({
      operDate: '08.04.2030 09:10:11',
      amount: -500,
      currency: {
        code: 'RUB'
      },
      details: 'Тестовая покупка',
      mcc: 5411,
      pfmCategoryTO: {
        enName: 'Groceries'
      }
    }, account)
    const second = convertTransaction({
      operDate: '08.04.2030 09:10:11',
      amount: -500,
      currency: {
        code: 'RUB'
      },
      details: 'Тестовая покупка',
      mcc: 5999,
      pfmCategoryTO: {
        enName: 'Other'
      }
    }, account)

    expect(first.movements[0].id).toBe(second.movements[0].id)
  })

  it('keeps identical transactions from one response separate', () => {
    const transactions = convertTransactions([
      {
        id: 'first-bank-operation-id',
        operDate: '09.04.2030 10:11:12',
        amount: -100,
        currency: {
          code: 'RUB'
        },
        details: 'Одинаковая тестовая покупка'
      },
      {
        id: 'second-bank-operation-id',
        operDate: '09.04.2030 10:11:12',
        amount: -100,
        currency: {
          code: 'RUB'
        },
        details: 'Одинаковая тестовая покупка'
      }
    ], account)

    expect(transactions).toHaveLength(2)
    expect(transactions[0].movements[0].id).toMatch(/^[a-f0-9]{32}$/)
    expect(transactions[1].movements[0].id).toMatch(/^[a-f0-9]{32}$/)
    expect(transactions[0].movements[0].id).not.toBe(transactions[1].movements[0].id)
  })
})
