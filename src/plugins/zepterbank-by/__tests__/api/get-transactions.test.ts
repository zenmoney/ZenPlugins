import { convertCardAccount, convertCardTransaction, convertStatementTransaction } from '../../converters'
import { mergeTransactions } from '../../mergeTransactions'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'
import { TEST_CARD_TRANSACTIONS, TEST_STATEMENT_TRANSACTIONS } from '../../__mocks__/transactions.sample'
import type { Transaction } from '../../../../types/zenmoney'
import type { FetchCardTransaction, FetchProductStatementOutput, FetchStatementOperation, FetchTransactionsOutput } from '../../types/fetch.types'

const mockFetchCardTransactions = jest.fn()
const mockFetchProductStatement = jest.fn()

const withAnyMovementIds = (transaction: Transaction): Transaction => {
  const [firstMovement, secondMovement] = transaction.movements
  const firstMovementWithAnyId = {
    ...firstMovement,
    id: expect.any(String) as unknown as string
  }

  return {
    ...transaction,
    movements: secondMovement == null
      ? [firstMovementWithAnyId]
      : [
          firstMovementWithAnyId,
          {
            ...secondMovement,
            id: expect.any(String) as unknown as string
          }
        ]
  }
}

const expectBareMovementIdHash = (id: string | null): void => {
  expect(id).toMatch(/^[a-f0-9]{32}$/)
  expect(id).toHaveLength(32)
}

jest.mock('../../fetchApi', () => ({
  ...jest.requireActual('../../fetchApi'),
  fetchCardTransactions: mockFetchCardTransactions,
  fetchProductStatement: mockFetchProductStatement
}))

describe('getTransactions', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getTransactions } = require('../../api') as typeof import('../../api')

  afterEach(() => {
    mockFetchCardTransactions.mockReset()
    mockFetchProductStatement.mockReset()
    delete (global as any).ZenMoney
  })

  it('prefers statement transactions over matching card history duplicates', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const uniqueHistoryTransaction: FetchCardTransaction = {
      effectiveDate: '2026-02-14T11:00:00',
      transacName: 'POS PURCHASE ',
      amount: '2.50',
      currencyIso: 'BYN',
      cardAcceptor: 'UNIQUE SHOP',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС5411'
    }

    const historyTransactions: FetchTransactionsOutput = [
      ...TEST_CARD_TRANSACTIONS.Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8,
      uniqueHistoryTransaction
    ]

    const statementResponse: FetchProductStatementOutput = {
      incomeForPeriod: '0.00',
      outcomeForPeriod: '0.00',
      ibanNum: rawCardAccount.ibanNum,
      contractCurrency: String(rawCardAccount.currency),
      contractCurrencyISO: rawCardAccount.currencyIso,
      operations: TEST_STATEMENT_TRANSACTIONS[rawCardAccount.productId]
    }

    mockFetchCardTransactions.mockResolvedValue({
      status: 200,
      data: historyTransactions,
      error: null
    })
    mockFetchProductStatement.mockResolvedValue({
      status: 200,
      data: statementResponse,
      error: null
    })

    await expect(getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-02-01T00:00:00.000Z'),
      toDate: new Date('2026-02-28T23:59:59.000Z')
    }, account)).resolves.toEqual([
      ...statementResponse.operations.map((operation) => withAnyMovementIds(convertStatementTransaction(operation, account))),
      withAnyMovementIds(convertCardTransaction(uniqueHistoryTransaction, account))
    ])
  })

  it('deduplicates matching history and statement transactions that land in different UTC days', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const historyTransaction: FetchCardTransaction = {
      effectiveDate: '2026-05-24T16:28:45',
      transacName: 'POS PURCHASE ',
      amount: '117.28',
      currencyIso: 'BYN',
      cardAcceptor: 'I.-SHOP"WWW.PASS.RW.BY"',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС4112'
    }

    const statementOperation = {
      transactionDate: '2026-05-24T00:00:00',
      balanceDate: '2026-05-26',
      operationName: 'Оплата товаров и услуг в устройствах других банков',
      operationSum: '117.28',
      transactionSum: '117.28',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1 as const,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      cardPAN: '0000********1111',
      merchant: 'BLR MINSK',
      terminalLocation: 'I.-SHOP"WWW.PASS.RW.BY"',
      purpose: 'Regression case for midnight statement entry',
      MCC: 'MCC 4112'
    }

    mockFetchCardTransactions.mockResolvedValue({
      status: 200,
      data: [historyTransaction],
      error: null
    })
    mockFetchProductStatement.mockResolvedValue({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '0.00',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: [statementOperation]
      },
      error: null
    })

    await expect(getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, account)).resolves.toEqual([
      withAnyMovementIds(convertStatementTransaction(statementOperation, account))
    ])
  })

  it('deduplicates capitalization rows using statement balance date', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const historyTransaction: FetchCardTransaction = {
      effectiveDate: '2026-05-29T18:04:10',
      transacName: 'CREDIT ACCOUNT',
      amount: '0.33',
      currencyIso: 'BYN',
      repeatable: false,
      transOperType: 'credit',
      transMcc: 'МСС0'
    }
    const statementOperation = {
      transactionDate: '2026-05-31T16:39:22',
      balanceDate: '2026-05-29',
      operationName: 'Капитализация (%% тек.периода ко вкладу)',
      operationSum: '0.33',
      transactionSum: '0.00',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: 1 as const,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      corrMFO: 'ZEPTBY2X',
      purpose: 'Начисление процентов на остаток по счету по договору'
    }

    mockFetchCardTransactions.mockResolvedValue({
      status: 200,
      data: [historyTransaction],
      error: null
    })
    mockFetchProductStatement.mockResolvedValue({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '0.00',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: [statementOperation]
      },
      error: null
    })

    await expect(getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, account)).resolves.toEqual([
      withAnyMovementIds(convertStatementTransaction(statementOperation, account))
    ])
  })

  it('keeps the same final id when matching history disappears and only statement remains', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const historyTransaction: FetchCardTransaction = {
      effectiveDate: '2026-05-25T12:34:56',
      transacName: 'POS PURCHASE ',
      amount: '41.71',
      currencyIso: 'BYN',
      cardAcceptor: 'EUROOPT',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС5411'
    }
    const statementOperation = {
      transactionDate: '2026-05-25T00:00:00',
      balanceDate: '2026-05-25',
      operationName: 'Оплата товаров и услуг',
      operationSum: '41.71',
      transactionSum: '41.71',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1 as const,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      merchant: 'BLR MINSK',
      terminalLocation: 'EUROOPT',
      MCC: 'MCC 5411'
    }

    mockFetchCardTransactions.mockResolvedValueOnce({
      status: 200,
      data: [historyTransaction],
      error: null
    })
    mockFetchProductStatement.mockResolvedValueOnce({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '0.00',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: [statementOperation]
      },
      error: null
    })

    const withHistory = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, account)

    mockFetchCardTransactions.mockResolvedValueOnce({
      status: 200,
      data: [],
      error: null
    })
    mockFetchProductStatement.mockResolvedValueOnce({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '0.00',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: [statementOperation]
      },
      error: null
    })

    const statementOnly = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, account)

    expect(statementOnly).toHaveLength(1)
    expect(withHistory).toHaveLength(1)
    expect(statementOnly[0].movements[0].id).toBe(withHistory[0].movements[0].id)
  })

  it('keeps separate same-day same-merchant history transactions distinct', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    mockFetchCardTransactions.mockResolvedValue({
      status: 200,
      data: [
        {
          effectiveDate: '2026-05-25T10:00:00',
          transacName: 'POS PURCHASE ',
          amount: '20.00',
          currencyIso: 'BYN',
          cardAcceptor: 'INTERNET-BANKING ZEPTERBANK',
          repeatable: false,
          transOperType: 'debit',
          transMcc: 'МСС4900'
        },
        {
          effectiveDate: '2026-05-25T18:00:00',
          transacName: 'POS PURCHASE ',
          amount: '20.00',
          currencyIso: 'BYN',
          cardAcceptor: 'INTERNET-BANKING ZEPTERBANK',
          repeatable: false,
          transOperType: 'debit',
          transMcc: 'МСС4900'
        }
      ],
      error: null
    })
    mockFetchProductStatement.mockResolvedValue({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '0.00',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: []
      },
      error: null
    })

    const transactions = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, account)

    expect(transactions).toHaveLength(2)
    expect(transactions[0].movements[0].id).not.toBe(transactions[1].movements[0].id)
  })

  it('treats empty-array statement response as no statement transactions', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const historyTransaction: FetchCardTransaction = {
      effectiveDate: '2026-05-25T10:00:00',
      transacName: 'POS PURCHASE ',
      amount: '20.00',
      currencyIso: 'BYN',
      cardAcceptor: 'INTERNET-BANKING ZEPTERBANK',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС4900'
    }

    mockFetchCardTransactions.mockResolvedValue({
      status: 200,
      data: [historyTransaction],
      error: null
    })
    mockFetchProductStatement.mockResolvedValue({
      status: 200,
      data: [],
      error: null
    })

    await expect(getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, account)).resolves.toEqual([
      withAnyMovementIds(convertCardTransaction(historyTransaction, account))
    ])
  })

  it('deduplicates completed card purchase and keeps it as an outcome', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    mockFetchCardTransactions.mockResolvedValue({
      status: 200,
      data: [
        {
          effectiveDate: '2026-06-25T14:58:59',
          transacName: 'EPOS RETURN OR REFUND',
          amount: '0.00',
          currencyIso: 'BYN',
          cardAcceptor: '21VEK.BY',
          repeatable: false,
          transOperType: 'credit',
          transMcc: 'МСС5300'
        },
        {
          effectiveDate: '2026-06-25T14:37:27',
          transacName: 'EPOS PURCH COMPL',
          amount: '1.22',
          currencyIso: 'BYN',
          cardAcceptor: '21VEK.BY',
          repeatable: false,
          transOperType: 'noop',
          transMcc: 'МСС5300'
        },
        {
          effectiveDate: '2026-06-25T13:36:15',
          transacName: 'EPOS PRE-PURCHASE',
          amount: '1.22',
          currencyIso: 'BYN',
          cardAcceptor: '21VEK.BY',
          repeatable: false,
          transOperType: 'debit',
          transMcc: 'МСС5300'
        }
      ],
      error: null
    })
    mockFetchProductStatement.mockResolvedValue({
      status: 200,
      data: [],
      error: null
    })

    const transactions = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-06-25T00:00:00.000Z'),
      toDate: new Date('2026-06-25T23:59:59.000Z')
    }, account)

    expect(transactions).toHaveLength(1)
    expect(transactions[0].date).toEqual(new Date('2026-06-25T11:37:27.000Z'))
    expect(transactions[0].movements[0].sum).toBe(-1.22)
    expect(transactions[0].merchant).toEqual({
      fullTitle: '21VEK.BY',
      mcc: 5300,
      location: null
    })
  })

  it('replaces an unambiguous railway hold with its smaller final commission', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const makeHistoryTransaction = (effectiveDate: string, amount: string): FetchCardTransaction => ({
      effectiveDate,
      transacName: 'EPOS PRE-PURCHASE',
      amount,
      currencyIso: 'BYN',
      cardAcceptor: 'I.-SHOP"WWW.PASS.RW.BY"',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС4112'
    })
    const makeStatementOperation = (amount: string): FetchStatementOperation => ({
      transactionDate: '2026-08-10T00:00:00',
      balanceDate: '2026-08-12',
      operationName: 'Оплата товаров и услуг в устройствах других банков',
      operationSum: amount,
      transactionSum: amount,
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1 as const,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      merchant: 'BLR MINSK',
      terminalLocation: 'I.-SHOP"WWW.PASS.RW.BY"',
      MCC: 'MCC 4112'
    })

    mockFetchCardTransactions.mockResolvedValue({
      status: 200,
      data: [
        makeHistoryTransaction('2026-08-10T21:17:23', '30.99'),
        makeHistoryTransaction('2026-08-10T20:47:52', '30.99'),
        makeHistoryTransaction('2026-08-10T20:42:50', '57.90')
      ],
      error: null
    })
    mockFetchProductStatement.mockResolvedValue({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '79.80',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: [
          makeStatementOperation('30.99'),
          makeStatementOperation('30.99'),
          makeStatementOperation('17.82')
        ]
      },
      error: null
    })

    const transactions = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-08-10T00:00:00.000Z'),
      toDate: new Date('2026-08-12T23:59:59.000Z')
    }, account)

    expect(transactions.map((transaction) => transaction.movements[0].sum)).toEqual([-30.99, -30.99, -17.82])
    expect(transactions.some((transaction) => transaction.movements[0].sum === -57.9)).toBe(false)
    expect(new Set(transactions.map((transaction) => transaction.movements[0].id)).size).toBe(3)
    for (const transaction of transactions) {
      expectBareMovementIdHash(transaction.movements[0].id)
    }
  })

  it('does not guess between ambiguous partial railway settlements', () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const makeHistoryTransaction = (amount: string): Transaction => convertCardTransaction({
      effectiveDate: '2026-08-10T20:42:50',
      transacName: 'EPOS PRE-PURCHASE',
      amount,
      currencyIso: 'BYN',
      cardAcceptor: 'I.-SHOP"WWW.PASS.RW.BY"',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС4112'
    }, account)
    const statementTransaction = convertStatementTransaction({
      transactionDate: '2026-08-10T00:00:00',
      balanceDate: '2026-08-12',
      operationName: 'Оплата товаров и услуг в устройствах других банков',
      operationSum: '17.82',
      transactionSum: '17.82',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      merchant: 'BLR MINSK',
      terminalLocation: 'I.-SHOP"WWW.PASS.RW.BY"',
      MCC: 'MCC 4112'
    }, account)

    const transactions = mergeTransactions([
      makeHistoryTransaction('57.90'),
      makeHistoryTransaction('40.00')
    ], [statementTransaction])

    expect(transactions.map((transaction) => transaction.movements[0].sum)).toEqual([-57.9, -40, -17.82])
  })

  it('keeps the same final id when bank changes merchant and mcc between syncs', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const historyTransaction: FetchCardTransaction = {
      effectiveDate: '2026-06-24T11:56:00',
      transacName: 'POS PURCHASE ',
      amount: '65.84',
      currencyIso: 'BYN',
      cardAcceptor: 'st. m. Grushevka',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС4111'
    }
    const statementOperation = {
      transactionDate: '2026-06-24T00:00:00',
      balanceDate: '2026-06-25',
      operationName: 'Оплата товаров и услуг в устройствах других банков',
      operationSum: '65.84',
      transactionSum: '65.84',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1 as const,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      merchant: 'BLR MINSK',
      terminalLocation: 'KIOSK N145',
      MCC: 'MCC 4131'
    }

    mockFetchCardTransactions.mockResolvedValueOnce({
      status: 200,
      data: [historyTransaction],
      error: null
    })
    mockFetchProductStatement.mockResolvedValueOnce({
      status: 200,
      data: [],
      error: null
    })

    const historyOnly = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-06-24T00:00:00.000Z'),
      toDate: new Date('2026-06-24T23:59:59.000Z')
    }, account)

    mockFetchCardTransactions.mockResolvedValueOnce({
      status: 200,
      data: [],
      error: null
    })
    mockFetchProductStatement.mockResolvedValueOnce({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '0.00',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: [statementOperation]
      },
      error: null
    })

    const statementOnly = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-06-24T00:00:00.000Z'),
      toDate: new Date('2026-06-25T23:59:59.000Z')
    }, account)

    expect(historyOnly).toHaveLength(1)
    expect(statementOnly).toHaveLength(1)
    expect(statementOnly[0].movements[0].id).toBe(historyOnly[0].movements[0].id)
  })

  it('uses the same bare hash when history later becomes statement-only', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const historyTransaction: FetchCardTransaction = {
      effectiveDate: '2026-06-24T11:56:00',
      transacName: 'POS PURCHASE ',
      amount: '65.84',
      currencyIso: 'BYN',
      cardAcceptor: 'st. m. Grushevka',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС4111'
    }
    const statementOperation = {
      transactionDate: '2026-06-24T00:00:00',
      balanceDate: '2026-06-25',
      operationName: 'Оплата товаров и услуг в устройствах других банков',
      operationSum: '65.84',
      transactionSum: '65.84',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1 as const,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      merchant: 'BLR MINSK',
      terminalLocation: 'KIOSK N145',
      MCC: 'MCC 4131'
    }

    mockFetchCardTransactions.mockResolvedValueOnce({
      status: 200,
      data: [historyTransaction],
      error: null
    })
    mockFetchProductStatement.mockResolvedValueOnce({
      status: 200,
      data: [],
      error: null
    })

    const historyOnly = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-06-24T00:00:00.000Z'),
      toDate: new Date('2026-06-24T23:59:59.000Z')
    }, account)

    mockFetchCardTransactions.mockResolvedValueOnce({
      status: 200,
      data: [],
      error: null
    })
    mockFetchProductStatement.mockResolvedValueOnce({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '0.00',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: [statementOperation]
      },
      error: null
    })

    const statementOnly = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-06-24T00:00:00.000Z'),
      toDate: new Date('2026-06-25T23:59:59.000Z')
    }, account)

    expect(historyOnly).toHaveLength(1)
    expectBareMovementIdHash(historyOnly[0].movements[0].id)
    expect(statementOnly).toHaveLength(1)
    expect(statementOnly[0].movements[0].id).toBe(historyOnly[0].movements[0].id)
  })

  it('returns bare hashes for statement transactions regardless source identity length', () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = {
      ...convertCardAccount(rawCardAccount),
      id: 'a'.repeat(43)
    }
    const statementOperation = {
      transactionDate: '2026-08-03T00:00:00',
      balanceDate: '2026-08-03',
      operationName: 'Оплата товаров и услуг в устройствах других банков',
      transactionSum: '41.10',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSum: '41.10',
      operationSign: -1 as const,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      merchant: 'BLR MINSK',
      terminalLocation: 'I.-SHOP"WWW.PASS.RW.BY"',
      MCC: 'MCC 4112'
    }
    const atLimitTransaction = convertStatementTransaction(statementOperation, account)
    const overLimitTransaction = convertStatementTransaction({
      ...statementOperation,
      transactionSum: '65.84',
      operationSum: '65.84',
      terminalLocation: 'st. m. Mikhalovo',
      MCC: 'MCC 4111'
    }, account)

    const [atLimit, overLimit] = mergeTransactions([], [atLimitTransaction, overLimitTransaction])

    expectBareMovementIdHash(atLimit.movements[0].id)
    expectBareMovementIdHash(overLimit.movements[0].id)
    expect(atLimit.movements[0].id).not.toBe(overLimit.movements[0].id)
    expect(mergeTransactions([], [overLimitTransaction])[0].movements[0].id).toBe(overLimit.movements[0].id)
  })

  it('returns bare hashes for history transactions with Unicode merchant data', () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = {
      ...convertCardAccount(rawCardAccount),
      id: 'a'.repeat(20)
    }
    const merchant = 'К'.repeat(10)
    const historyTransaction = convertCardTransaction({
      effectiveDate: '2026-08-03T12:00:00',
      transacName: 'POS PURCHASE ',
      amount: '1.22',
      currencyIso: 'BYN',
      cardAcceptor: merchant,
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС5300'
    }, account)
    const merged = mergeTransactions([historyTransaction], [])[0]

    expectBareMovementIdHash(historyTransaction.movements[0].id)
    expectBareMovementIdHash(merged.movements[0].id)
  })

  it('keeps pending card id stable after the bank returns it as a posted purchase', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    const pendingTransaction: FetchCardTransaction = {
      effectiveDate: '2026-06-25T13:36:15',
      transacName: 'EPOS PRE-PURCHASE',
      amount: '1.22',
      currencyIso: 'BYN',
      cardAcceptor: '21VEK.BY',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС5300'
    }
    const postedTransaction: FetchCardTransaction = {
      ...pendingTransaction,
      transacName: 'POS PURCHASE '
    }

    mockFetchCardTransactions.mockResolvedValueOnce({
      status: 200,
      data: [pendingTransaction],
      error: null
    })
    mockFetchProductStatement.mockResolvedValueOnce({
      status: 200,
      data: [],
      error: null
    })

    const pendingOnly = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-06-25T00:00:00.000Z'),
      toDate: new Date('2026-06-25T23:59:59.000Z')
    }, account)

    mockFetchCardTransactions.mockResolvedValueOnce({
      status: 200,
      data: [postedTransaction],
      error: null
    })
    mockFetchProductStatement.mockResolvedValueOnce({
      status: 200,
      data: [],
      error: null
    })

    const postedOnly = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-06-25T00:00:00.000Z'),
      toDate: new Date('2026-06-25T23:59:59.000Z')
    }, account)

    expect(pendingOnly).toHaveLength(1)
    expectBareMovementIdHash(pendingOnly[0].movements[0].id)
    expect(postedOnly).toHaveLength(1)
    expect(postedOnly[0].movements[0].id).toBe(pendingOnly[0].movements[0].id)
  })

  it('keeps separate same-day same-merchant statement transactions distinct', async () => {
    const rawCardAccount = TEST_ACCOUNTS.CARD.find((account) => account.productCardId === 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8')

    if (rawCardAccount == null) {
      throw new Error('Card account not found')
    }

    const account = convertCardAccount(rawCardAccount)
    mockFetchCardTransactions.mockResolvedValue({
      status: 200,
      data: [],
      error: null
    })
    mockFetchProductStatement.mockResolvedValue({
      status: 200,
      data: {
        incomeForPeriod: '0.00',
        outcomeForPeriod: '0.00',
        ibanNum: rawCardAccount.ibanNum,
        contractCurrency: String(rawCardAccount.currency),
        contractCurrencyISO: rawCardAccount.currencyIso,
        operations: [
          {
            transactionDate: '2026-05-25T00:00:00',
            balanceDate: '2026-05-25',
            operationName: 'Оплата в интернет-банке',
            operationSum: '20.00',
            transactionSum: '20.00',
            transactionCurrency: '933',
            transactionCurrencyISO: 'BYN',
            operationSign: -1 as const,
            operationCurrency: '933',
            operationCurrencyIso: 'BYN',
            merchant: 'BLR MINSK',
            terminalLocation: 'INTERNET-BANKING ZEPTERBANK',
            MCC: 'MCC 4900'
          },
          {
            transactionDate: '2026-05-25T00:00:00',
            balanceDate: '2026-05-25',
            operationName: 'Оплата в интернет-банке',
            operationSum: '20.00',
            transactionSum: '20.00',
            transactionCurrency: '933',
            transactionCurrencyISO: 'BYN',
            operationSign: -1 as const,
            operationCurrency: '933',
            operationCurrencyIso: 'BYN',
            merchant: 'BLR MINSK',
            terminalLocation: 'INTERNET-BANKING ZEPTERBANK',
            MCC: 'MCC 4900'
          }
        ]
      },
      error: null
    })

    const transactions = await getTransactions({
      sessionToken: 'session-token',
      fromDate: new Date('2026-05-01T00:00:00.000Z'),
      toDate: new Date('2026-05-31T23:59:59.000Z')
    }, account)

    expect(transactions).toHaveLength(2)
    expect(transactions[0].movements[0].id).not.toBe(transactions[1].movements[0].id)
  })
})
