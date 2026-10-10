import fetchMock from 'fetch-mock'

interface Auth { cookieHeader: string, xsrfToken: string | null, restContext: string | null, acquiredAt: number }
interface Api {
  fetchAccounts: (auth: Auth) => Promise<unknown[]>
  fetchTransactions: (auth: Auth, product: { id: string }, from: Date, to: Date) => Promise<unknown[]>
  withAuthUpdates: (auth: Auth, updated: (auth: Auth) => Promise<void>, operation: (auth: Auth) => Promise<unknown>) => Promise<unknown>
}

const base = 'https://login.bankhapoalim.co.il'
const accounts = base + '/ServerServices/general/accounts?lang=he'
const originalFetch = global.fetch
const originalHost = global.ZenMoney

// [model] Standard Set-Cookie semantics and auth persistence; empty synthetic
// account/history envelopes are not evidence of Hapoalim schemas or availability.
describe('[model] Hapoalim response-cookie revocation', () => {
  let api: Api

  beforeEach(() => {
    global.ZenMoney = {} as unknown as typeof ZenMoney
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    api = jest.requireActual<Api>('../api')
  })

  afterEach(() => {
    fetchMock.restore()
    global.fetch = originalFetch
    global.ZenMoney = originalHost
    jest.restoreAllMocks()
  })

  const deletions = ['', 'removed; Max-Age=0', 'removed; Max-Age=-1', 'removed; Expires=Thu, 01 Jan 1970 00:00:00 GMT']
  it.each(['SMSESSION', 'XSRF-TOKEN'].flatMap(name => deletions.map(value => ({ name, value }))))('removes $name=$value before persistence and the next request', async ({ name, value }) => {
    const auth: Auth = { cookieHeader: 'SMSESSION=model; XSRF-TOKEN=model-xsrf', xsrfToken: 'model-xsrf', restContext: 'pib', acquiredAt: 1 }
    const persisted = jest.fn(async (_updated: Auth) => {})
    let reads = 0
    fetchMock.post((url: string) => url.startsWith(base + '/pib/current-account/transactions?'), (_url, options) => {
      if (reads++ === 0) return { status: 200, body: { transactions: [] }, headers: { 'set-cookie': `${name}=${value}; Path=/` } }
      const headers = options?.headers as Record<string, string>
      expect(headers.Cookie).not.toContain(`${name}=`)
      expect(persisted).toHaveBeenCalledWith(expect.objectContaining({ cookieHeader: auth.cookieHeader }))
      if (name === 'XSRF-TOKEN') expect(headers['X-XSRF-TOKEN']).toBeUndefined()
      return { status: 200, body: { transactions: [] } }
    })
    await api.withAuthUpdates(auth, persisted, async candidate => await api.fetchTransactions(candidate, { id: 'model-account' }, new Date('2026-09-01'), new Date('2026-09-02')))
    await api.fetchTransactions(auth, { id: 'model-account' }, new Date('2026-09-01T00:00:00Z'), new Date('2026-09-02T00:00:00Z'))
    expect(auth.cookieHeader).not.toContain(`${name}=`)
    if (name === 'XSRF-TOKEN') expect(auth.xsrfToken).toBeNull()
  })

  it('clears a metadata-only XSRF token when the server explicitly deletes it', async () => {
    const auth: Auth = { cookieHeader: 'SMSESSION=model', xsrfToken: 'legacy-xsrf', restContext: 'pib', acquiredAt: 1 }
    fetchMock.post((url: string) => url.includes('/current-account/transactions?'), { status: 200, body: { transactions: [] }, headers: { 'set-cookie': 'XSRF-TOKEN=; Max-Age=0; Path=/' } })
    await api.fetchTransactions(auth, { id: 'model-account' }, new Date('2026-09-01'), new Date('2026-09-02'))
    expect(auth).toEqual({ cookieHeader: 'SMSESSION=model', xsrfToken: null, restContext: 'pib', acquiredAt: 1 })
  })

  it('gives a positive Max-Age priority over an old Expires value', async () => {
    const auth: Auth = { cookieHeader: 'SMSESSION=model; XSRF-TOKEN=old', xsrfToken: 'old', restContext: 'pib', acquiredAt: 1 }
    fetchMock.post((url: string) => url.includes('/current-account/transactions?'), { status: 200, body: { transactions: [] }, headers: { 'set-cookie': 'XSRF-TOKEN=new%2Fraw; Max-Age=60; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/' } })
    await api.fetchTransactions(auth, { id: 'model-account' }, new Date('2026-09-01'), new Date('2026-09-02'))
    expect(auth).toEqual({ cookieHeader: 'SMSESSION=model; XSRF-TOKEN=new%2Fraw', xsrfToken: 'new%2Fraw', restContext: 'pib', acquiredAt: 1 })
  })

  it('masks a contract identifier embedded in an official loan detail path', async () => {
    const debug = jest.mocked(console.debug)
    const auth = { cookieHeader: 'SMSESSION=model', xsrfToken: null, restContext: 'pib', acquiredAt: 1 }
    fetchMock.get(accounts, { status: 200, body: [{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }] })
    fetchMock.get((url: string) => url.includes('/pib/current-account/composite/'), { status: 200, body: {} })
    fetchMock.get((url: string) => url.includes('/foreign-currency/'), { status: 200, body: { balancesAndLimitsDataList: [] } })
    fetchMock.get((url: string) => url.includes('/deposits-and-savings/'), { status: 200, body: { list: [] } })
    fetchMock.get((url: string) => url.includes('/credit-and-mortgage/mortgages?'), { status: 200, body: { data: [] } })
    fetchMock.get((url: string) => url.includes('/credit-and-mortgage/v3/loans?'), { status: 200, body: { data: [{ creditSerialNumber: 1, unitedCreditTypeCode: 2710 }] } })
    fetchMock.get((url: string) => url.includes('/credit-and-mortgage/v3/loans/1?'), { status: 200, body: {} })
    expect(await api.fetchAccounts(auth)).toHaveLength(3)
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('/credit-and-mortgage/v3/loans/1?')
    expect(logs).toContain('"creditSerialNumber":1')
    expect(logs).toContain('/credit-and-mortgage/v3/loans/<id>')
  })
})
