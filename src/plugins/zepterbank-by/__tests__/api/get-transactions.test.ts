import { convertCardAccount, convertCardTransaction, convertStatementTransaction } from '../../converters'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'
import { TEST_CARD_TRANSACTIONS, TEST_STATEMENT_TRANSACTIONS } from '../../__mocks__/transactions.sample'
import type { FetchCardTransaction, FetchProductStatementOutput, FetchTransactionsOutput } from '../../types/fetch.types'

const mockFetchCardTransactions = jest.fn()
const mockFetchProductStatement = jest.fn()

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
      ...statementResponse.operations.map((operation) => convertStatementTransaction(operation, account)),
      convertCardTransaction(uniqueHistoryTransaction, account)
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
      convertStatementTransaction(statementOperation, account)
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
      convertStatementTransaction(statementOperation, account)
    ])
  })
})
