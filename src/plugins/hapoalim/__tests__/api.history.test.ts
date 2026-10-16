import fetchMock from 'fetch-mock'

interface Auth { cookieHeader: string, restContext: string, acquiredAt: number }
interface Product { type: string, id: string, currencyCode?: number, detailedAccountTypeCode?: number }
interface Api {
  fetchAccounts: (auth: Auth) => Promise<unknown[]>
  fetchTransactions: (auth: Auth, product: Product, from: Date, to: Date) => Promise<unknown[]>
}
interface ModelResponse { status: number, headers: Record<string, string>, body: unknown }
let fetchAccounts: Api['fetchAccounts']
let fetchTransactions: Api['fetchTransactions']
let respondJson: jest.Mock<Promise<ModelResponse>, [string, object]>
let respondText: jest.Mock<Promise<ModelResponse>, [string, object]>
const originalFetch = global.fetch

const auth = (): Auth => ({ cookieHeader: 'SMSESSION=model', restContext: 'pib', acquiredAt: 1 })
const product = { type: 'account', id: '12-702-1001' }
const from = new Date('2026-10-01T00:00:00+02:00')
const to = new Date('2026-10-02T00:00:00+02:00')
const row = (id: string | number | undefined, amount = 1): object => ({ serialNumber: id, eventAmount: amount, activityDescription: 'model' })
const response = (body: unknown): ModelResponse => ({ status: 200, headers: {}, body })

// [model] Synthetic HTTP envelopes exercise the real SDK parsing/log boundary,
// completeness, lossless splitting and
// exact source selection. They do not establish new bank schemas or paging APIs.
// Supported history: checking and observed FX event records; other discovered
// products are balance-only. Dates retain the legacy bank-wall-date +02:00 frame.
// A saturated single day or unknown envelope rejects the entire synchronization.
// With toDate:null the entrypoint bounds transport at now in +02:00, without an
// output cutoff. Future endpoint acceptance and Israel DST remain bank evidence
// gates; these models do not certify all available future/value-dated records.
describe('[model] Hapoalim history completeness', () => {
  beforeEach(() => {
    jest.resetModules()
    respondJson = jest.fn()
    respondText = jest.fn()
    jest.dontMock('../../../common/network')
    fetchMock.mock('*', async (url, options) => {
      const path = new URL(url).pathname
      const isText = path.startsWith('/portalserver/') || path.startsWith('/ng-')
      const { status, headers, body } = await (isText ? respondText : respondJson)(url, options ?? {})
      return { status, headers, ...status === 204 ? {} : { body: isText ? String(body) : body === undefined ? '' : JSON.stringify(body) } }
    })
    const api = jest.requireActual<Api>('../api')
    fetchAccounts = api.fetchAccounts
    fetchTransactions = api.fetchTransactions
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
  })
  afterEach(() => {
    fetchMock.restore()
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('splits a saturated two-day interval into both inclusive days without dropping identical rows', async () => {
    const equal = row(undefined)
    const left = Array.from({ length: 450 }, () => ({ ...equal }))
    const right = Array.from({ length: 550 }, () => ({ ...equal }))
    respondJson.mockImplementation(async url => {
      const query = new URL(url).searchParams
      const start = query.get('retrievalStartDate')
      const end = query.get('retrievalEndDate')
      return response({ transactions: start !== end ? Array(1000).fill(equal) : start === '20261001' ? left : right })
    })
    expect(await fetchTransactions(auth(), product, from, to)).toEqual([...left, ...right])
    expect(respondJson.mock.calls.map(([url]) => {
      const query = new URL(url).searchParams
      return [query.get('retrievalStartDate'), query.get('retrievalEndDate'), query.get('accountId')]
    })).toEqual([
      ['20261001', '20261002', product.id],
      ['20261001', '20261001', product.id],
      ['20261002', '20261002', product.id]
    ])
  })

  it.each([1000, 1001])('rejects an unprovably complete single-day batch of %s rows', async count => {
    respondJson.mockResolvedValue(response({ transactions: Array.from({ length: count }, (_, i) => row(i)) }))
    await expect(fetchTransactions(auth(), product, from, from)).rejects.toThrow(/complete|limit/i)
    expect(respondJson).toHaveBeenCalledTimes(1)
  })

  it('preserves the exact later-window failure instead of returning earlier rows', async () => {
    const failure = new Error('model second history window failed')
    respondJson.mockResolvedValueOnce(response({ transactions: Array(1000).fill(row(0)) }))
      .mockResolvedValueOnce(response({ transactions: [row(1)] }))
      .mockRejectedValueOnce(failure)
    await expect(fetchTransactions(auth(), product, from, to)).rejects.toBe(failure)
  })

  it('splits a longer interval to cover every day exactly once', async () => {
    const leafDays: string[] = []
    respondJson.mockImplementation(async url => {
      const query = new URL(url).searchParams
      const start = query.get('retrievalStartDate')
      const end = query.get('retrievalEndDate')
      if (start !== end) return response({ transactions: Array(1000).fill(row(0)) })
      if (start === null) throw new Error('model missing date query')
      leafDays.push(start)
      return response({ transactions: [row(start)] })
    })
    expect(await fetchTransactions(auth(), product, from, new Date('2026-10-05T00:00:00+02:00'))).toEqual(
      [1, 2, 3, 4, 5].map(day => row(`2026100${day}`))
    )
    expect(leafDays).toEqual(['20261001', '20261002', '20261003', '20261004', '20261005'])
  })

  it.each([null, {}, { transactions: null }, { transactions: {} }])('does not turn malformed checking history into empty success: %j', async body => {
    respondJson.mockResolvedValue(response(body))
    await expect(fetchTransactions(auth(), product, from, to)).rejects.toThrow()
  })

  it('accepts an explicitly empty history', async () => {
    respondJson.mockResolvedValue(response({ transactions: [] }))
    expect(await fetchTransactions(auth(), product, from, to)).toEqual([])
  })

  it('rejects an empty account inventory before loading products', async () => {
    respondJson.mockResolvedValue(response([]))
    await expect(fetchAccounts(auth())).rejects.toThrow(/accounts/i)
    expect(respondJson).toHaveBeenCalledTimes(1)
  })

  it.each([null, [], 'unexpected body'])('rejects a malformed checking balance envelope before loading further products: %j', async body => {
    respondJson.mockResolvedValueOnce(response([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }]))
      .mockResolvedValueOnce(response(body))
    await expect(fetchAccounts(auth())).rejects.toThrow('unexpected balance response')
    expect(respondJson).toHaveBeenCalledTimes(2)
  })

  it.each([null, [], 'invalid', 1])('rejects an invalid primary account record before product requests: %j', async account => {
    return await (async () => {
      respondJson.mockResolvedValueOnce(response([account]))
      await expect(fetchAccounts(auth())).rejects.toThrow('unexpected account record')
      expect(respondJson).toHaveBeenCalledTimes(1)
    })()
  })

  it.each(['deposits', 'loans', 'mortgages'].flatMap(endpoint => [null, [], 'invalid', 1].map(account => ({ endpoint, account }))))('rejects an invalid $endpoint record without guessing a product: $account', async ({ endpoint, account }) => {
    respondJson.mockImplementation(async url => {
      const path = new URL(url).pathname
      if (path.endsWith('/general/accounts')) return response([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }])
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10 })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.endsWith('/' + endpoint)) return response(endpoint === 'deposits' ? { list: [{ data: [account] }] } : { data: [account] })
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      return response({ data: [] })
    })
    const kind = endpoint === 'deposits' ? 'deposit' : endpoint === 'loans' ? 'loan' : 'mortgage'
    await expect(fetchAccounts(auth())).rejects.toThrow(`unexpected ${kind} account`)
    expect(respondJson.mock.calls.some(([url]) => new URL(url).pathname.includes('/loans/'))).toBe(false)
  })

  it('loads all deposit group items for both parent accounts, retaining source identity', async () => {
    respondJson.mockImplementation(async url => {
      const parsed = new URL(url)
      const id = parsed.searchParams.get('accountId')
      if (parsed.pathname.endsWith('/general/accounts')) return response([1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber })))
      if (parsed.pathname.includes('balanceAndCreditLimit')) return response({ currentBalance: 10, currentAccountCreditFrame: 0 })
      if (parsed.pathname.includes('/foreign-currency/')) return response(null)
      if (parsed.pathname.endsWith('/deposits')) return response({ list: [{ data: [{ depositSerialId: 1 }, { depositSerialId: 2 }] }] })
      if (parsed.pathname.includes('/deposits-and-savings/')) return response({ list: [] })
      expect(id).toMatch(/^12-702-100[12]$/)
      return response({ data: [] })
    })
    const accounts = await fetchAccounts(auth())
    expect(accounts).toEqual([
      { bankNumber: 12, branchNumber: 702, accountNumber: 1001, details: { currentBalance: 10, currentAccountCreditFrame: 0 }, structType: 'checking' },
      { depositSerialId: 1, structType: 'deposit', sourceAccountId: '12-702-1001' },
      { depositSerialId: 2, structType: 'deposit', sourceAccountId: '12-702-1001' },
      { bankNumber: 12, branchNumber: 702, accountNumber: 1002, details: { currentBalance: 10, currentAccountCreditFrame: 0 }, structType: 'checking' },
      { depositSerialId: 1, structType: 'deposit', sourceAccountId: '12-702-1002' },
      { depositSerialId: 2, structType: 'deposit', sourceAccountId: '12-702-1002' }
    ])
  })

  // Live Android 26.8/build 1105, 2026-10-14: the savings GET returned actual
  // empty 204 with Accept-Encoding: identity; gzip-marked empty 204 rejected
  // in native fetch. The two-account graph below is a [model], not bank data.
  it.each([[204, 204], [204, 200], [200, 204]].map(statuses => ({ endpoint: 'savingsDeposits', statuses }))
  )('preserves both account graphs for $endpoint statuses $statuses', async ({ endpoint, statuses }) => {
    respondJson.mockImplementation(async (url, options) => {
      const parsed = new URL(url)
      const path: string = parsed.pathname
      if (path.endsWith('/general/accounts')) return response([1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber })))
      const id: string | null = parsed.searchParams.get('accountId')
      const number: number = id === '12-702-1001' ? 1001 : 1002
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: number, currentAccountCreditFrame: 0 })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) {
        expect(new Headers((options as { headers: HeadersInit }).headers).get('accept-encoding')).toBe('identity')
        if (path.endsWith('/' + endpoint) && statuses[number - 1001] === 204) return { status: 204, headers: {}, body: undefined }
        return response({ list: [{ data: [{ depositSerialId: number }] }] })
      }
      return response({ data: [] })
    })
    const expected: unknown[] = []
    for (const number of [1001, 1002]) {
      expected.push({ bankNumber: 12, branchNumber: 702, accountNumber: number, details: { currentBalance: number, currentAccountCreditFrame: 0 }, structType: 'checking' })
      for (const [name, structType] of [['deposits', 'deposit'], ['savingsDeposits', 'saving']]) {
        if (name !== endpoint || statuses[number - 1001] === 200) expected.push({ depositSerialId: number, structType, sourceAccountId: `12-702-${number}` })
      }
    }
    expect(await fetchAccounts(auth())).toEqual(expected)
    expect(respondJson.mock.calls.filter(([url]) => new URL(url).pathname.includes('/deposits-and-savings/'))).toHaveLength(4)
    expect(respondJson.mock.calls.filter(([url]) => new URL(url).pathname.endsWith('/mortgages'))).toHaveLength(2)
    expect(respondJson.mock.calls.filter(([url]) => !new URL(url).pathname.includes('/deposits-and-savings/') &&
      !new URL(url).pathname.includes('/foreign-currency/') &&
      !new URL(url).pathname.endsWith('/loans') && !new URL(url).pathname.endsWith('/mortgages')).every(([, options]) =>
      new Headers((options as { headers: HeadersInit }).headers).get('accept-encoding') === null
    )).toBe(true)
  })

  // Live Android 26.8/build1105: second-parent FX inventory GET returned actual
  // empty204 with identity; both-parent/mixed nonempty graphs below are models.
  it.each([[204, 204], [204, 200], [200, 204], [200, 200]].map(statuses => ({ statuses })))('preserves both parents and every FX bucket for inventory statuses $statuses', async ({ statuses }) => {
    const buckets = [{ currencyCode: 19, detailedAccountTypeCode: 142, currentBalance: 20 }, { currencyCode: 100, detailedAccountTypeCode: 143, currentBalance: 30 }]
    respondJson.mockImplementation(async (url, options) => {
      const parsed = new URL(url)
      const path: string = parsed.pathname
      if (path.endsWith('/general/accounts')) return response([1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber })))
      const id: string | null = parsed.searchParams.get('accountId')
      expect(id).toMatch(/^12-702-100[12]$/)
      const number: number = id === '12-702-1001' ? 1001 : 1002
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: number })
      if (path.includes('/foreign-currency/')) {
        expect(parsed.searchParams.get('type')).toBe('business')
        expect(parsed.searchParams.has('retrievalStartDate')).toBe(false)
        expect(new Headers((options as { headers: HeadersInit }).headers).get('accept-encoding')).toBe('identity')
        return statuses[number - 1001] === 204 ? { status: 204, headers: {}, body: undefined } : response({ balancesAndLimitsDataList: buckets, preservedModelField: number })
      }
      if (path.endsWith('/deposits')) return response({ list: [{ data: [{ depositSerialId: number }] }] })
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      return response({ data: [] })
    })
    const expected: unknown[] = []
    for (const number of [1001, 1002]) {
      expected.push({ bankNumber: 12, branchNumber: 702, accountNumber: number, details: { currentBalance: number, currentAccountCreditFrame: null }, structType: 'checking' })
      if (statuses[number - 1001] === 200) expected.push({ balancesAndLimitsDataList: buckets, preservedModelField: number, mainProductId: `12-702-${number}`, sourceAccountId: `12-702-${number}`, structType: 'foreignCurrencyAccount' })
      expected.push({ depositSerialId: number, structType: 'deposit', sourceAccountId: `12-702-${number}` })
    }
    expect(await fetchAccounts(auth())).toEqual(expected)
    expect(respondJson.mock.calls.filter(([url]) => new URL(url).pathname.includes('/foreign-currency/'))).toHaveLength(2)
    expect(respondJson.mock.calls.filter(([url]) => new URL(url).pathname.endsWith('/mortgages'))).toHaveLength(2)
  })

  it.each([1001, 1002].flatMap(number => ['transport', 'empty200', 'malformed200', 'http401', 'http500'].map(failure => ({ number, failure }))))('rejects FX inventory $failure on account $number without partial success', async ({ number, failure }) => {
    const transportError = new Error('model FX transport failure')
    respondJson.mockImplementation(async url => {
      const parsed = new URL(url)
      const path: string = parsed.pathname
      if (path.endsWith('/general/accounts')) return response([1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber })))
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10 })
      if (path.includes('/foreign-currency/')) {
        if (parsed.searchParams.get('accountId') !== `12-702-${number}`) return response(null)
        if (failure === 'transport') throw transportError
        if (failure === 'malformed200') return response({ unknown: 'MODEL_FX_PRIVATE_FIELD' })
        return { status: failure === 'http401' ? 401 : failure === 'http500' ? 500 : 200, headers: {}, body: undefined }
      }
      return response(path.includes('/deposits-and-savings/') ? { list: [] } : { data: [] })
    })
    if (failure === 'transport') await expect(fetchAccounts(auth())).rejects.toBe(transportError)
    else await expect(fetchAccounts(auth())).rejects.toThrow()
    expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('MODEL_FX_PRIVATE_FIELD')
  })

  // Live Android 26.8/build 1105: both collection GETs returned empty 204
  // with identity encoding. Mixed parent inventories and nonempty records are models.
  it.each(['loans', 'mortgages'].flatMap(endpoint =>
    [[204, 204], [204, 200], [200, 204]].map(statuses => ({ endpoint, statuses }))
  ))('preserves both account graphs and credit records for $endpoint statuses $statuses', async ({ endpoint, statuses }) => {
    const mortgage = { mortgageLoanSerialId: 123, subLoansCounter: 1, subLoanData: [{ subLoansSerialId: 201 }] }
    respondJson.mockImplementation(async (url, options) => {
      const parsed = new URL(url)
      const path: string = parsed.pathname
      if (path.endsWith('/general/accounts')) return response([1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber })))
      const id: string | null = parsed.searchParams.get('accountId')
      expect(id).toMatch(/^12-702-100[12]$/)
      const number: number = id === '12-702-1001' ? 1001 : 1002
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: number })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      if (path.endsWith('/loans') || path.endsWith('/mortgages')) {
        expect(new Headers((options as { headers: HeadersInit }).headers).get('accept-encoding')).toBe('identity')
        if (path.endsWith('/' + endpoint) && statuses[number - 1001] === 204) return { status: 204, headers: {}, body: undefined }
        return response({ data: path.endsWith('/loans') ? [{ creditSerialNumber: number, unitedCreditTypeCode: 2710 }] : [mortgage] })
      }
      expect(path).toBe(`/ServerServices/credit-and-mortgage/v3/loans/${number}`)
      expect(parsed.searchParams.get('unitedCreditTypeCode')).toBe('2710')
      expect(new Headers((options as { headers: HeadersInit }).headers).get('accept-encoding')).toBeNull()
      return response({ nextPaymentAmount: number })
    })
    const expected: unknown[] = []
    for (const number of [1001, 1002]) {
      expected.push({ bankNumber: 12, branchNumber: 702, accountNumber: number, details: { currentBalance: number, currentAccountCreditFrame: null }, structType: 'checking' })
      if (endpoint !== 'loans' || statuses[number - 1001] === 200) expected.push({ creditSerialNumber: number, unitedCreditTypeCode: 2710, details: { nextPaymentAmount: number }, structType: 'loan', sourceAccountId: `12-702-${number}` })
      if (endpoint !== 'mortgages' || statuses[number - 1001] === 200) expected.push({ ...mortgage, structType: 'mortgage', sourceAccountId: `12-702-${number}` })
    }
    expect(await fetchAccounts(auth())).toEqual(expected)
    expect(respondJson.mock.calls.filter(([url]) => new URL(url).pathname.endsWith('/loans'))).toHaveLength(2)
    expect(respondJson.mock.calls.filter(([url]) => new URL(url).pathname.endsWith('/mortgages'))).toHaveLength(2)
    expect(respondJson.mock.calls.filter(([url]) => new URL(url).pathname.includes('/loans/'))).toHaveLength(endpoint === 'loans' ? statuses.filter(status => status === 200).length : 2)
  })

  it.each(['deposits', 'savingsDeposits', 'loans', 'mortgages'].flatMap(endpoint =>
    [1001, 1002].flatMap(number => ['transport', 'empty200', 'http500'].map(failure => ({ endpoint, number, failure })))
  ))('rejects $failure on $endpoint for account $number rather than returning partial accounts', async ({ endpoint, number, failure }) => {
    const transportError = new Error('model native transport failure')
    respondJson.mockImplementation(async url => {
      const parsed = new URL(url)
      const path: string = parsed.pathname
      if (path.endsWith('/general/accounts')) return response([1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber })))
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10 })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.endsWith('/' + endpoint) && parsed.searchParams.get('accountId') === `12-702-${number}`) {
        if (failure === 'transport') throw transportError
        return { status: failure === 'http500' ? 500 : 200, headers: {}, body: undefined }
      }
      return response(path.includes('/deposits-and-savings/') ? { list: [] } : { data: [] })
    })
    if (failure === 'transport') await expect(fetchAccounts(auth())).rejects.toBe(transportError)
    else await expect(fetchAccounts(auth())).rejects.toThrow()
  })

  it.each(['foreign-currency', 'deposits', 'loans', 'mortgages'])('does not turn an unknown %s envelope into no products', async endpoint => {
    respondJson.mockImplementation(async url => {
      const path = new URL(url).pathname
      if (path.endsWith('/general/accounts')) return response([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }])
      if (path.includes(endpoint)) return response({ unknown: 'MODEL_PRIVATE_FIELD' })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      return response({ data: [] })
    })
    const error: unknown = await fetchAccounts(auth()).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(JSON.stringify(error)).not.toContain('MODEL_PRIVATE_FIELD')
    expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('MODEL_PRIVATE_FIELD')
  })

  it('reads the matching currency/type bucket rather than a property on the array', async () => {
    // The other selector is virtual model data, not a discovered bank product.
    const fx = { type: 'foreignCurrencyAccount', id: product.id, currencyCode: 19, detailedAccountTypeCode: 142 }
    respondJson.mockResolvedValue(response({
      balancesAndLimitsDataList: [
        { currencyCode: 100, detailedAccountTypeCode: 143, transactions: [row('other')] },
        { currencyCode: 19, detailedAccountTypeCode: 142, transactions: [row('usd-1'), row('usd-2')] }
      ]
    }))
    expect(await fetchTransactions(auth(), fx, from, to)).toEqual([row('usd-1'), row('usd-2')])
    const query = new URL(respondJson.mock.calls[0][0]).searchParams
    expect(query.get('currencyCodeList')).toBe('19')
    expect(query.get('detailedAccountTypeCodeList')).toBe('142')
    expect(query.get('accountId')).toBe(product.id)
  })

  it.each([
    {}, { balancesAndLimitsDataList: {} },
    { balancesAndLimitsDataList: [{ currencyCode: 19, detailedAccountTypeCode: 142 }] },
    { balancesAndLimitsDataList: [{ currencyCode: 100, detailedAccountTypeCode: 143, transactions: [] }] }
  ])('rejects missing or mismatched FX history instead of silently losing it: %j', async body => {
    respondJson.mockResolvedValue(response(body))
    await expect(fetchTransactions(auth(), { type: 'foreignCurrencyAccount', id: product.id, currencyCode: 19, detailedAccountTypeCode: 142 }, from, to)).rejects.toThrow()
  })

  it('does not return a saturated FX batch as complete history', async () => {
    respondJson.mockResolvedValue(response({ balancesAndLimitsDataList: [{ currencyCode: 19, detailedAccountTypeCode: 142, transactions: Array(1000).fill(row(1)) }] }))
    await expect(fetchTransactions(auth(), { type: 'foreignCurrencyAccount', id: product.id, currencyCode: 19, detailedAccountTypeCode: 142 }, from, to)).rejects.toThrow(/complete history/)
  })

  it('splits saturated FX windows without dropping equal rows or changing selectors', async () => {
    const fx = { type: 'foreignCurrencyAccount', id: product.id, currencyCode: 19, detailedAccountTypeCode: 142 }
    respondJson.mockImplementation(async url => {
      const query = new URL(url).searchParams
      const start = query.get('retrievalStartDate')
      const end = query.get('retrievalEndDate')
      expect(query.get('currencyCodeList')).toBe('19')
      expect(query.get('detailedAccountTypeCodeList')).toBe('142')
      expect(query.get('accountId')).toBe(product.id)
      return response({ balancesAndLimitsDataList: [{ currencyCode: 19, detailedAccountTypeCode: 142, transactions: Array(start === end ? 510 : 1000).fill(row('equal')) }] })
    })
    expect(await fetchTransactions(auth(), fx, from, to)).toEqual(Array(1020).fill(row('equal')))
    expect(respondJson).toHaveBeenCalledTimes(3)
  })

  it('rejects the complete FX result when the later split window fails', async () => {
    const failure = new Error('model later FX window failed')
    const envelope = (rows: object[]): ModelResponse => response({ balancesAndLimitsDataList: [{ currencyCode: 19, detailedAccountTypeCode: 142, transactions: rows }] })
    respondJson.mockResolvedValueOnce(envelope(Array(1000).fill(row(1))))
      .mockResolvedValueOnce(envelope([row(2)]))
      .mockRejectedValueOnce(failure)
    await expect(fetchTransactions(auth(), { type: 'foreignCurrencyAccount', id: product.id, currencyCode: 19, detailedAccountTypeCode: 142 }, from, to)).rejects.toBe(failure)
  })

  it.each([
    { path: '/deposits-and-savings/deposits', message: 'unexpected deposits response' }
  ])('does not infer no products from an unobserved 204 at $path', async ({ path: target, message }) => {
    respondJson.mockImplementation(async url => {
      const path = new URL(url).pathname
      if (path.endsWith('/general/accounts')) return response([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }])
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10, currentAccountCreditFrame: 0 })
      if (path.endsWith(target)) return { status: 204, headers: {}, body: undefined }
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      return response({ data: [] })
    })
    await expect(fetchAccounts(auth())).rejects.toThrow(message)
    expect(respondJson.mock.calls.some(([url]) => new URL(url).pathname.endsWith(target))).toBe(true)
  })

  it('preserves the existing checking-history 204 empty result', async () => {
    respondJson.mockResolvedValue({ status: 204, headers: {}, body: undefined })
    expect(await fetchTransactions(auth(), product, from, to)).toEqual([])
    expect(respondJson.mock.calls[0][0]).toContain('/current-account/transactions?')
  })

  it('does not infer empty FX history from an unobserved 204', async () => {
    respondJson.mockResolvedValue({ status: 204, headers: {}, body: undefined })
    await expect(fetchTransactions(auth(), { type: 'foreignCurrencyAccount', id: product.id, currencyCode: 19, detailedAccountTypeCode: 142 }, from, to)).rejects.toThrow('unexpected foreign currency history response')
    expect(respondJson).toHaveBeenCalledTimes(1)
    expect(respondJson.mock.calls[0][0]).toContain('/foreign-currency/transactions?')
    expect(new Headers((respondJson.mock.calls[0][1] as { headers: HeadersInit }).headers).get('accept-encoding')).toBeNull()
  })

  it('does not probe an absent portal context for every window, but retries after auth changes', async () => {
    const session = { ...auth(), restContext: '' }
    respondText.mockResolvedValue({ status: 404, headers: {}, body: '' })
    respondJson.mockImplementation(async url => {
      const query = new URL(url).searchParams
      return response({ transactions: query.get('retrievalStartDate') === query.get('retrievalEndDate') ? [row(1)] : Array(1000).fill(row(1)) })
    })
    expect(await fetchTransactions(session, product, from, to)).toHaveLength(2)
    expect(respondText).toHaveBeenCalledTimes(4)
    session.cookieHeader = 'SMSESSION=rotated-model'
    expect(await fetchTransactions(session, product, from, from)).toHaveLength(1)
    expect(respondText).toHaveBeenCalledTimes(8)
  })

  it('retains loan details and every mortgage envelope with parent ownership', async () => {
    const mortgage = { mortgageLoanSerialId: 123, subLoansCounter: 1, subLoanData: [{ subLoansSerialId: 201 }] }
    respondJson.mockImplementation(async url => {
      const path = new URL(url).pathname
      if (path.endsWith('/general/accounts')) return response([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }])
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10 })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      if (path.endsWith('/loans')) return response({ data: [{ creditSerialNumber: 1, unitedCreditTypeCode: 2710 }] })
      if (path.endsWith('/loans/1')) return response({ nextPaymentAmount: 5 })
      if (path.endsWith('/mortgages')) return response({ data: [mortgage] })
      throw new Error('unexpected model path')
    })
    expect(await fetchAccounts(auth())).toEqual([
      { bankNumber: 12, branchNumber: 702, accountNumber: 1001, structType: 'checking', details: { currentBalance: 10, currentAccountCreditFrame: null } },
      { creditSerialNumber: 1, unitedCreditTypeCode: 2710, details: { nextPaymentAmount: 5 }, structType: 'loan', sourceAccountId: product.id },
      { ...mortgage, structType: 'mortgage', sourceAccountId: product.id }
    ])
  })

  it('rejects malformed loan identity before constructing a detail URL', async () => {
    respondJson.mockImplementation(async url => {
      const path = new URL(url).pathname
      if (path.endsWith('/general/accounts')) return response([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }])
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10 })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      return response({ data: [{ creditSerialNumber: 1 }] })
    })
    await expect(fetchAccounts(auth())).rejects.toThrow(/loan identity/)
    expect(respondJson.mock.calls.some(([url]) => new URL(url).pathname.includes('/loans/'))).toBe(false)
  })

  it('does not treat a loan-detail 204 as an absent loan or return partial accounts', async () => {
    respondJson.mockImplementation(async url => {
      const path = new URL(url).pathname
      if (path.endsWith('/general/accounts')) return response([1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber })))
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10 })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      if (path.endsWith('/loans')) return response({ data: [{ creditSerialNumber: 1, unitedCreditTypeCode: 2710 }] })
      if (path.endsWith('/loans/1')) return { status: 204, headers: {}, body: undefined }
      throw new Error('unexpected model path')
    })
    await expect(fetchAccounts(auth())).rejects.toThrow('unexpected loan details')
    expect(respondJson.mock.calls.some(([url]) => new URL(url).searchParams.get('accountId') === '12-702-1002')).toBe(false)
    expect(respondJson.mock.calls.some(([url]) => new URL(url).pathname.endsWith('/mortgages'))).toBe(false)
  })

  it('does not infer a credit frame from an unconfirmed creditLimitAmount alias', async () => {
    respondJson.mockImplementation(async url => {
      const path = new URL(url).pathname
      if (path.endsWith('/general/accounts')) return response([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }])
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10, creditLimitAmount: 999 })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      return response({ data: [] })
    })
    expect(await fetchAccounts(auth())).toEqual([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001, structType: 'checking', details: { currentBalance: 10, creditLimitAmount: 999, currentAccountCreditFrame: null } }])
  })

  it.each([null, undefined, [], 'invalid'])('does not accept a malformed loan-details body: %j', async body => {
    respondJson.mockImplementation(async url => {
      const path = new URL(url).pathname
      if (path.endsWith('/general/accounts')) return response([{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }])
      if (path.includes('balanceAndCreditLimit')) return response({ currentBalance: 10 })
      if (path.includes('/foreign-currency/')) return response(null)
      if (path.includes('/deposits-and-savings/')) return response({ list: [] })
      if (path.endsWith('/loans')) return response({ data: [{ creditSerialNumber: 1, unitedCreditTypeCode: 2710 }] })
      return response(body)
    })
    await expect(fetchAccounts(auth())).rejects.toThrow(/loan details/)
  })

  it.each([
    [new Date('invalid'), to], [from, new Date('invalid')], [to, from]
  ])('rejects invalid or reversed ranges before any request', async (start, end) => {
    await expect(fetchTransactions(auth(), product, start, end)).rejects.toThrow(/interval/)
    expect(respondJson).not.toHaveBeenCalled()
  })

  it('maps date-only request bounds to the same fixed offset as the legacy converter', async () => {
    respondJson.mockResolvedValue(response({ transactions: [] }))
    await fetchTransactions(auth(), product, new Date('2026-10-01T00:00:00+02:00'), new Date('2026-10-02T00:00:00+02:00'))
    const query = new URL(respondJson.mock.calls[0][0]).searchParams
    expect([query.get('retrievalStartDate'), query.get('retrievalEndDate')]).toEqual(['20261001', '20261002'])
  })

  it('retains the earlier bank-wall day at an IDT-midnight start without guessing new DST semantics', async () => {
    respondJson.mockResolvedValue(response({ transactions: [] }))
    await fetchTransactions(auth(), product, new Date('2026-10-01T00:00:00+03:00'), new Date('2026-10-02T23:59:59+03:00'))
    const query = new URL(respondJson.mock.calls[0][0]).searchParams
    expect([query.get('retrievalStartDate'), query.get('retrievalEndDate')]).toEqual(['20260930', '20261002'])
  })
})
