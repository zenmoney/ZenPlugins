/* eslint-disable @typescript-eslint/no-var-requires */

import { makePluginDataApi } from '../../../ZPAPI.pluginData'
import { EventEmitter } from 'events'

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

// [model] Fake native and HTTP boundaries exercise the real entrypoint, cookie polyfill
// and converters. Synthetic account envelopes are not evidence of bank schemas.
describe('[model] hapoalim real session orchestration', () => {
  const originalFetch = global.fetch
  const NativeHeaders = global.Headers
  const originalURL = global.URL
  const originalZenMoney = global.ZenMoney
  let consoleSpies
  let nativeCookies
  let dataApi
  let scrape
  let nativeOpenWebView
  let nativeRestoreCookies
  let nativeShow

  function loadRuntime (refusal, initialData = { auth: savedAuth }, initialWebCookies = '', retainNativeCookies = false) {
    dataApi = makePluginDataApi(initialData)
    let webCookies = initialWebCookies
    let pageUrl = null
    nativeShow = jest.fn(async () => {})
    class NativeWebView extends EventEmitter {
      static NavigationAction = { LOAD: undefined, BLOCK: true, OPEN_EXTERNAL: 2 }
      constructor () {
        super()
        this.policy = null
        this.cookieJar = { getCookieString: async () => webCookies }
      }

      get navigationPolicy () { return this.policy }
      set navigationPolicy (value) { this.policy = value }
      async show () { await nativeShow() }
      async goto (url) {
        expect(this.policy({ url, method: 'GET', headers: {}, source: 'webView' })).toBeUndefined()
        if (!retainNativeCookies) webCookies = 'SMSESSION=fresh'
        pageUrl = `${BASE}/portalserver/HomePage`
      }

      async url () { return pageUrl }
      async close () { this.emit('close') }
    }
    global.ZenMoney = {
      ...dataApi.methods,
      Headers: NativeHeaders,
      WebView: NativeWebView,
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
          response.body = { currentBalance: 100, currentAccountCreditFrame: 0 }
        } else if (path.includes('/deposits-and-savings/')) {
          response.body = { list: [] }
        } else if (path.includes('/credit-and-mortgage/')) {
          response.body = { data: [] }
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
      openWebView: jest.fn()
    }
    nativeOpenWebView = global.ZenMoney.openWebView
    nativeRestoreCookies = global.ZenMoney.restoreCookies
    require('../../../polyfills/fetch')
    scrape = require('../index').scrape
  }

  beforeEach(() => {
    jest.resetModules()
    jest.dontMock('../api')
    jest.dontMock('../converters')
    jest.dontMock('../../../common/network')
    jest.dontMock('../../../common/network/cookies')
    jest.dontMock('../../../common/transactionGroupHandler')
    consoleSpies = ['debug', 'info', 'log', 'warn', 'error'].map(method => jest.spyOn(console, method).mockImplementation(() => {}))
    nativeCookies = [{ name: 'SMSESSION', value: 'stale', domain: 'login.bankhapoalim.co.il', path: '/', secure: true }]
  })

  afterEach(() => {
    jest.useRealTimers()
    for (const spy of consoleSpies) spy.mockRestore()
    global.fetch = originalFetch
    global.Headers = NativeHeaders
    global.URL = originalURL
    global.ZenMoney = originalZenMoney
  })

  it.each(refusalShapes.slice(0, 1))('completes one foreground login and both accounts after a confirmed refusal %#', async refusal => {
    loadRuntime(refusal)
    const result = await scrape({ ...options, isInBackground: false })
    expect(nativeShow).toHaveBeenCalledTimes(1)
    expect(nativeOpenWebView).not.toHaveBeenCalled()
    expect(result).toEqual({
      accounts: [1001, 1002].map(number => ({
        id: `12-702-${number}`,
        type: 'checking',
        title: `*${number} חשבון נוכחי`,
        instrument: 'ILS',
        syncID: [`12-702-${number}`],
        balance: 100,
        creditLimit: 0
      })),
      transactions: []
    })
    expect(dataApi.currentData.auth.cookieHeader).toContain('SMSESSION=fresh-rotated')
    expect(nativeCookies).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'SMSESSION', value: 'fresh-rotated' })]))
  })

  it.each(refusalShapes.slice(1).flatMap(refusal => [false, true].map(isInBackground => ({ refusal, isInBackground }))))('keeps ambiguous auth and never opens login %#', async ({ refusal, isInBackground }) => {
    loadRuntime(refusal)
    await expect(scrape({ ...options, isInBackground })).rejects.toBeDefined()
    expect(nativeShow).not.toHaveBeenCalled()
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
    loadRuntime(refusalShapes[0])
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

  it('syncs both accounts on an older host when persisted HTTP auth remains valid', async () => {
    loadRuntime(null)
    delete global.ZenMoney.WebView
    const result = await scrape({ ...options, isInBackground: true })
    expect(result.accounts.map(account => account.id)).toEqual(['12-702-1001', '12-702-1002'])
    expect(result.transactions).toEqual([])
    expect(nativeShow).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth.cookieHeader).toContain('SMSESSION=fresh-rotated')
  })

  it('preserves the published raw XSRF header form for an encoded cookie', async () => {
    const token = 'model%2Ftoken%3D'
    loadRuntime(null, { auth: { ...savedAuth, cookieHeader: `SMSESSION=stale; XSRF-TOKEN=${token}`, xsrfToken: token } })
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      if (new URL(url).pathname.endsWith('/current-account/transactions')) {
        expect(init.headers.get('X-XSRF-TOKEN')).toBe(token)
      }
      return await implementation(url, init)
    })
    expect((await scrape({ ...options, isInBackground: true })).accounts).toHaveLength(2)
    expect(nativeShow).not.toHaveBeenCalled()
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
          return { status: 401, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ error: { errCode: 'STEPUPOTP' } }) }
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

  it('passes a verified rotation to the next product request and preserves it after history fails', async () => {
    loadRuntime(null)
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      const path = new URL(url).pathname
      if (path.endsWith('/current-account/transactions')) {
        expect(dataApi.currentData.auth.cookieHeader).toContain('SMSESSION=latest-confirmed')
        return { status: 503, url, headers: new NativeHeaders(), text: async () => '{}' }
      }
      const response = await implementation(url, init)
      if (path.includes('balanceAndCreditLimit')) response.headers.set('set-cookie', 'SMSESSION=latest-confirmed; Path=/; Secure')
      if (path.includes('/foreign-currency/')) expect(init.headers.get('cookie')).toContain('SMSESSION=latest-confirmed')
      return response
    })
    await expect(scrape({ ...options, isInBackground: true })).rejects.toMatchObject({ responseSummary: { status: 503 } })
    expect(dataApi.currentData.auth.cookieHeader).toContain('SMSESSION=latest-confirmed')
    expect(nativeShow).not.toHaveBeenCalled()
  })

  it('does not start another account request after an unknown product failure', async () => {
    loadRuntime(null)
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      if (new URL(url).pathname.includes('/foreign-currency/')) return { status: 503, url, headers: new NativeHeaders(), text: async () => '{}' }
      return await implementation(url, init)
    })
    await expect(scrape(options)).rejects.toMatchObject({ responseSummary: { status: 503 } })
    const urls = global.ZenMoney.fetch.mock.calls.map(([url]) => url)
    expect(urls.some(url => new URL(url).searchParams.get('accountId') === '12-702-1002')).toBe(false)
    expect(urls.some(url => url.includes('/deposits-and-savings/'))).toBe(false)
    expect(dataApi.currentData.auth).toMatchObject(savedAuth)
    expect(nativeShow).not.toHaveBeenCalled()
  })

  it('bounds a hung regular HTTP request and does not persist its late rotation', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    loadRuntime(null)
    let resolveLate
    global.ZenMoney.fetch.mockReturnValueOnce(new Promise(resolve => { resolveLate = resolve }))
    const outcome = scrape(options).catch(error => error)
    for (let i = 0; i < 60; i++) await Promise.resolve()
    jest.advanceTimersByTime(15000)
    for (let i = 0; i < 60; i++) await Promise.resolve()
    expect(await outcome).toMatchObject({ message: 'Bank Hapoalim HTTP request timed out' })
    expect(dataApi.currentData.auth).toMatchObject(savedAuth)
    const count = global.ZenMoney.fetch.mock.calls.length
    resolveLate({ status: 200, url: BASE + ACCOUNTS_PATH, headers: new NativeHeaders({ 'set-cookie': 'SMSESSION=late; Path=/' }), text: async () => '[]' })
    for (let i = 0; i < 60; i++) await Promise.resolve()
    expect(global.ZenMoney.fetch).toHaveBeenCalledTimes(count)
    expect(dataApi.currentData.auth).toMatchObject(savedAuth)
    expect(nativeShow).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
  })

  it.each([false, true])('does not confuse accounts access with transaction step-up (background: %s)', async isInBackground => {
    loadRuntime(null, { auth: savedAuth }, 'SMSESSION=accounts-only')
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      if (new URL(url).pathname.endsWith('/current-account/transactions') && !init.headers.get('cookie').includes('SMSESSION=fresh')) {
        return { status: 401, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ error: { errCode: 'STEPUPOTP' } }) }
      }
      return await implementation(url, init)
    })
    if (isInBackground) {
      const { UserInteractionError } = jest.requireActual('../../../errors')
      await expect(scrape({ ...options, isInBackground })).rejects.toBeInstanceOf(UserInteractionError)
      expect(nativeShow).not.toHaveBeenCalled()
      // An accounts-only candidate never replaces auth after its history proof failed.
      expect(dataApi.currentData.auth.cookieHeader).toBe(savedAuth.cookieHeader)
    } else {
      expect((await scrape({ ...options, isInBackground })).accounts).toHaveLength(2)
      expect(nativeShow).toHaveBeenCalledTimes(1)
      expect(dataApi.currentData.auth.cookieHeader).toContain('SMSESSION=fresh-rotated')
    }
  })

  it('finishes a server-side OTP challenge without changing native cookies', async () => {
    loadRuntime(null, { auth: savedAuth }, 'SMSESSION=accounts-only', true)
    let historyAllowed = false
    nativeShow.mockImplementation(async () => { historyAllowed = true })
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      if (new URL(url).pathname.endsWith('/current-account/transactions') && !historyAllowed) {
        return { status: 401, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ error: { errCode: 'STEPUPOTP' } }) }
      }
      return await implementation(url, init)
    })
    const result = await scrape({ ...options, isInBackground: false })
    expect(result.accounts).toHaveLength(2)
    expect(nativeShow).toHaveBeenCalledTimes(1)
    expect(dataApi.currentData.auth.cookieHeader).toContain('SMSESSION=fresh-rotated')
  })

  it('never persists a different accounts-only JS jar after history rejects its proof', async () => {
    nativeCookies = [{ name: 'SMSESSION', value: 'jar-accounts-only', domain: 'login.bankhapoalim.co.il', path: '/', secure: true }]
    const original = { ...savedAuth, cookieHeader: 'SMSESSION=stale; native-proof=model-native', xsrfToken: null }
    loadRuntime(null, { auth: original })
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      if (new URL(url).pathname.endsWith('/current-account/transactions')) {
        return { status: 401, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ error: { errCode: 'STEPUPOTP' } }) }
      }
      return await implementation(url, init)
    })
    const { UserInteractionError } = jest.requireActual('../../../errors')
    await expect(scrape({ ...options, isInBackground: true })).rejects.toBeInstanceOf(UserInteractionError)
    expect(dataApi.currentData.auth).toEqual(original)
    expect(nativeShow).not.toHaveBeenCalled()
  })

  it('keeps customer response bodies and account-query identifiers out of regular network logs', async () => {
    loadRuntime(null)
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      const response = await implementation(url, init)
      if (new URL(url).pathname !== ACCOUNTS_PATH) return response
      const accounts = JSON.parse(await response.text())
      response.headers.set('authorization', 'Bearer MODEL_PRIVATE_BEARER')
      response.headers.set('x-xsrf-token', 'MODEL_PRIVATE_RESPONSE_XSRF')
      return { ...response, text: async () => JSON.stringify(accounts.map(account => ({ ...account, ownerName: 'model-private-customer' }))) }
    })
    expect((await scrape(options)).accounts).toHaveLength(2)
    const logs = JSON.stringify(consoleSpies.flatMap(spy => spy.mock.calls))
    expect(logs).not.toContain('model-private-customer')
    expect(logs).not.toContain('accountId=12-702-1001')
    expect(logs).not.toContain('SMSESSION=stale')
    expect(logs).not.toContain('MODEL_PRIVATE_BEARER')
    expect(logs).not.toContain('MODEL_PRIVATE_RESPONSE_XSRF')
    expect(logs).toContain('/current-account/transactions')
    expect(logs).toContain('retrievalStartDate=20260901')
    expect(logs).toContain('retrievalEndDate=20260928')
    expect(logs).toContain('"currentBalance":100')
    expect(logs).toContain('"currentAccountCreditFrame":0')
  })

  it('keeps the later account auth error and does not present a second login', async () => {
    loadRuntime(refusalShapes[0])
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      if (new URL(url).pathname.endsWith('/current-account/transactions') && new URL(url).searchParams.get('accountId') === '12-702-1002') {
        return { status: 401, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ error: { errCode: 'STEPUPOTP' } }) }
      }
      return await implementation(url, init)
    })
    await expect(scrape({ ...options, isInBackground: false })).rejects.toMatchObject({ responseSummary: { status: 401, errCode: 'STEPUPOTP' } })
    expect(nativeShow).toHaveBeenCalledTimes(1)
  })

  it('imports every row from split histories of both accounts, including equal-looking payments', async () => {
    loadRuntime(null)
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    const windows = []
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      const parsed = new URL(url)
      if (!parsed.pathname.endsWith('/current-account/transactions')) return await implementation(url, init)
      const id = parsed.searchParams.get('accountId')
      const start = parsed.searchParams.get('retrievalStartDate')
      const end = parsed.searchParams.get('retrievalEndDate')
      windows.push([id, start, end])
      const count = start !== end ? 1000 : 510
      const rows = Array.from({ length: count }, () => ({
        eventAmount: 7,
        transactionType: 'REGULAR',
        rejectedDataEventPertainingIndication: 'N',
        eventActivityTypeCode: id.endsWith('1001') ? 1 : 2,
        formattedEventDate: `2026-10-${start.slice(-2)}T00:00:00.000Z`,
        activityDescription: 'MODEL IDENTICAL PAYMENT'
      }))
      return { status: 200, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ transactions: rows }) }
    })
    const result = await scrape({ ...options, fromDate: new Date('2026-10-01T00:00:00+02:00'), toDate: new Date('2026-10-02T23:59:59+02:00') })
    expect(result.accounts.map(account => account.id)).toEqual(['12-702-1001', '12-702-1002'])
    expect(result.transactions).toHaveLength(2040)
    for (const [id, sign] of [['12-702-1001', 1], ['12-702-1002', -1]]) {
      const movements = result.transactions.flatMap(transaction => transaction.movements).filter(movement => movement.account.id === id)
      expect(movements).toHaveLength(1020)
      expect(movements.reduce((sum, movement) => sum + movement.sum, 0)).toBe(sign * 7140)
      expect(windows.filter(window => window[0] === id)).toEqual([
        [id, '20261001', '20261002'], [id, '20261001', '20261001'], [id, '20261002', '20261002']
      ])
    }
    expect(nativeShow).not.toHaveBeenCalled()
  })

  it('rejects the whole scrape if a later account reaches an unprovable single-day limit', async () => {
    loadRuntime(null)
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      const parsed = new URL(url)
      if (!parsed.pathname.endsWith('/current-account/transactions') || parsed.searchParams.get('accountId') !== '12-702-1002') return await implementation(url, init)
      const rows = Array.from({ length: 1000 }, () => ({ eventAmount: 1, eventActivityTypeCode: 2, formattedEventDate: '2026-10-01T00:00:00.000Z', activityDescription: 'model', transactionType: 'REGULAR', rejectedDataEventPertainingIndication: 'N' }))
      return { status: 200, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ transactions: rows }) }
    })
    await expect(scrape({ ...options, fromDate: new Date('2026-10-01T00:00:00+02:00'), toDate: new Date('2026-10-01T23:59:59+02:00') })).rejects.toThrow(/complete history/)
    expect(dataApi.currentData.auth.cookieHeader).toContain('fresh-rotated')
    expect(nativeShow).not.toHaveBeenCalled()
  })

  it('keeps skipped account metadata and loads only the other account history', async () => {
    loadRuntime(null)
    global.ZenMoney.isAccountSkipped.mockImplementation(id => id === '12-702-1001')
    const result = await scrape(options)
    expect(result.accounts).toHaveLength(2)
    const histories = global.ZenMoney.fetch.mock.calls.map(([url]) => new URL(url)).filter(url => url.pathname.endsWith('/current-account/transactions'))
    expect(histories.map(url => url.searchParams.get('accountId'))).toEqual(['12-702-1002'])
  })

  it.each([false, true])('filters exact inclusive edges without imposing now on an unbounded upper date: %s', unbounded => {
    return (async () => {
      loadRuntime(null)
      const implementation = global.ZenMoney.fetch.getMockImplementation()
      global.ZenMoney.fetch.mockImplementation(async (url, init) => {
        if (!new URL(url).pathname.endsWith('/current-account/transactions')) return await implementation(url, init)
        const transactions = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2030-01-01'].map((day, index) => ({
          eventAmount: index + 1, eventActivityTypeCode: 1, formattedEventDate: day + 'T00:00:00.000Z', activityDescription: 'model', transactionType: 'REGULAR', rejectedDataEventPertainingIndication: 'N'
        }))
        return { status: 200, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ transactions }) }
      })
      const result = await scrape({ ...options, fromDate: new Date('2026-10-02T00:00:00+02:00'), toDate: unbounded ? null : new Date('2026-10-03T00:00:00+02:00') })
      expect(result.transactions.map(transaction => transaction.movements[0].sum)).toEqual(unbounded ? [2, 3, 4, 5, 2, 3, 4, 5] : [2, 3, 2, 3])
    })()
  })

  it('documents safe lower-bound over-inclusion for an IDT-midnight start in the legacy frame', async () => {
    loadRuntime(null)
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    const days = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      const parsed = new URL(url)
      if (!parsed.pathname.endsWith('/current-account/transactions')) return await implementation(url, init)
      expect(parsed.searchParams.get('retrievalStartDate')).toBe('20260930')
      expect(parsed.searchParams.get('retrievalEndDate')).toBe('20261002')
      return {
        status: 200,
        url,
        headers: new NativeHeaders(),
        text: async () => JSON.stringify({
          transactions: days.map(day => ({
            eventAmount: 7, eventActivityTypeCode: 1, formattedEventDate: `${day}T00:00:00.000Z`, activityDescription: 'model', transactionType: 'REGULAR', rejectedDataEventPertainingIndication: 'N'
          }))
        })
      }
    })
    const result = await scrape({ ...options, fromDate: new Date('2026-10-01T00:00:00+03:00'), toDate: new Date('2026-10-02T23:59:59+03:00') })
    // This tests the existing fixed-offset direction, not bank DST semantics.
    // The IDT 00:00-01:00 transport upper bound remains a release-evidence gate.
    expect(result.transactions).toEqual([1001, 1002].flatMap(number => days.slice(1).map(day => ({
      hold: false,
      date: new Date(`${day}T00:00:00.000+02:00`),
      movements: [{ id: null, account: { id: `12-702-${number}` }, invoice: null, sum: 7, fee: 0 }],
      merchant: { country: null, city: null, title: 'model', mcc: null, location: null },
      comment: null
    }))))
    expect(nativeShow).not.toHaveBeenCalled()
  })

  it('keeps the first calendar day when the host passes a UTC midnight boundary', async () => {
    loadRuntime(null)
    const financialDiagnostics = {
      arrearsAmount: 1,
      arrearTotalAmount: 2,
      arrearsLinkageAmount: 3,
      prepaymentCommissionTotalAmount: 4,
      paymentWithoutArrears: 5,
      paymentAmount: 6,
      nextPaymentAmount: 7,
      principalBalanceAmount: 8,
      principalLinkageAmount: 9,
      amountAndLinkageOfPrincipal: 10,
      interestLinkageAmount: 11,
      interestAndLinkageTotalAmount: 12,
      deferredInterestAmount: 13,
      deferredInterestLinkageAmount: 14,
      amountAndLinkageOfInterestDeferred: 15,
      linkageBaseDescription: 'MODEL_INDEX',
      timeUnitDescription: 'MODEL_DAYS',
      differentDateIndication: 'N',
      eventId: 42,
      recordNumber: 117,
      tableNumber: 5,
      code: 'STEPUPOTP',
      selectorProbe: { currencyCode: { code: 19 }, detailedAccountTypeCode: { code: 142 } },
      selectorArrayProbe: { currencyCode: [{ code: 19 }] }
    }
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      if (!new URL(url).pathname.endsWith('/current-account/transactions')) return await implementation(url, init)
      return {
        status: 200,
        url,
        headers: new NativeHeaders(),
        text: async () => JSON.stringify({
          transactions: [{
            eventAmount: 9,
            eventActivityTypeCode: 1,
            formattedEventDate: '2026-10-01T00:00:00.000Z',
            transactionType: 'REGULAR',
            rejectedDataEventPertainingIndication: 'N',
            activityDescription: 'model',
            // Mixed synthetic fields below probe the shared log sanitizer only;
            // they are not a discovered bank transaction/deposit schema.
            ...financialDiagnostics,
            activityTypeCode: 1,
            referenceNumber: 123,
            serialNumber: 2,
            commentExistenceSwitch: 1,
            interestPaymentDescription: 'MODEL_UNSUPPORTED_PAYOUT',
            depositingMethodDescription: 'MODEL_METHOD',
            depositSerialId: 1234,
            creditSerialNumber: 1,
            transactionResultCode: 204,
            numItemsPerPage: 0,
            retrievalMinDate: 0,
            formattedRetrievalMinDate: null,
            retrievalMaxDate: 0,
            outputArrayRecordSum3: 5,
            recordSerialNumber: 35590,
            expendedExecutingDate: '2020030535590',
            contraBankNumber: 12,
            contraBranchNumber: 469,
            contraAccountNumber: 999999,
            internalLinkCode: 0,
            loanBalanceAmount: 10,
            actualPrincipalBalance: 8,
            interestAmount: 2,
            startDate: 20190600,
            endDate: 20490500,
            savingPeriod: 24,
            actualDepositingTotalNumber: 36,
            metadata: { code: 'MODEL_PRIVATE_GENERIC_CODE', messages: [{ messageCode: 330, severity: 'I', messageDescription: 'MODEL_PRIVATE_MESSAGE' }] },
            beneficiaryDetailsData: { name: 'MODEL_PRIVATE_BENEFICIARY' },
            authentication: { otp: { code: 'MODEL_PRIVATE_OTP' }, token: { currencyCode: 'MODEL_PRIVATE_TOKEN' }, paymentAmount: 'MODEL_PRIVATE_PAYMENT' },
            verification: { code: 'MODEL_PRIVATE_VERIFY_CODE', paymentAmount: 'MODEL_PRIVATE_VERIFY_PAYMENT' },
            sms: { code: 'MODEL_PRIVATE_SMS_CODE' },
            session: { code: 'MODEL_PRIVATE_SESSION_CODE' },
            jwt: { code: 'MODEL_PRIVATE_JWT_CODE' },
            customer: { depositSerialId: 'MODEL_PRIVATE_CUSTOMER_ID' },
            comment: 'MODEL_PRIVATE_COMMENT'
          }]
        })
      }
    })
    const result = await scrape({ ...options, fromDate: new Date('2026-10-01T00:00:00Z'), toDate: new Date('2026-10-01T23:59:59Z') })
    expect(result.transactions.map(transaction => transaction.movements[0].sum)).toEqual([9, 9])
    const logs = JSON.stringify(consoleSpies.flatMap(spy => spy.mock.calls))
    for (const [field, value] of Object.entries(financialDiagnostics)) {
      expect(logs).toContain(JSON.stringify(field) + ':' + JSON.stringify(value))
    }
    expect(logs).toContain('"eventAmount":9')
    expect(logs).toContain('"transactionType":"REGULAR"')
    expect(logs).toContain('2026-10-01T00:00:00.000Z')
    expect(logs).toContain('MODEL_UNSUPPORTED_PAYOUT')
    expect(logs).toContain('MODEL_METHOD')
    expect(logs).toContain('"referenceNumber":123')
    expect(logs).toContain('"serialNumber":2')
    expect(logs).toContain('"commentExistenceSwitch":1')
    expect(logs).toContain('"depositSerialId":1234')
    expect(logs).toContain('"creditSerialNumber":1')
    expect(logs).toContain('"activityDescription":"model"')
    for (const expected of ['"transactionResultCode":204', '"numItemsPerPage":0', '"retrievalMinDate":0', '"formattedRetrievalMinDate":null', '"outputArrayRecordSum3":5',
      '"messageCode":330', '"severity":"I"', '"recordSerialNumber":35590', '"expendedExecutingDate":"2020030535590"', '"contraBankNumber":12', '"contraBranchNumber":469',
      '"internalLinkCode":0', '"loanBalanceAmount":10', '"actualPrincipalBalance":8', '"interestAmount":2', '"startDate":20190600', '"endDate":20490500', '"savingPeriod":24', '"actualDepositingTotalNumber":36']) {
      expect(logs).toContain(expected)
    }
    expect(logs).not.toContain('999999')
    expect(logs).not.toContain('MODEL_PRIVATE_MESSAGE')
    expect(logs).not.toContain('MODEL_PRIVATE_BENEFICIARY')
    expect(logs).not.toContain('MODEL_PRIVATE_COMMENT')
    expect(logs).not.toContain('MODEL_PRIVATE_OTP')
    expect(logs).not.toContain('MODEL_PRIVATE_TOKEN')
    expect(logs).not.toContain('MODEL_PRIVATE_PAYMENT')
    expect(logs).not.toContain('MODEL_PRIVATE_CUSTOMER_ID')
    for (const privateValue of ['MODEL_PRIVATE_GENERIC_CODE', 'MODEL_PRIVATE_VERIFY_CODE', 'MODEL_PRIVATE_VERIFY_PAYMENT', 'MODEL_PRIVATE_SMS_CODE', 'MODEL_PRIVATE_SESSION_CODE', 'MODEL_PRIVATE_JWT_CODE']) {
      expect(logs).not.toContain(privateValue)
    }
  })

  it('loads both currency balances of each main account without mixing their histories', async () => {
    loadRuntime(null)
    const implementation = global.ZenMoney.fetch.getMockImplementation()
    global.ZenMoney.fetch.mockImplementation(async (url, init) => {
      const parsed = new URL(url)
      if (!parsed.pathname.startsWith('/ServerServices/foreign-currency/')) return await implementation(url, init)
      const id = parsed.searchParams.get('accountId')
      const balances = [[19, 142, 'USD'], [100, 143, 'EUR']].map(([code, detail, instrument]) => ({
        currencyCode: code,
        detailedAccountTypeCode: detail,
        currencySwiftCode: instrument,
        currencyLongDescription: instrument,
        currentBalance: 20,
        transactions: [{ eventAmount: id.endsWith('1001') ? 7 : 9, eventActivityTypeCode: 1, formattedEventDate: '2026-09-15T00:00:00.000Z', activityDescription: instrument, transactionType: 'REGULAR', rejectedDataEventPertainingIndication: 'N', currencySwiftCode: instrument }]
      }))
      return { status: 200, url, headers: new NativeHeaders(), text: async () => JSON.stringify({ balancesAndLimitsDataList: balances }) }
    })
    const result = await scrape(options)
    expect(result.accounts.map(account => [account.id, account.instrument])).toEqual([
      ['12-702-1001', 'ILS'], ['12-702-1001142', 'USD'], ['12-702-1001143', 'EUR'],
      ['12-702-1002', 'ILS'], ['12-702-1002142', 'USD'], ['12-702-1002143', 'EUR']
    ])
    expect(result.transactions.map(transaction => [transaction.movements[0].account.id, transaction.movements[0].sum])).toEqual([
      ['12-702-1001142', 7], ['12-702-1001143', 7], ['12-702-1002142', 9], ['12-702-1002143', 9]
    ])
  })

  it.each([false, true])('awaits auth/cookie persistence before first-run advice and preserves its failure (%s)', failsAlert => {
    return (async () => {
      loadRuntime(null)
      const originalSaveData = global.ZenMoney.saveData.bind(global.ZenMoney)
      const originalSaveCookies = global.ZenMoney.saveCookies.bind(global.ZenMoney)
      let savedData = false
      let savedCookies = false
      const dataSave = jest.spyOn(global.ZenMoney, 'saveData').mockImplementation(async () => { await originalSaveData(); savedData = true })
      const cookieSave = jest.spyOn(global.ZenMoney, 'saveCookies').mockImplementation(async () => { await originalSaveCookies(); savedCookies = true })
      const failure = new Error('model first-run advice failed')
      global.ZenMoney.alert = jest.fn(async () => {
        expect(savedData).toBe(true)
        expect(savedCookies).toBe(true)
        expect(dataApi.currentData.auth.cookieHeader).toContain('SMSESSION=fresh-rotated')
        expect(nativeCookies.some(cookie => (cookie.key ?? cookie.name) === 'SMSESSION' && cookie.value === 'fresh-rotated')).toBe(true)
        if (failsAlert) throw failure
      })
      try {
        const operation = scrape({ ...options, isFirstRun: true, isInBackground: false })
        if (failsAlert) await expect(operation).rejects.toBe(failure)
        else {
          await expect(operation).resolves.toEqual({
            accounts: [1001, 1002].map(number => ({ id: `12-702-${number}`, type: 'checking', title: `*${number} חשבון נוכחי`, instrument: 'ILS', syncID: [`12-702-${number}`], balance: 100, creditLimit: 0 })),
            transactions: []
          })
        }
        expect(global.ZenMoney.alert).toHaveBeenCalledTimes(1)
        expect(nativeShow).not.toHaveBeenCalled()
      } finally {
        dataSave.mockRestore()
        cookieSave.mockRestore()
      }
    })()
  })

  it('does not show first-run advice when cookie persistence fails', async () => {
    loadRuntime(null)
    const failure = new Error('model cookie persistence failed')
    const cookieSave = jest.spyOn(global.ZenMoney, 'saveCookies').mockRejectedValue(failure)
    global.ZenMoney.alert = jest.fn()
    try {
      await expect(scrape({ ...options, isFirstRun: true, isInBackground: false })).rejects.toBe(failure)
      expect(global.ZenMoney.alert).not.toHaveBeenCalled()
    } finally { cookieSave.mockRestore() }
  })

  it.each([undefined, null, new Date('invalid')])('rejects a missing/invalid start instead of silently loading three months: %s', fromDate => {
    return (async () => {
      loadRuntime(null)
      await expect(scrape({ ...options, preferences: { startDate: '2018-01-01' }, fromDate })).rejects.toThrow(/interval/)
      expect(nativeRestoreCookies).not.toHaveBeenCalled()
      expect(global.ZenMoney.fetch).not.toHaveBeenCalled()
      expect(nativeShow).not.toHaveBeenCalled()
    })()
  })
})
