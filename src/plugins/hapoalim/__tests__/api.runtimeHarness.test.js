/* eslint-disable @typescript-eslint/no-var-requires */

// Complete public unauthenticated response, GET /ServerServices/general/accounts?lang=he,
// 2026-10-12: HTTP 401, Content-Type text/*, no credentials/cookies sent (three probes).
const accountsStepUp = require('../__fixtures__/accounts-stepupotp.json')

// Observed-response classification uses the complete fixture in separate non-model suites.
// [model] cases below exercise synthetic runtime/transport invariants, not bank schemas.
describe('hapoalim network privacy and failure visibility', () => {
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

  it('[model] does not log authenticated portal HTML through the real network helper', async () => {
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

  it('[model] rejects the whole result on an unknown optional-endpoint failure without exposing HTML or cookies', async () => {
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

  it('[model] does not include unknown bank error descriptions or state in reportable errors', async () => {
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

  describe('[model] coordination with the complete observed accounts fixture', () => {
    it.each([false, true])('requires native origin proof for the observed accounts state, with safe diagnostics (omit URL: %s)', async omitUrl => {
      global.fetch = jest.fn(async url => ({
        status: 401,
        url: omitUrl ? undefined : url,
        headers: new Map([['content-type', 'text/*']]),
        text: async () => JSON.stringify(accountsStepUp)
      }))
      global.ZenMoney = {}
      const { fetchAccounts, isLikelyAuthGateError, getAuthGateVerifier } = require('../api')
      const error = await fetchAccounts({ cookieHeader: 'SMSESSION=MODEL_PRIVATE_COOKIE', restContext: 'pib' }).catch(error => error)
      expect(error).toBeInstanceOf(Error)
      expect(isLikelyAuthGateError(error)).toBe(!omitUrl)
      expect(error.responseSummary).toMatchObject({ status: 401, errCode: omitUrl ? null : 'STEPUPOTP' })
      expect(getAuthGateVerifier(error)).toBeUndefined()
      expect(JSON.stringify(spies.flatMap(spy => spy.mock.calls))).not.toContain('MODEL_PRIVATE_COOKIE')
      const logs = JSON.stringify(spies.flatMap(spy => spy.mock.calls))
      expect(logs).toContain('"flow":"STEPUP"')
      expect(logs).toContain('"state":"STEPUPOTP"')
      expect(logs).toContain('"result":null')
      expect(logs).toContain('"error":null')
      expect(JSON.stringify(error)).not.toContain('"flow"')
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch.mock.calls[0][0]).toBe('https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he')
    })
  })

  // Direct local error models test recovery bounds, never fabricated bank payloads.
  it.each([401, 403, 429, 500, 503])('[model] does not infer authentication from an unclassified HTTP %s error', status => {
    const { isLikelyAuthGateError } = require('../api')
    const error = new Error('MODEL_UNCLASSIFIED_FAILURE')
    error.responseSummary = { status, errCode: null, isLoginPage: false }
    expect(isLikelyAuthGateError(error)).toBe(false)
  })

  describe('[model] coordination with the complete observed accounts fixture', () => {
    it.each([
      'https://login.bankhapoalim.co.il/pib/current-account/transactions',
      'https://other.example/ServerServices/general/accounts',
      'MODEL_INVALID_URL'
    ])('bounds the observed control state to the accounts origin/path in an error model: %s', url => {
      const { isLikelyAuthGateError } = require('../api')
      const error = new Error('MODEL_ENDPOINT_BOUNDARY')
      error.response = { status: 401, url, body: accountsStepUp }
      expect(isLikelyAuthGateError(error)).toBe(false)
    })
  })
})
