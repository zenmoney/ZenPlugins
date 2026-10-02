/* eslint-disable @typescript-eslint/no-var-requires */

import { makePluginDataApi } from '../../../ZPAPI.pluginData'

const BASE = 'https://login.bankhapoalim.co.il'
const ACCOUNTS_PATH = '/ServerServices/general/accounts'
const savedAuth = { cookieHeader: 'SMSESSION=stale', restContext: 'pib', acquiredAt: 1 }
const options = {
  preferences: {},
  fromDate: new Date('2026-09-01T00:00:00Z'),
  toDate: new Date('2026-09-28T00:00:00Z')
}
const refusalShapes = [
  { status: 302, headers: { location: '/ng-portals-bt/auth/he/' }, body: '' },
  { status: 200, headers: { 'content-type': 'text/html' }, body: '<html>Login or maintenance</html>', omitUrl: true },
  { status: 200, headers: { 'content-type': 'application/json' }, body: { error: 'unknown auth response' } }
]

describe('hapoalim real session orchestration', () => {
  const originalFetch = global.fetch
  const NativeHeaders = global.Headers
  const originalURL = global.URL
  const originalZenMoney = global.ZenMoney
  let consoleSpies
  let nativeCookies
  let dataApi
  let scrape
  let nativeOpenWebView

  function loadRuntime (refusal, initialData = { auth: savedAuth }) {
    dataApi = makePluginDataApi(initialData)
    global.ZenMoney = {
      ...dataApi.methods,
      Headers: NativeHeaders,
      features: { webViewConfiguration: true },
      isAccountSkipped: jest.fn().mockReturnValue(false),
      restoreCookies: jest.fn(async () => { global.ZenMoney.__cookies = JSON.parse(JSON.stringify(nativeCookies)) }),
      saveCookies: jest.fn(async () => { nativeCookies = JSON.parse(JSON.stringify(global.ZenMoney.__cookies)) }),
      fetch: jest.fn(async (url, init) => {
        const path = new URL(url).pathname
        const cookie = init.headers.get('cookie') || ''
        let response = { status: 200, headers: {}, body: {} }
        if (path === ACCOUNTS_PATH) {
          response = refusal && !cookie.includes('SMSESSION=fresh')
            ? refusal
            : {
                status: 200,
                headers: {},
                body: [1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber }))
              }
        } else if (path.startsWith('/ServerServices/foreign-currency/')) {
          response.body = null
        } else if (path.includes('balanceAndCreditLimit')) {
          response.body = { currentBalance: 100, creditLimitAmount: 0 }
        } else if (path.endsWith('/current-account/transactions')) {
          response.body = { transactions: [] }
          response.headers['set-cookie'] = 'SMSESSION=fresh-rotated; Path=/; Secure'
        } else if (path.includes('/portalserver/') || path.includes('/ng-')) {
          response.body = 'restContext: "/pib"'
        }
        return {
          status: response.status,
          url: response.omitUrl ? undefined : url,
          headers: new NativeHeaders(response.headers),
          text: async () => typeof response.body === 'string' ? response.body : JSON.stringify(response.body)
        }
      }),
      openWebView: jest.fn((url, headers, onRequest, onComplete, configuration) => {
        Promise.resolve(configuration.configure({ cookieJar: { getCookieString: jest.fn().mockResolvedValue('') } }))
          .then(() => onRequest({ url: `${BASE}/portalserver/HomePage`, headers: { cookie: 'SMSESSION=fresh' } }, onComplete))
          .catch(onComplete)
      })
    }
    nativeOpenWebView = global.ZenMoney.openWebView
    require('../../../polyfills/fetch')
    scrape = require('../index').scrape
  }

  beforeEach(() => {
    jest.resetModules()
    jest.dontMock('../api')
    jest.dontMock('../converters')
    jest.dontMock('../../../common/network')
    jest.dontMock('../../../common/transactionGroupHandler')
    consoleSpies = ['debug', 'info', 'log', 'warn', 'error'].map(method => jest.spyOn(console, method).mockImplementation(() => {}))
    nativeCookies = [{ name: 'SMSESSION', value: 'stale', domain: 'login.bankhapoalim.co.il', path: '/', secure: true }]
  })

  afterEach(() => {
    for (const spy of consoleSpies) spy.mockRestore()
    global.fetch = originalFetch
    global.Headers = NativeHeaders
    global.URL = originalURL
    global.ZenMoney = originalZenMoney
  })

  it.each(refusalShapes)('completes one foreground login and both accounts after refusal %#', async refusal => {
    loadRuntime(refusal)
    const result = await scrape({ ...options, isInBackground: false })
    expect(nativeOpenWebView).toHaveBeenCalledTimes(1)
    expect(result.accounts.map(account => account.id).sort()).toEqual(['12-702-1001', '12-702-1002'])
    expect(result.transactions).toEqual([])
    expect(dataApi.currentData.auth.cookieHeader).toContain('SMSESSION=fresh-rotated')
    expect(nativeCookies).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'SMSESSION', value: 'fresh-rotated' })]))
  })

  it.each(refusalShapes.slice(1))('keeps ambiguous background auth and never opens WebView %#', async refusal => {
    loadRuntime(refusal)
    await expect(scrape({ ...options, isInBackground: true })).rejects.toBeDefined()
    expect(nativeOpenWebView).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth).toMatchObject(savedAuth)
  })

  it.each([429, 500, 503])('does not open login or clear auth on HTTP %s in foreground', async status => {
    loadRuntime({ status, headers: { 'content-type': 'text/html' }, body: 'maintenance' })
    await expect(scrape({ ...options, isInBackground: false })).rejects.toBeDefined()
    expect(nativeOpenWebView).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth).toMatchObject(savedAuth)
  })

  it('restores rotated JS fetch cookies across plugin instances without a new login', async () => {
    loadRuntime(refusalShapes[1])
    await scrape({ ...options, isInBackground: false })
    const persistedData = JSON.parse(JSON.stringify(dataApi.currentData))
    jest.resetModules()
    loadRuntime(null, persistedData)
    const result = await scrape({ ...options, isInBackground: true })
    expect(result.accounts).toHaveLength(2)
    expect(nativeOpenWebView).not.toHaveBeenCalled()
    expect(global.ZenMoney.fetch.mock.calls[0][1].headers.get('cookie')).toContain('SMSESSION=fresh-rotated')
    expect((await global.ZenMoney.getCookies()).find(cookie => cookie.name === 'SMSESSION').value).toBe('fresh-rotated')
  })

  it('keeps same-session XSRF on a silent transaction retry when the JS jar only has SMSESSION', async () => {
    nativeCookies = [{ name: 'SMSESSION', value: 'current', domain: 'login.bankhapoalim.co.il', path: '/', secure: true }]
    loadRuntime(null, { auth: { cookieHeader: 'SMSESSION=current; XSRF-TOKEN=stable', xsrfToken: 'stable', restContext: 'pib' } })
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    let refused = false
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      if (new URL(url).pathname.endsWith('/current-account/transactions')) {
        if (!refused) {
          refused = true
          return { status: 401, url, headers: new NativeHeaders(), text: async () => '{}' }
        }
        expect(init.headers.get('X-XSRF-TOKEN')).toBe('stable')
      }
      return await implementation(url, init)
    })
    expect((await scrape({ ...options, isInBackground: true })).accounts).toHaveLength(2)
    expect(nativeOpenWebView).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth.xsrfToken).toBe('stable')
    expect(dataApi.currentData.auth.cookieHeader).toContain('XSRF-TOKEN=stable')
  })
})
