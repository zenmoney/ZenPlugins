/* eslint-disable @typescript-eslint/no-var-requires */

// [model] Synthetic HTTP envelopes exercise real network parsing and redaction,
// not bank response schemas or product availability.
describe('[model] hapoalim network privacy and failure visibility', () => {
  const originalFetch = global.fetch
  const originalHost = global.ZenMoney
  let spies

  beforeEach(() => {
    jest.resetModules()
    jest.dontMock('../../../common/network')
    jest.dontMock('../../../common/network/cookies')
    spies = ['debug', 'info', 'log', 'warn', 'error'].map(method => jest.spyOn(console, method).mockImplementation(() => {}))
  })

  afterEach(() => {
    for (const spy of spies) spy.mockRestore()
    global.fetch = originalFetch
    global.ZenMoney = originalHost
  })

  it('does not log authenticated portal HTML through the real network helper', async () => {
    const marker = 'SENSITIVE_MODEL_PORTAL_MARKER'
    global.fetch = jest.fn(async url => ({
      status: 200,
      url,
      headers: new Map([['content-type', url.includes('/accounts?') ? 'application/json' : 'text/html']]),
      text: async () => url.includes('/accounts?') ? '[]' : `<html>${marker}<script>restContext: "/pib"</script></html>`
    }))
    global.ZenMoney = {}
    Object.defineProperty(global.fetch, 'cookieJar', { value: { serialize: async () => ({ cookies: [{ key: 'SMSESSION', value: 'fictional-session', domain: '.bankhapoalim.co.il', path: '/' }] }) } })
    const { recoverAuthFromCookieStore } = require('../api')
    expect((await recoverAuthFromCookieStore(null)).restContext).toBe('pib')
    const logs = JSON.stringify(spies.flatMap(spy => spy.mock.calls))
    expect(logs).not.toContain(marker)
    expect(logs).not.toContain('fictional-session')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('rejects the whole result on an unknown optional-endpoint failure without exposing HTML or cookies', async () => {
    const marker = 'FICTIONAL_OPTIONAL_SECRET_MARKER'
    global.fetch = jest.fn(async url => {
      const optional = url.includes('/foreign-currency/')
      return {
        status: 200,
        url: optional ? `${url}&token=${marker}` : url,
        headers: new Map(optional
          ? [['content-type', 'text/html'], ['set-cookie', `SMSESSION=${marker}; Path=/`]]
          : [['content-type', 'application/json']]),
        text: async () => optional
          ? `<html>${marker}</html>`
          : JSON.stringify(url.includes('/accounts?')
            ? [{ bankNumber: 12, branchNumber: 702, accountNumber: 1001 }]
            : {})
      }
    })
    global.ZenMoney = {}
    const { fetchAccounts } = require('../api')
    const error = await fetchAccounts({ cookieHeader: 'SMSESSION=fictional', restContext: 'pib' }).catch(error => error)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Bank Hapoalim returned an unexpected response instead of JSON.')
    expect(JSON.stringify(error)).not.toContain(marker)
    const logs = JSON.stringify(spies.flatMap(spy => spy.mock.calls))
    expect(logs).not.toContain(marker)
    expect(logs).toContain('account endpoint failed: foreign currency')
  })

  it('does not include unknown bank error descriptions or state in reportable errors', async () => {
    const marker = 'MODEL_PRIVATE_ERROR_DESCRIPTION'
    global.fetch = jest.fn(async url => ({
      status: 401,
      url,
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ flow: marker, state: marker, error: { errCode: 'MODEL_ERROR', errDesc: marker } })
    }))
    global.ZenMoney = {}
    Object.defineProperty(global.fetch, 'cookieJar', { value: { serialize: async () => ({ cookies: [{ key: 'SMSESSION', value: 'model', domain: '.bankhapoalim.co.il', path: '/' }] }) } })
    const { recoverAuthFromCookieStore, isLikelyAuthGateError } = require('../api')
    const error = await recoverAuthFromCookieStore(null).catch(error => error)
    expect(isLikelyAuthGateError(error)).toBe(false)
    expect(error.responseSummary.errCode).toBe('MODEL_ERROR')
    expect(JSON.stringify(error)).not.toContain(marker)
    expect(JSON.stringify(spies.flatMap(spy => spy.mock.calls))).not.toContain(marker)
    expect(JSON.stringify(spies.flatMap(spy => spy.mock.calls))).toContain('MODEL_ERROR')
  })
})
