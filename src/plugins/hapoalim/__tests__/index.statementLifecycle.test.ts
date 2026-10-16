import { AccountType } from '../../../types/zenmoney'
import type { Account, ScrapeFunc, Transaction } from '../../../types/zenmoney'

const { patchTransactions } = jest.requireActual<{
  patchTransactions: (transactions: Transaction[], accounts: Account[]) => unknown[]
}>('../../../common/adapters')
const { adjustTransactions } = jest.requireActual<{
  adjustTransactions: (input: { transactions: Transaction[] }) => Transaction[]
}>('../../../common/transactionGroupHandler')
const { convertTransaction } = jest.requireActual<{
  convertTransaction: (record: unknown, account: Account) => Transaction | null
}>('../converters')
const { record } = jest.requireActual<{ record: unknown }>('../__fixtures__/checking-today.projected.json')
const originalHost = global.ZenMoney
const accounts: Account[] = [1, 2].map(number => ({
  id: `model-parent-${number}`,
  type: AccountType.checking,
  title: `Model checking ${number}`,
  instrument: 'ILS',
  syncIds: [`model-parent-${number}`],
  balance: 1000
}))
const date = new Date('2026-10-15T00:00:00+02:00')
const legacyUnknown = {
  date: date.getTime(),
  comment: null,
  payee: 'Captured counterparty',
  mcc: null,
  id: null,
  income: 0,
  incomeAccount: accounts[0].id,
  outcome: 100,
  outcomeAccount: accounts[0].id,
  opIncome: undefined,
  opIncomeInstrument: undefined,
  opOutcome: undefined,
  opOutcomeInstrument: undefined
}
const options = {
  preferences: { authenticationMethod: 'web' as const },
  fromDate: new Date('2026-10-01T00:00:00+02:00'),
  toDate: new Date('2026-10-16T23:59:59+02:00'),
  isFirstRun: false,
  isInBackground: false
}

function expense (parent = accounts[0].id, hold: boolean | null = null): Transaction {
  return {
    hold,
    date,
    movements: [{ id: null, account: { id: parent }, invoice: null, sum: -100, fee: 0 }],
    merchant: { country: null, city: null, title: 'Captured counterparty', mcc: null, location: null },
    comment: null
  }
}

function installHost (transactionDtoV2: boolean): void {
  // Partial native host for local tests only; no network, cookies or app database.
  Object.defineProperty(global, 'ZenMoney', {
    configurable: true,
    writable: true,
    value: {
      features: { transactionDtoV2, dateProcessing: true },
      getData: () => ({ modelSession: true }),
      setData: jest.fn(),
      saveData: jest.fn(async () => {}),
      isAccountSkipped: () => false
    }
  })
}

afterEach(() => {
  global.ZenMoney = originalHost
  jest.restoreAllMocks()
})

describe.each([false, true])('captured TODAY through final SDK adaptation (DTOv2: %s)', dtoV2 => {
  it('preserves the entire financial result and unknown lifecycle [STATUS-001, ID-001]', () => {
    installHost(dtoV2)
    const converted = convertTransaction(record, accounts[0])
    expect(converted).toStrictEqual(expense())
    if (converted === null) throw new Error('Captured TODAY operation was lost')
    const grouped = adjustTransactions({ transactions: [converted] })
    expect(grouped).toStrictEqual([expense()])
    expect(patchTransactions(grouped, accounts)).toStrictEqual(dtoV2 ? [expense()] : [legacyUnknown])
  })

  it('[model] serializes successive unknown and settled DTOs without inventing or changing identity', () => {
    installHost(dtoV2)
    // Domain lifecycle model only; no assumed bank REGULAR counterpart or host merge.
    for (const hold of [null, false, false]) {
      const input = expense(accounts[0].id, hold)
      const expected = dtoV2
        ? expense(accounts[0].id, hold)
        : { ...legacyUnknown, ...(hold === null ? {} : { hold }) }
      expect(patchTransactions(adjustTransactions({ transactions: [input] }), accounts)).toStrictEqual([expected])
      expect(input).toStrictEqual(expense(accounts[0].id, hold))
    }
  })
})

// [model] Statements below contain domain DTOs injected after bank conversion.
// The settled DTO is NOT a captured REGULAR counterpart. These tests exercise
// the real entrypoint, grouping and SDK, NOT the native cross-run reconciler.
describe('[model] successive current statements, not a plugin-side transaction cache', () => {
  let scrape: ScrapeFunc<{ authenticationMethod?: 'direct' | 'web' }>
  let histories: Record<string, Transaction[]>
  let fetchTransactions: jest.Mock<Promise<Transaction[]>, [unknown, { id: string }, Date, Date]>
  let login: jest.Mock
  let recover: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    installHost(true)
    histories = { [accounts[0].id]: [], [accounts[1].id]: [] }
    fetchTransactions = jest.fn<Promise<Transaction[]>, [unknown, { id: string }, Date, Date]>(async (_auth, product) => histories[product.id])
    login = jest.fn(async () => { throw new Error('Unexpected model login') })
    recover = jest.fn(async () => { throw new Error('Unexpected model recovery') })
    jest.doMock('../api', () => ({
      authenticationMethod: () => 'web',
      isMobileAuth: () => false,
      fetchAccounts: jest.fn(async () => []),
      fetchTransactions,
      normalizeStoredAuth: (auth: unknown) => auth,
      withAuthUpdates: async (auth: unknown, _onUpdate: unknown, fn: (auth: unknown) => Promise<unknown>) => await fn(auth),
      withSessionDeadline: async (fn: () => Promise<unknown>) => await fn(),
      isLikelyAuthGateError: () => false,
      login,
      recoverAuthFromCookieStore: recover
    }))
    jest.doMock('../converters', () => ({
      convertAccounts: () => accounts.map(account => ({ mainProduct: { id: account.id, type: 'account' }, account })),
      convertTransaction: (transaction: Transaction) => transaction
    }))
    jest.doMock('../../../common/network/cookies', () => ({
      restoreCookies: jest.fn(async () => {}),
      saveCookies: jest.fn(async () => {})
    }))
    jest.dontMock('../../../common/transactionGroupHandler')
    scrape = jest.requireActual<{ scrape: typeof scrape }>('../index').scrape
  })

  afterEach(() => {
    expect(login).not.toHaveBeenCalled()
    expect(recover).not.toHaveBeenCalled()
    jest.dontMock('../api')
    jest.dontMock('../converters')
    jest.dontMock('../../../common/network/cookies')
  })

  it('returns only the current unknown or settled representation across repeated and overlapping runs', async () => {
    const unknown = expense()
    const settled = expense(accounts[0].id, false)
    const unchangedOther = expense(accounts[1].id, false)
    const source = JSON.stringify([unknown, settled, unchangedOther])
    histories[accounts[1].id] = [unchangedOther]
    for (const current of [unknown, unknown, settled, settled]) {
      histories[accounts[0].id] = [current]
      const result = await scrape(options)
      expect(result).toEqual({ accounts, transactions: [current, unchangedOther] })
      expect(patchTransactions(result.transactions, accounts)).toEqual([current, unchangedOther])
    }
    expect(JSON.stringify([unknown, settled, unchangedOther])).toBe(source)
    expect(fetchTransactions).toHaveBeenCalledTimes(8)
    for (let index = 0; index < 8; index++) {
      expect(fetchTransactions.mock.calls[index].slice(1)).toEqual([
        { id: accounts[index % 2].id, type: 'account' }, options.fromDate, options.toDate
      ])
    }
  })

  it.each([null, true])('does not carry an absent operation forward or invent a refund (previous hold: %s)', async hold => {
    histories[accounts[0].id] = [expense(accounts[0].id, hold)]
    expect(await scrape(options)).toEqual({ accounts, transactions: histories[accounts[0].id] })
    histories[accounts[0].id] = []
    expect(await scrape(options)).toEqual({ accounts, transactions: [] })
  })

  it('preserves two equal legitimate operations and their account ownership without heuristic deduplication', async () => {
    const unknown = expense()
    const settled = expense(accounts[0].id, false)
    histories[accounts[0].id] = [unknown, { ...unknown }, settled]
    histories[accounts[1].id] = [expense(accounts[1].id)]
    const expected = [unknown, unknown, settled, expense(accounts[1].id)]
    expect(await scrape(options)).toEqual({ accounts, transactions: expected })
    expect(patchTransactions(expected, accounts)).toEqual(expected)
    histories[accounts[0].id].reverse()
    expect(await scrape(options)).toEqual({ accounts, transactions: [settled, unknown, unknown, expense(accounts[1].id)] })
  })

  it('does not backdate or rewrite changed booked financial fields using an old unknown record', async () => {
    histories[accounts[0].id] = [expense()]
    expect(await scrape(options)).toEqual({ accounts, transactions: [expense()] })
    const booked: Transaction = {
      ...expense(accounts[0].id, false),
      date: new Date('2026-10-16T00:00:00+02:00'),
      movements: [{ id: null, account: { id: accounts[0].id }, invoice: null, sum: -101, fee: 0 }],
      merchant: { country: null, city: null, title: 'Model booked counterparty', mcc: null, location: null }
    }
    histories[accounts[0].id] = [booked]
    expect(await scrape(options)).toEqual({ accounts, transactions: [booked] })
    expect(patchTransactions([booked], accounts)).toEqual([booked])
  })

  it('keeps an unchanged operation on the lower date boundary when the request windows overlap', async () => {
    histories[accounts[0].id] = [expense()]
    expect(await scrape(options)).toEqual({ accounts, transactions: [expense()] })
    expect(await scrape({ ...options, fromDate: date })).toEqual({ accounts, transactions: [expense()] })
    expect(await scrape({ ...options, fromDate: new Date('2026-10-16T00:00:00+02:00') })).toEqual({ accounts, transactions: [] })
  })

  it('propagates an incomplete second account instead of returning a successful partial statement', async () => {
    histories[accounts[0].id] = [expense()]
    const failure = new Error('Model second-account history unavailable')
    fetchTransactions.mockResolvedValueOnce(histories[accounts[0].id]).mockRejectedValueOnce(failure)
    await expect(scrape(options)).rejects.toBe(failure)
    histories[accounts[0].id] = []
    expect(await scrape(options)).toEqual({ accounts, transactions: [] })
  })
})
