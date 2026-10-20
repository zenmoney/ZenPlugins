import { createHash } from 'crypto'
import type { MobileAuth } from '../mobileSession'

// [model] Real plugin, native fetch polyfill, cookie transport, converters and
// publication adapter. Synthetic rows test orchestration, not bank schemas or
// native database matching. Observed control shapes have separate fixture tests.
const originalHost = global.ZenMoney
const originalFetch = global.fetch
const OriginalHeaders = global.Headers
const OriginalURL = global.URL
const mockDate = jest.requireActual<{ set: (date: string) => void, reset: () => void }>('mockdate')
const parents = [1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber }))
const scope = (parent: string): string => `hapoalim-deposit:${createHash('sha256').update(parent).digest('hex')}:1530001`
// [model] Mutations of domain DTOs at the SDK boundary, never bank payloads.
// Exercise every deposit ADE predicate and common account rejection category.
const accountRejections: Array<{ name: string, change: Record<string, unknown>, code: string }> = [
  { name: 'positive step without interval', change: { payoffInterval: null, payoffStep: 1 }, code: 'ADE' },
  { name: 'interval without positive step', change: { payoffInterval: 'month', payoffStep: 0 }, code: 'ADE' },
  { name: 'unsupported interval with positive step', change: { payoffInterval: 'week', payoffStep: 1 }, code: 'ADE' },
  { name: 'missing payoff step', change: { payoffStep: undefined }, code: 'ADE' },
  { name: 'null payoff step', change: { payoffStep: null }, code: 'ADE' },
  { name: 'string payoff step', change: { payoffStep: '1' }, code: 'ADE' },
  { name: 'negative payoff step', change: { payoffStep: -1 }, code: 'ADE' },
  { name: 'fractional payoff step', change: { payoffStep: 0.5 }, code: 'ADE' },
  { name: 'NaN payoff step', change: { payoffStep: NaN }, code: 'ADE' },
  { name: 'missing term', change: { endDateOffset: undefined }, code: 'ADE' },
  { name: 'null term', change: { endDateOffset: null }, code: 'ADE' },
  { name: 'string term', change: { endDateOffset: '6' }, code: 'ADE' },
  { name: 'zero term', change: { endDateOffset: 0 }, code: 'ADE' },
  { name: 'negative term', change: { endDateOffset: -1 }, code: 'ADE' },
  { name: 'fractional term', change: { endDateOffset: 0.5 }, code: 'ADE' },
  { name: 'NaN term', change: { endDateOffset: NaN }, code: 'ADE' },
  { name: 'missing term interval', change: { endDateOffsetInterval: undefined }, code: 'ADE' },
  { name: 'unsupported term interval', change: { endDateOffsetInterval: 'week' }, code: 'ADE' },
  { name: 'missing opening date', change: { startDate: undefined }, code: 'ADE' },
  { name: 'invalid opening date', change: { startDate: new Date(NaN) }, code: 'ADE' },
  { name: 'missing capitalization', change: { capitalization: undefined }, code: 'ADE' },
  { name: 'non-boolean capitalization', change: { capitalization: 'false' }, code: 'ADE' },
  { name: 'missing interest rate', change: { percent: undefined }, code: 'ADE' },
  { name: 'unknown interest rate', change: { percent: null }, code: 'ADE' },
  { name: 'string interest rate', change: { percent: '0.5' }, code: 'ADE' },
  { name: 'empty ID', change: { id: '' }, code: 'AID' },
  { name: 'empty title', change: { title: '' }, code: 'ATI' },
  { name: 'unsupported type', change: { type: 'unsupported' }, code: 'ATY' },
  { name: 'empty aliases', change: { syncID: [] }, code: 'ASY' },
  { name: 'empty alias', change: { syncID: [''] }, code: 'ASY' },
  { name: 'string balance', change: { balance: '5100' }, code: 'ABA' },
  { name: 'string principal', change: { startBalance: '5000' }, code: 'ABA' }
]
const options = { preferences: { authenticationMethod: 'direct' }, fromDate: new Date('2026-09-01T00:00:00Z'), toDate: new Date('2026-09-28T00:00:00Z'), isFirstRun: false }
const land = { flow: 'AUTHENTICATE', state: 'LANDPAGE', error: null }
const challenge = { flow: 'AUTHENTICATE', state: 'LOGONOTP', error: null }
const stepUp = { flow: 'STEPUP', state: 'STEPUPOTP', target: '', result: null, error: null }
const row = (parent: string, index: number): Record<string, unknown> => ({
  serialNumber: index,
  eventAmount: index + 1,
  eventActivityTypeCode: parent.endsWith('1001') ? 1 : 2,
  formattedEventDate: '2026-09-10T00:00:00.000Z',
  activityDescription: `model ${parent} ${index}`,
  transactionType: index === 0 ? 'TODAY' : 'REGULAR',
  rejectedDataEventPertainingIndication: index === 0 ? '' : 'N'
})
const deposit = (parent: string): Record<string, unknown> => ({
  depositSerialId: 1530001,
  detailedAccountTypeCode: 26,
  linkageTypeCode: 1,
  shortProductName: `deposit ${parent}`,
  principalAmount: 5000,
  revaluedTotalAmount: 5100,
  adjustedInterest: 0.5,
  formattedAgreementOpeningDate: '2026-06-01T00:00:00.000Z',
  formattedPaymentDate: '2026-08-30T00:00:00.000Z',
  interestCreditingMethodDescription: '\u05dc\u05e2\u05d5"\u05e9',
  interestPaymentDescription: '\u05e1\u05d5\u05e3 \u05e4\u05d9\u05e7\u05d3\u05d5\u05df'
})
const expected = (parentCount = 2): { accounts: unknown[], transactions: unknown[] } => ({
  accounts: parents.slice(0, parentCount).flatMap(({ accountNumber }) => {
    const parent = `12-702-${accountNumber}`
    return [{
      id: parent,
      type: 'checking',
      title: `*${accountNumber} \u05d7\u05e9\u05d1\u05d5\u05df \u05e0\u05d5\u05db\u05d7\u05d9`,
      instrument: 'ILS',
      syncID: [parent],
      balance: 100,
      creditLimit: 0
    }, {
      id: scope(parent),
      type: 'deposit',
      title: `deposit ${parent}`,
      instrument: 'ILS',
      syncID: ['1530001', scope(parent), ...parentCount === 1 ? ['0001'] : []],
      balance: 5100,
      startBalance: 5000,
      startDate: new Date('2026-06-01T00:00:00+02:00'),
      percent: 0.5,
      capitalization: false,
      endDateOffsetInterval: 'day',
      endDateOffset: 90,
      payoffInterval: null,
      payoffStep: 0
    }]
  }),
  transactions: parents.slice(0, parentCount).flatMap(({ accountNumber }) => Array.from({ length: 61 }, (_, index) => ({
    hold: index === 0 ? null : false,
    date: new Date('2026-09-10T00:00:00+02:00'),
    movements: [{ id: null, account: { id: `12-702-${accountNumber}` }, invoice: null, sum: (accountNumber === 1001 ? 1 : -1) * (index + 1), fee: 0 }],
    merchant: { country: null, city: null, title: `model 12-702-${accountNumber} ${index}`, mcc: null, location: null },
    comment: null
  })))
})

interface ModelResponse { status: number, url: string, headers: Headers, text: () => Promise<string | undefined> }
type Scrape = (args: typeof options & { isInBackground?: boolean }) => Promise<ReturnType<typeof expected>>
interface Runtime {
  scrape: Scrape
  data: Record<string, unknown>
  host: { features: { transactionDtoV2: boolean, dateProcessing: boolean }, readLine: jest.Mock, saveData: jest.Mock, addAccount: jest.Mock, addTransaction: jest.Mock, setResult: jest.Mock }
  native: { restoreCookies: jest.Mock, saveCookies: jest.Mock, openWebView: jest.Mock }
  nativeFetch: jest.Mock<Promise<ModelResponse>, [string, RequestInit]>
  reply: (url: string, body: unknown, headers?: Record<string, string>, status?: number) => ModelResponse
  main: (args: { isInBackground: boolean }) => Promise<void>
}

interface ContractHost {
  addAccount: (accounts: unknown[]) => void
  addTransaction: (transactions: unknown[]) => void
  setResult: (result: { success: boolean }) => void
  setResultCalled: Promise<{ addedAccounts: unknown[], addedTransactions: unknown[], pluginDataChange: null }>
}

function implementationOf (fetch: Runtime['nativeFetch']): (url: string, init: RequestInit) => Promise<ModelResponse> {
  const implementation = fetch.getMockImplementation()
  if (implementation === undefined) throw new Error('Missing model implementation')
  return implementation
}

function setup (initialAuth?: MobileAuth, initialIdentity?: string): Runtime {
  jest.resetModules()
  const data: Record<string, unknown> = initialAuth === undefined ? {} : { auth: initialAuth }
  if (initialIdentity !== undefined) data.directIdentity = initialIdentity
  const saveData = jest.fn(async () => {})
  const readLine = jest.fn(async () => answers.shift() ?? null)
  const answers = ['CANARY_USER', 'CANARY_PASSWORD', '123456']
  const nativeCookies = [{ name: 'UNRELATED', value: 'GLOBAL_COOKIE_CANARY', domain: 'example.invalid', path: '/' }]
  const reply = (url: string, body: unknown, headers: Record<string, string> = {}, status = 200): ModelResponse => ({
    status,
    url,
    headers: new OriginalHeaders({ 'content-type': 'application/json', ...headers }),
    text: async () => status === 204 ? '' : JSON.stringify(body)
  })
  const nativeFetch = jest.fn(async (url: string, init: RequestInit) => {
    const parsed = new OriginalURL(url)
    const path = parsed.pathname
    const headers = new OriginalHeaders(init.headers)
    expect(headers.get('cookie') ?? '').not.toContain('GLOBAL_COOKIE_CANARY')
    expect(headers.get('accept-encoding')).toBe('identity')
    expect(init.redirect).toBe('manual')
    expect(init).toHaveProperty('timeout', 15000)
    if (path === '/authenticate/verify') return reply(url, challenge, { 'set-cookie': 'SMSESSION=MODEL_SESSION; Domain=bankhapoalim.co.il; Path=/; Secure; HttpOnly' })
    if (path === '/authenticate/logonotp/init') return reply(url, challenge, { 'set-cookie': 'csrfcookie=MODEL_CSRF; Domain=bankhapoalim.co.il; Path=/; Secure' })
    if (path === '/authenticate/logonotp/verify') return reply(url, land)
    expect(headers.get('cookie')).toContain('SMSESSION=MODEL_SESSION')
    if (path === '/ServerServices/general/accounts') return reply(url, parents)
    const parent = parsed.searchParams.get('accountId') ?? ''
    if (path.endsWith('/balanceAndCreditLimit')) return reply(url, { currentBalance: 100, currentAccountCreditFrame: 0 })
    if (path.endsWith('/deposits')) return reply(url, { list: [{ data: [deposit(parent)] }] })
    if (/\/(savingsDeposits|loans|mortgages)$/.test(path) || path.includes('/foreign-currency/')) return reply(url, undefined, {}, 204)
    expect(parsed.origin).toBe('https://iphone.bankhapoalim.co.il')
    expect(parsed.searchParams.get('numItemsPerPage')).toBe('50')
    expect(init.method).toBe('POST')
    const continuation = path.endsWith('/MODEL_CURSOR')
    if (continuation) expect(headers.get('integrity-header')).toBe('MODEL_INTEGRITY')
    else expect(headers.get('integrity-header')).toBeNull()
    return reply(url, { transactions: continuation ? [row(parent, 60)] : Array.from({ length: 60 }, (_, index) => row(parent, index)) },
      continuation ? {} : { 'data-header': 'MODEL_CURSOR', 'integrity-header': 'MODEL_INTEGRITY' })
  })
  const host = {
    device: { model: 'MODEL', manufacturer: 'MODEL', brand: 'MODEL', os: { name: 'android', version: '14' } },
    Headers: OriginalHeaders,
    fetch: nativeFetch,
    readLine,
    saveData,
    getData: (key: string) => data[key],
    setData: (key: string, value: unknown) => { data[key] = value },
    restoreCookies: jest.fn(async () => { Object.assign(host, { __cookies: nativeCookies }) }),
    saveCookies: jest.fn(async () => {}),
    openWebView: jest.fn(),
    isAccountSkipped: () => false,
    getPreferences: () => ({ startDate: '2026-09-01', authenticationMethod: 'direct' }),
    manifest: { isSubscriptionRequired: false },
    features: { transactionDtoV2: true, dateProcessing: true },
    addAccount: jest.fn(),
    addTransaction: jest.fn(),
    setResult: jest.fn()
  }
  const native = { restoreCookies: host.restoreCookies, saveCookies: host.saveCookies, openWebView: host.openWebView }
  Object.assign(global, { ZenMoney: host })
  jest.requireActual('../../../polyfills/fetch')
  const { scrape } = jest.requireActual<{ scrape: (args: typeof options & { isInBackground?: boolean }) => Promise<ReturnType<typeof expected>> }>('../index')
  const { adaptScrapeToMain } = jest.requireActual<{ adaptScrapeToMain: (fn: typeof scrape) => (args: { isInBackground: boolean }) => Promise<void> }>('../../../common/adapters')
  return { scrape, data, host, native, nativeFetch, reply, main: adaptScrapeToMain(scrape) }
}

beforeEach(() => { for (const method of ['debug', 'info', 'log', 'warn', 'error'] as const) jest.spyOn(console, method).mockImplementation(() => {}) })
afterEach(() => {
  mockDate.reset()
  global.ZenMoney = originalHost
  global.fetch = originalFetch
  global.Headers = OriginalHeaders
  global.URL = OriginalURL
  jest.restoreAllMocks()
})

describe('[model] production direct session and complete statement', () => {
  it('publishes both parents, maturity deposits and all history through the real SDK validator in foreground and background', async () => {
    const { host, main, nativeFetch } = setup()
    mockDate.set('2026-09-20T12:00:00Z')
    const { ZPAPI } = jest.requireActual<{ ZPAPI: new (options: { manifest: Record<string, unknown>, preferences: Record<string, unknown>, data: Record<string, unknown> }) => ContractHost }>('../../../ZPAPI')
    const { patchAccounts, patchTransactions } = jest.requireActual<{
      patchAccounts: (accounts: unknown[]) => Array<{ startDate?: Date | number }>
      patchTransactions: (transactions: unknown[], accounts: unknown[]) => unknown[]
    }>('../../../common/adapters')
    // The browser SDK validates legacy transaction DTOs; Android V2 output has
    // separate full-result assertions. No native database matching is simulated.
    host.features.transactionDtoV2 = false
    const statement = expected()
    const nativeAccounts = patchAccounts(statement.accounts).map(account => account.startDate instanceof Date
      ? { ...account, startDate: account.startDate.getTime() / 1000 }
      : account)
    const nativeTransactions = patchTransactions(statement.transactions, statement.accounts)

    for (const isInBackground of [false, true]) {
      const native = new ZPAPI({ manifest: {}, preferences: {}, data: {} })
      host.addAccount.mockImplementation(accounts => native.addAccount(accounts))
      host.addTransaction.mockImplementation(transactions => native.addTransaction(transactions))

      await main({ isInBackground })

      expect(host.setResult).toHaveBeenLastCalledWith({ success: true })
      native.setResult({ success: true })
      await expect(native.setResultCalled).resolves.toEqual({
        addedAccounts: nativeAccounts,
        addedTransactions: nativeTransactions,
        pluginDataChange: null
      })
    }
    expect(host.setResult.mock.calls).toEqual([[{ success: true }], [{ success: true }]])
    expect(nativeAccounts).toHaveLength(4)
    expect(nativeTransactions).toHaveLength(122)
    expect(host.readLine).toHaveBeenCalledTimes(3)
    expect(nativeFetch.mock.calls.filter(([url]) => new OriginalURL(url).pathname === '/authenticate/verify')).toHaveLength(1)
  })

  it.each([0, 1].flatMap(position => accountRejections.map(rejection => ({ position, ...rejection }))))(
    'reports SDK $code for deposit $position: $name, without operations or false success', async ({ position, change, code }) => {
      const { host, main, data } = setup()
      const { ZPAPI } = jest.requireActual<{ ZPAPI: new (options: { manifest: Record<string, unknown>, preferences: Record<string, unknown>, data: Record<string, unknown> }) => ContractHost }>('../../../ZPAPI')
      const native = new ZPAPI({ manifest: {}, preferences: {}, data: {} })
      host.addAccount.mockImplementation((accounts: Array<{ type: string }>) => {
        let depositIndex = 0
        native.addAccount(accounts.map(account => account.type === 'deposit' && depositIndex++ === position
          ? { ...account, ...change }
          : account))
      })

      await main({ isInBackground: false })

      expect(host.setResult).toHaveBeenCalledTimes(1)
      expect(host.setResult).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(new RegExp('^\\[' + code + '\\]')) }))
      expect(host.setResult).not.toHaveBeenCalledWith(expect.objectContaining({ success: true }))
      expect(host.addTransaction).not.toHaveBeenCalled()
      expect(host.readLine).toHaveBeenCalledTimes(3)
      expect(data.auth).toMatchObject({ transport: 'mobile' })
    })

  it('uses Russian secure input while retaining Hebrew bank requests and unchanged financial output', async () => {
    const { scrape, host, nativeFetch } = setup()
    expect(await scrape(options)).toEqual(expected())
    expect(global.ZenMoney.locale).toBe('ru')
    expect(host.readLine.mock.calls).toEqual([
      ['Логин Bank Hapoalim', { inputType: 'text', time: 180000 }],
      ['Пароль Bank Hapoalim', { inputType: 'textPassword', time: 180000 }],
      ['Код из SMS', { inputType: 'numberPassword', time: 180000 }]
    ])
    const inventories = nativeFetch.mock.calls.filter(([url]) => new OriginalURL(url).pathname === '/ServerServices/general/accounts')
    expect(inventories.length).toBeGreaterThan(0)
    expect(inventories.every(([url]) => new OriginalURL(url).searchParams.get('lang') === 'he')).toBe(true)
  })

  it('uses one selected direct login for both parents, deposits and every mobile page', async () => {
    const { scrape, host, native, data, nativeFetch } = setup()
    expect(await scrape(options)).toEqual(expected())
    expect(host.readLine).toHaveBeenCalledTimes(3)
    expect(native.openWebView).not.toHaveBeenCalled()
    expect(native.saveCookies).not.toHaveBeenCalled()
    expect(data.auth).toMatchObject({ transport: 'mobile' })
    expect(nativeFetch.mock.calls.filter(([url]) => new OriginalURL(url).pathname.includes('/current-account/transactions'))).toHaveLength(4)
    for (const secret of ['CANARY_USER', 'CANARY_PASSWORD', '123456']) {
      expect(JSON.stringify(data)).not.toContain(secret)
      expect(JSON.stringify(['debug', 'log', 'warn', 'error'].map(method => jest.mocked(console[method as 'log']).mock.calls))).not.toContain(secret)
    }
  })

  it('restores a new runtime without input, SMS, WebView or global cookie restoration', async () => {
    const first = setup()
    await first.scrape(options)
    const next = setup(first.data.auth as MobileAuth)
    expect(await next.scrape({ ...options, isInBackground: true })).toEqual(expected())
    expect(next.host.readLine).not.toHaveBeenCalled()
    expect(next.native.restoreCookies).not.toHaveBeenCalled()
    expect(next.native.openWebView).not.toHaveBeenCalled()
    expect(next.nativeFetch.mock.calls.every(([url]) => !url.includes('/authenticate/'))).toBe(true)
  })

  it.each([false, true])('retains confirmed auth and rejects the entire statement on parent2 failure (adapter: %s)', async adapter => {
    const { scrape, nativeFetch, host, data, main } = setup()
    const implementation = implementationOf(nativeFetch)
    const failure = new Error('MODEL_PARENT2_TRANSPORT')
    nativeFetch.mockImplementation(async (url, init) => {
      if (url.includes('accountId=12-702-1002') && url.includes('/current-account/transactions')) throw failure
      return await implementation(url, init)
    })
    if (adapter) {
      await main({ isInBackground: false })
      expect(host.addAccount).not.toHaveBeenCalled()
      expect(host.addTransaction).not.toHaveBeenCalled()
      expect(host.setResult).toHaveBeenCalledTimes(1)
      expect(host.setResult).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('MODEL_PARENT2_TRANSPORT') }))
      expect(host.setResult).not.toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    } else await expect(scrape(options)).rejects.toBe(failure)
    expect(data.auth).toMatchObject({ transport: 'mobile' })
    expect(host.readLine).toHaveBeenCalledTimes(3)
  })

  it('does not start authentication in background when no session exists', async () => {
    const { scrape, host, nativeFetch } = setup()
    const { UserInteractionError } = jest.requireActual('../../../errors')
    await expect(scrape({ ...options, isInBackground: true })).rejects.toBeInstanceOf(UserInteractionError)
    expect(host.readLine).not.toHaveBeenCalled()
    expect(nativeFetch).not.toHaveBeenCalled()
  })

  it.each([false, true])('recovers a known expired accounts session at most once (background: %s)', async background => {
    const first = setup()
    await first.scrape(options)
    const { scrape, host, nativeFetch, reply, data } = setup(first.data.auth as MobileAuth)
    const implementation = implementationOf(nativeFetch)
    nativeFetch.mockImplementationOnce(async url => reply(url, stepUp, {}, 401))
    if (background) {
      const { UserInteractionError } = jest.requireActual('../../../errors')
      await expect(scrape({ ...options, isInBackground: true })).rejects.toBeInstanceOf(UserInteractionError)
      expect(host.readLine).not.toHaveBeenCalled()
      expect(nativeFetch).toHaveBeenCalledTimes(1)
      expect(data.auth).toBeNull()
    } else {
      nativeFetch.mockImplementation(implementation)
      expect(await scrape(options)).toEqual(expected())
      expect(host.readLine).toHaveBeenCalledTimes(3)
      expect(nativeFetch.mock.calls.filter(([url]) => url.includes('/authenticate/verify'))).toHaveLength(1)
    }
  })

  it.each([false, true])('retains the connection fingerprint across expired auth and rejects another customer (new runtime: %s)', async newRuntime => {
    const first = setup()
    await first.scrape(options)
    const originalAuth = first.data.auth as MobileAuth
    let next = setup(originalAuth)
    next.nativeFetch.mockImplementationOnce(async url => next.reply(url, stepUp, {}, 401))
    if (newRuntime) {
      const { UserInteractionError } = jest.requireActual('../../../errors')
      await expect(next.scrape({ ...options, isInBackground: true })).rejects.toBeInstanceOf(UserInteractionError)
      expect(next.data.auth).toBeNull()
      expect(next.data.directIdentity).toBe(originalAuth.identity)
      next = setup(undefined, next.data.directIdentity as string)
    }
    const { nativeFetch, reply, data, host, scrape } = next
    const implementation = implementationOf(nativeFetch)
    nativeFetch.mockImplementation(async (url, init) => new OriginalURL(url).pathname.endsWith('/general/accounts')
      ? reply(url, parents.map(parent => ({ ...parent, accountNumber: parent.accountNumber + 9000 })))
      : await implementation(url, init))
    await expect(scrape(options)).rejects.toThrow('account set differs')
    expect(data.auth).toBeNull()
    expect(data.directIdentity).toBe(originalAuth.identity)
    expect(host.readLine).toHaveBeenCalledTimes(3)
    expect(nativeFetch.mock.calls.some(([url]) => /\/(balanceAndCreditLimit|deposits|transactions)(\/|\?|$)/.test(url))).toBe(false)
    expect(host.addAccount).not.toHaveBeenCalled()
    expect(host.addTransaction).not.toHaveBeenCalled()
  })

  it('accepts the same account set after a new runtime with only the persisted binding', async () => {
    const first = setup()
    await first.scrape(options)
    const identity = (first.data.auth as MobileAuth).identity
    const next = setup(undefined, identity)
    expect(await next.scrape(options)).toEqual(expected())
    expect(next.data.directIdentity).toBe(identity)
    expect(next.data.auth).toMatchObject({ identity })
  })

  it.each(['', 'invalid', 1234])('rejects malformed persisted binding before input or requests (%s)', async identity => {
    const next = setup()
    next.data.directIdentity = identity
    await expect(next.scrape(options)).rejects.toThrow('stored account identity is invalid')
    expect(next.host.readLine).not.toHaveBeenCalled()
    expect(next.nativeFetch).not.toHaveBeenCalled()
    expect(next.data.directIdentity).toBe(identity)
  })

  it('retains the persisted binding when the next login input is canceled', async () => {
    const first = setup()
    await first.scrape(options)
    const identity = (first.data.auth as MobileAuth).identity
    const next = setup(undefined, identity)
    next.host.readLine.mockResolvedValueOnce(null)
    await expect(next.scrape(options)).rejects.toThrow('required input was not provided')
    expect(next.data.auth).toBeNull()
    expect(next.data.directIdentity).toBe(identity)
    expect(next.nativeFetch).not.toHaveBeenCalled()
  })

  it('pins the parent inventory before any product endpoint can require another login', async () => {
    const first = setup()
    await first.scrape(options)
    const { scrape, nativeFetch, reply, host } = setup(first.data.auth as MobileAuth)
    const implementation = implementationOf(nativeFetch)
    let loggedIn = false
    nativeFetch.mockImplementation(async (url, init) => {
      const path = new OriginalURL(url).pathname
      if (path === '/authenticate/verify') loggedIn = true
      if (path.endsWith('/balanceAndCreditLimit')) return reply(url, { error: { errCode: 'STEPUPOTP' } }, {}, 401)
      if (path.endsWith('/general/accounts') && loggedIn) return reply(url, parents.slice(0, 1))
      return await implementation(url, init)
    })
    await expect(scrape(options)).rejects.toThrow('account set differs')
    expect(host.readLine).toHaveBeenCalledTimes(3)
    expect(nativeFetch.mock.calls.some(([url]) => url.includes('/deposits'))).toBe(false)
    expect(nativeFetch.mock.calls.some(([url]) => url.includes('/current-account/transactions'))).toBe(false)
  })

  it('allows a legitimate portfolio change between separate syncs', async () => {
    const first = setup()
    await first.scrape(options)
    const { scrape, nativeFetch, reply, host, data } = setup(first.data.auth as MobileAuth)
    const implementation = implementationOf(nativeFetch)
    nativeFetch.mockImplementation(async (url, init) => new OriginalURL(url).pathname.endsWith('/general/accounts')
      ? reply(url, parents.slice(0, 1))
      : await implementation(url, init))
    expect(await scrape({ ...options, isInBackground: true })).toEqual(expected(1))
    expect(host.readLine).not.toHaveBeenCalled()
    expect(data.directIdentity).toBe((data.auth as MobileAuth).identity)
    expect(data.directIdentity).not.toBe((first.data.auth as MobileAuth).identity)
  })

  it.each(['added', 'removed'])('keeps a cold connection bound when its parent portfolio changes (%s)', async change => {
    const first = setup()
    await first.scrape(options)
    const identity = (first.data.auth as MobileAuth).identity
    const next = setup(undefined, identity)
    const implementation = implementationOf(next.nativeFetch)
    // [model] Account-set binding is conservative without a stable customer ID.
    // A cold portfolio change needs explicit rebind, never silent reassignment.
    const changedParents = change === 'added'
      ? [...parents, { ...parents[0], accountNumber: 1003 }]
      : parents.slice(0, 1)
    next.nativeFetch.mockImplementation(async (url, init) => new OriginalURL(url).pathname.endsWith('/general/accounts')
      ? next.reply(url, changedParents)
      : await implementation(url, init))

    await expect(next.scrape(options)).rejects.toThrow('account set differs')

    expect(next.data.auth).toBeNull()
    expect(next.data.directIdentity).toBe(identity)
    expect(next.nativeFetch.mock.calls.some(([url]) => /\/(balanceAndCreditLimit|deposits|transactions)(\/|\?|$)/.test(url))).toBe(false)
    expect(next.host.addAccount).not.toHaveBeenCalled()
    expect(next.host.addTransaction).not.toHaveBeenCalled()
  })

  it.each([true, false])('never follows a native redirect and only recovers an official login destination (known: %s)', async known => {
    const first = setup()
    await first.scrape(options)
    const { scrape, nativeFetch, reply, host, data } = setup(first.data.auth as MobileAuth)
    nativeFetch.mockImplementationOnce(async url => reply(url, undefined, {
      location: known ? 'https://login.bankhapoalim.co.il/ng-portals/auth/he/' : 'https://example.invalid/'
    }, 302))
    if (known) {
      const { UserInteractionError } = jest.requireActual('../../../errors')
      await expect(scrape({ ...options, isInBackground: true })).rejects.toBeInstanceOf(UserInteractionError)
      expect(data.auth).toBeNull()
    } else {
      await expect(scrape({ ...options, isInBackground: true })).rejects.toMatchObject({ responseSummary: { status: 302, isLoginPage: false } })
      expect(data.auth).toMatchObject({ transport: 'mobile' })
    }
    expect(nativeFetch).toHaveBeenCalledTimes(1)
    expect(host.readLine).not.toHaveBeenCalled()
  })

  it('does not repeat interactive login after a later endpoint rejects the new session', async () => {
    const { scrape, host, nativeFetch, reply } = setup()
    const implementation = implementationOf(nativeFetch)
    nativeFetch.mockImplementation(async (url, init) => {
      if (url.includes('/current-account/transactions')) return reply(url, { error: { errCode: 'STEPUPOTP' } }, {}, 401)
      return await implementation(url, init)
    })
    await expect(scrape(options)).rejects.toMatchObject({ responseSummary: { status: 401, errCode: 'STEPUPOTP' } })
    expect(host.readLine).toHaveBeenCalledTimes(3)
    expect(nativeFetch.mock.calls.filter(([url]) => url.includes('/authenticate/verify'))).toHaveLength(1)
  })

  it('restarts history from page1 after login and never reuses the old continuation', async () => {
    const first = setup()
    await first.scrape(options)
    const { scrape, nativeFetch, reply, host } = setup(first.data.auth as MobileAuth)
    const implementation = implementationOf(nativeFetch)
    let rejected = false
    nativeFetch.mockImplementation(async (url, init) => {
      if (url.includes('/transactions/MODEL_CURSOR') && !rejected) {
        rejected = true
        return reply(url, { error: { errCode: 'STEPUPOTP' } }, {}, 401)
      }
      return await implementation(url, init)
    })
    expect(await scrape(options)).toEqual(expected())
    const history = nativeFetch.mock.calls.filter(([url]) => url.includes('/current-account/transactions'))
    expect(history.map(([url]) => new OriginalURL(url).pathname)).toEqual([
      '/ServerServices/current-account/transactions', '/ServerServices/current-account/transactions/MODEL_CURSOR',
      '/ServerServices/current-account/transactions', '/ServerServices/current-account/transactions/MODEL_CURSOR',
      '/ServerServices/current-account/transactions', '/ServerServices/current-account/transactions/MODEL_CURSOR'
    ])
    expect(host.readLine).toHaveBeenCalledTimes(3)
  })

  it.each([false, true])('stops an expired background history session without interactive recovery (continuation: %s)', async continuation => {
    const first = setup()
    await first.scrape(options)
    const { main, nativeFetch, reply, host, data } = setup(first.data.auth as MobileAuth)
    const implementation = implementationOf(nativeFetch)
    nativeFetch.mockImplementation(async (url, init) => {
      const path = new OriginalURL(url).pathname
      if (path === '/ServerServices/current-account/transactions' + (continuation ? '/MODEL_CURSOR' : '')) {
        return reply(url, { error: { errCode: 'STEPUPOTP' } }, {}, 401)
      }
      return await implementation(url, init)
    })
    const { UserInteractionError } = jest.requireActual('../../../errors')

    await main({ isInBackground: true })

    expect(host.setResult).toHaveBeenCalledTimes(1)
    expect(host.setResult.mock.calls[0][0]).toBeInstanceOf(UserInteractionError)
    expect(host.setResult).not.toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    expect(host.addAccount).not.toHaveBeenCalled()
    expect(host.addTransaction).not.toHaveBeenCalled()
    expect(host.readLine).not.toHaveBeenCalled()
    expect(nativeFetch.mock.calls.every(([url]) => !url.includes('/authenticate/'))).toBe(true)
    expect(data.auth).toBeNull()
    expect(data.directIdentity).toBe((first.data.auth as MobileAuth).identity)
  })
})
