/* eslint-disable @typescript-eslint/no-var-requires */

describe('hapoalim api runtime harness', () => {
  let login
  let fetchMock
  let fetchJsonMock
  let consoleSpies

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    consoleSpies = ['debug', 'info', 'log', 'warn', 'error'].map(method =>
      jest.spyOn(console, method).mockImplementation(() => {})
    )

    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
      headers: {},
      body: 'window.bnhpApp = { restContext: "/pib" }'
    })
    fetchJsonMock = jest.fn().mockResolvedValue({
      status: 200,
      url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he',
      headers: {},
      body: [{ accountNumber: '1' }, { accountNumber: '2' }]
    })

    jest.doMock('../../../common/network', () => {
      const actual = jest.requireActual('../../../common/network')
      return {
        ...actual,
        fetch: fetchMock,
        fetchJson: fetchJsonMock,
        ParseError: class ParseError extends Error {}
      }
    })
  })

  afterEach(() => {
    for (const spy of consoleSpies) {
      spy.mockRestore()
    }
  })

  it('does not log authenticated portal HTML using the real network helper', async () => {
    jest.dontMock('../../../common/network')
    const originalFetch = global.fetch
    const marker = 'SENSITIVE_PORTAL_TEST_MARKER'
    global.fetch = jest.fn(async url => ({
      status: 200,
      url,
      headers: new Map([['content-type', url.includes('/accounts?') ? 'application/json' : 'text/html']]),
      text: async () => url.includes('/accounts?') ? '[]' : `<html>${marker}<script>restContext: "/pib"</script></html>`
    }))
    global.ZenMoney = {
      getCookies: jest.fn().mockResolvedValue([
        { name: 'SMSESSION', value: 'fictional-session', domain: '.bankhapoalim.co.il', path: '/' }
      ])
    }
    try {
      const { recoverAuthFromCookieStore } = require('../api')
      expect((await recoverAuthFromCookieStore(null)).restContext).toBe('pib')
      const logs = JSON.stringify(consoleSpies.flatMap(spy => spy.mock.calls))
      expect(logs).not.toContain(marker)
      expect(logs).not.toContain('fictional-session')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    } finally {
      global.fetch = originalFetch
    }
  })

  it.each([false, true])('terminates an unresponsive native WebView (configured empty jar: %s)', async configured => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    const getCookieString = jest.fn().mockResolvedValue('')
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn(),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        if (configured) options.configure({ cookieJar: { getCookieString } })
      })
    }
    login = require('../api').login
    const outcome = login().then(auth => ({ auth }), error => ({ error }))
    try {
      for (let second = 0; second < 600; second++) {
        jest.advanceTimersByTime(1000)
        for (let i = 0; i < 60; i++) await Promise.resolve()
      }
      expect(await outcome).toMatchObject({ error: { message: expect.stringContaining('WebView login timed out'), allowRetry: false } })
      expect(fetchJsonMock).not.toHaveBeenCalled()
      expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
      expect(jest.getTimerCount()).toBe(0)
      const readCount = getCookieString.mock.calls.length
      await onRequest({ url: 'https://login.bankhapoalim.co.il/portalserver/HomePage', headers: { cookie: 'SMSESSION=late' } }, jest.fn())
      onComplete(null, { auth: { cookieHeader: 'SMSESSION=late' } })
      for (let i = 0; i < 40; i++) await Promise.resolve()
      expect(getCookieString).toHaveBeenCalledTimes(readCount)
      expect(fetchJsonMock).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  it.each(['cookie jar', 'accounts probe'])('releases initial navigation while the %s is pending', async (pendingOperation) => {
    const originalSetTimeout = global.setTimeout
    const originalClearTimeout = global.clearTimeout
    global.setTimeout = jest.fn(() => 1)
    global.clearTimeout = jest.fn()
    let onRequest
    let onComplete
    const getCookieString = jest.fn(() => pendingOperation === 'cookie jar'
      ? new Promise(() => {})
      : Promise.resolve('TS=prelogin; XSRF-TOKEN=prelogin'))
    if (pendingOperation === 'accounts probe') {
      fetchJsonMock.mockImplementationOnce(() => new Promise(() => {}))
    }
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString } })
      })
    }
    login = require('../api').login
    const authPromise = login()
    try {
      let navigationReleased = false
      const mode = onRequest({
        url: 'https://login.bankhapoalim.co.il/cgi-bin/poalwwwc?reqName=getLogonPage',
        headers: {}
      }, (error, result) => onComplete(error, result))
      Promise.resolve(mode).then(result => {
        expect(result).toBeUndefined()
        navigationReleased = true
      })
      for (let i = 0; i < 40; i++) {
        await Promise.resolve()
      }
      expect(getCookieString).toHaveBeenCalled()
      if (pendingOperation === 'accounts probe') {
        expect(fetchJsonMock).toHaveBeenCalled()
      }
      expect(navigationReleased).toBe(true)
    } finally {
      onComplete(null, {
        auth: {
          cookieHeader: 'SMSESSION=fresh; XSRF-TOKEN=fresh',
          xsrfToken: 'fresh',
          restContext: 'pib'
        }
      })
      await authPromise
      global.setTimeout = originalSetTimeout
      global.clearTimeout = originalClearTimeout
    }
  })

  it.each(['cookie jar', 'accounts probe'])('keeps login open after a slow %s without overlapping probes and ignores its late snapshot', async (pendingOperation) => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    let resolvePending
    const pending = new Promise(resolve => { resolvePending = resolve })
    const getCookieString = jest.fn(() => pendingOperation === 'cookie jar'
      ? pending
      : Promise.resolve('TS=prelogin; XSRF-TOKEN=prelogin'))
    if (pendingOperation === 'accounts probe') {
      fetchJsonMock.mockImplementationOnce(() => pending)
    }
    const nativeClose = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString } })
      })
    }
    login = require('../api').login
    const outcome = login().then(auth => ({ auth }), error => ({ error }))
    let settled = false
    outcome.then(() => { settled = true })
    try {
      expect(await onRequest({
        url: 'https://login.bankhapoalim.co.il/cgi-bin/poalwwwc?reqName=getLogonPage',
        headers: {}
      }, nativeClose)).toBeUndefined()
      for (let i = 0; i < 40; i++) {
        await Promise.resolve()
      }
      jest.advanceTimersByTime(15000)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      expect(settled).toBe(false)
      expect(nativeClose).not.toHaveBeenCalled()
      expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
      const readsBeforeLateResult = getCookieString.mock.calls.length
      const probesBeforeLateResult = fetchJsonMock.mock.calls.length
      for (let second = 0; second < 3; second++) {
        await onRequest({ url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he', headers: { cookie: 'TS=prelogin; XSRF-TOKEN=prelogin' } }, nativeClose)
        jest.advanceTimersByTime(1000)
        for (let i = 0; i < 40; i++) await Promise.resolve()
      }
      expect(getCookieString).toHaveBeenCalledTimes(readsBeforeLateResult)
      expect(fetchJsonMock).toHaveBeenCalledTimes(probesBeforeLateResult)
      resolvePending(pendingOperation === 'cookie jar'
        ? 'SMSESSION=late; XSRF-TOKEN=late'
        : { status: 200, headers: {}, body: [{ accountNumber: 'late' }] })
      for (let i = 0; i < 40; i++) {
        await Promise.resolve()
      }
      expect(nativeClose).not.toHaveBeenCalled()
      expect(getCookieString).toHaveBeenCalledTimes(readsBeforeLateResult)
      await onRequest({ url: 'https://login.bankhapoalim.co.il/portalserver/HomePage', headers: { cookie: 'SMSESSION=fresh; XSRF-TOKEN=fresh' } }, nativeClose)
      const result = await outcome
      expect(result.auth.cookieHeader).toContain('SMSESSION=fresh')
      expect(result.auth.cookieHeader).not.toContain('late')
      expect(nativeClose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('rebinds polling to the real cookie jar when native request precedes configuration', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let configure
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn(),
      openWebView: jest.fn((url, headers, onRequest, onComplete, options) => {
        configure = options.configure
        onRequest({ url, headers: {} }, onComplete)
      })
    }
    const result = require('../api').login()
    try {
      for (let i = 0; i < 40; i++) await Promise.resolve()
      const getCookieString = jest.fn().mockResolvedValue('SMSESSION=configured')
      await configure({ cookieJar: { getCookieString } })
      jest.advanceTimersByTime(1000)
      for (let i = 0; i < 80; i++) await Promise.resolve()
      expect((await result).cookieHeader).toContain('SMSESSION=configured')
      expect(getCookieString).toHaveBeenCalled()
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it.each(['cookie jar', 'accounts probe'])('bounds a permanently pending %s by the overall login deadline', async pendingOperation => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let resolvePending
    let onRequest
    let onComplete
    const pending = new Promise(resolve => { resolvePending = resolve })
    const getCookieString = jest.fn(() => pendingOperation === 'cookie jar'
      ? pending
      : Promise.resolve('TS=prelogin; XSRF-TOKEN=prelogin'))
    if (pendingOperation === 'accounts probe') fetchJsonMock.mockReturnValueOnce(pending)
    const close = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn(),
      saveCookies: jest.fn(),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString } })
      })
    }
    const outcome = require('../api').login().then(auth => ({ auth }), error => ({ error }))
    try {
      await onRequest({ url: 'https://login.bankhapoalim.co.il/ng-portals/auth/he/', headers: {} }, close)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      jest.advanceTimersByTime(15000)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      expect(close).not.toHaveBeenCalled()
      jest.advanceTimersByTime(585000)
      expect(await outcome).toMatchObject({ error: { message: expect.stringContaining('WebView login timed out') } })
      expect(close).toHaveBeenCalledTimes(1)
      const reads = getCookieString.mock.calls.length
      const probes = fetchJsonMock.mock.calls.length
      resolvePending(pendingOperation === 'cookie jar' ? 'SMSESSION=late' : { status: 200, headers: {}, body: [] })
      for (let i = 0; i < 40; i++) await Promise.resolve()
      expect(getCookieString).toHaveBeenCalledTimes(reads)
      expect(fetchJsonMock).toHaveBeenCalledTimes(probes)
      expect(close).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('does not expose raw optional-endpoint ParseError response data in logs', async () => {
    jest.dontMock('../../../common/network')
    const originalFetch = global.fetch
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
    try {
      const { fetchAccounts } = require('../api')
      expect(await fetchAccounts({ cookieHeader: 'SMSESSION=fictional', restContext: 'pib' })).toHaveLength(1)
      const logs = JSON.stringify(consoleSpies.flatMap(spy => spy.mock.calls))
      expect(logs).not.toContain(marker)
      expect(logs).toContain('optional account endpoint failed: foreign currency')
    } finally {
      global.fetch = originalFetch
    }
  })

  it('shares a pending cookie read across requests and never overwrites newer header auth', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    let resolveCookieRead
    const getCookieString = jest.fn(() => new Promise(resolve => { resolveCookieRead = resolve }))
    const nativeClose = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString } })
      })
    }
    login = require('../api').login
    const authPromise = login()
    try {
      for (let i = 0; i < 10; i++) {
        expect(await onRequest({
          url: 'https://login.bankhapoalim.co.il/cgi-bin/poalwwwc?reqName=getLogonPage',
          headers: {}
        }, nativeClose)).toBeUndefined()
      }
      expect(getCookieString).toHaveBeenCalledTimes(1)
      expect(fetchJsonMock).not.toHaveBeenCalled()
      expect(await onRequest({
        url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
        headers: { Cookie: 'SMSESSION=fresh; XSRF-TOKEN=fresh' }
      }, nativeClose)).toBeUndefined()
      resolveCookieRead('SMSESSION=stale; XSRF-TOKEN=stale')
      for (let i = 0; i < 40; i++) {
        await Promise.resolve()
      }
      const auth = await authPromise
      expect(auth.cookieHeader).toContain('SMSESSION=fresh')
      expect(auth.cookieHeader).not.toContain('stale')
      expect(getCookieString).toHaveBeenCalledTimes(1)
      expect(nativeClose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('verifies fresh request cookies while a WebView cookie-jar read never settles', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    const getCookieString = jest.fn(() => new Promise(() => {}))
    const close = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn(),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString } })
      })
    }
    const outcome = require('../api').login()
    try {
      await onRequest({ url: 'https://login.bankhapoalim.co.il/ng-portals/auth/he/', headers: {} }, close)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      jest.advanceTimersByTime(15000)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      expect(close).not.toHaveBeenCalled()
      await onRequest({ url: 'https://login.bankhapoalim.co.il/portalserver/HomePage', headers: { cookie: 'SMSESSION=fresh; XSRF-TOKEN=fresh' } }, close)
      expect((await outcome).cookieHeader).toContain('SMSESSION=fresh')
      expect(close).toHaveBeenCalledTimes(1)
      expect(getCookieString).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('does not discard a verified session under steady non-auth cookie rotation', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    fetchJsonMock.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ status: 200, headers: { 'set-cookie': 'SMSESSION=rotated; Path=/' }, body: [] }), 1000)
    }))
    const close = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn(),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString: jest.fn().mockResolvedValue('') } })
      })
    }
    const outcome = require('../api').login()
    try {
      await onRequest({ url: 'https://login.bankhapoalim.co.il/portalserver/HomePage', headers: { cookie: 'SMSESSION=fresh; XSRF-TOKEN=fresh; TS=0' } }, close)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      for (let tick = 1; tick <= 2; tick++) {
        await onRequest({ url: 'https://login.bankhapoalim.co.il/ServerServices/poll', headers: { cookie: `SMSESSION=fresh; XSRF-TOKEN=fresh; TS=${tick}` } }, close)
        jest.advanceTimersByTime(500)
        for (let i = 0; i < 60; i++) await Promise.resolve()
      }
      expect(close).toHaveBeenCalledTimes(1)
      const auth = await outcome
      expect(auth.cookieHeader).toContain('SMSESSION=rotated')
      expect(auth.cookieHeader).toContain('TS=2')
      expect(fetchJsonMock).toHaveBeenCalledTimes(2)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('still rejects accounts verification for a superseded SMSESSION', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    let resolveFirstProbe
    let resolveSecondProbe
    fetchJsonMock.mockReturnValueOnce(new Promise(resolve => { resolveFirstProbe = resolve }))
      .mockReturnValueOnce(new Promise(resolve => { resolveSecondProbe = resolve }))
    const close = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn(),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString: jest.fn().mockResolvedValue('') } })
      })
    }
    const outcome = require('../api').login()
    try {
      await onRequest({ url: 'https://login.bankhapoalim.co.il/portalserver/HomePage', headers: { cookie: 'SMSESSION=first; XSRF-TOKEN=first' } }, close)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      await onRequest({ url: 'https://login.bankhapoalim.co.il/ServerServices/poll', headers: { cookie: 'SMSESSION=second; XSRF-TOKEN=second' } }, close)
      resolveFirstProbe({ status: 200, headers: { 'set-cookie': 'SMSESSION=obsolete; Path=/' }, body: [] })
      for (let i = 0; i < 60; i++) await Promise.resolve()
      expect(close).not.toHaveBeenCalled()
      expect(fetchJsonMock).toHaveBeenCalledTimes(2)
      expect(fetchJsonMock.mock.calls[1][1].headers.Cookie).toContain('SMSESSION=second')
      resolveSecondProbe({ status: 200, headers: {}, body: [] })
      const auth = await outcome
      expect(auth.cookieHeader).toContain('SMSESSION=second')
      expect(auth.cookieHeader).not.toContain('obsolete')
      expect(fetchJsonMock.mock.calls[1][1].headers.Cookie).toContain('SMSESSION=second')
      expect(close).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('recovers header auth on Back despite an independently hung cookie jar', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    let resolveAccounts
    fetchJsonMock.mockReturnValueOnce(new Promise(resolve => { resolveAccounts = resolve }))
    const getCookieString = jest.fn(() => new Promise(() => {}))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn(),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString } })
      })
    }
    const outcome = require('../api').login()
    try {
      await onRequest({ url: 'https://login.bankhapoalim.co.il/ng-portals/auth/he/', headers: {} }, onComplete)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      jest.advanceTimersByTime(15000)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      await onRequest({ url: 'https://login.bankhapoalim.co.il/ServerServices/poll', headers: { cookie: 'SMSESSION=fresh' } }, onComplete)
      onComplete(new Error('Back'))
      for (let i = 0; i < 40; i++) await Promise.resolve()
      resolveAccounts({ status: 200, headers: {}, body: [] })
      expect((await outcome).cookieHeader).toContain('SMSESSION=fresh')
      expect(fetchJsonMock).toHaveBeenCalledTimes(2)
      expect(getCookieString).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('does not expose a JSON parser body prefix in the propagated accounts error', async () => {
    jest.dontMock('../../../common/network')
    const originalFetch = global.fetch
    const marker = 'FICTIONAL_PARSE_SECRET_MARKER'
    global.fetch = jest.fn(async url => ({
      status: 200,
      url: `${url}&token=${marker}`,
      headers: new Map([['content-type', 'text/html'], ['set-cookie', `SMSESSION=${marker}; Path=/`]]),
      text: async () => `<html>${marker}</html>`
    }))
    global.ZenMoney = {}
    try {
      const { fetchAccounts } = require('../api')
      const error = await fetchAccounts({ cookieHeader: 'SMSESSION=fictional' }).catch(error => error)
      expect(error.message).toBe('Bank Hapoalim returned an unexpected response instead of JSON.')
      expect(error.response).toBeUndefined()
      expect(error.cause).toBeUndefined()
      expect(JSON.stringify(error)).not.toContain(marker)
      expect(JSON.stringify(consoleSpies.flatMap(spy => spy.mock.calls))).not.toContain(marker)
    } finally {
      global.fetch = originalFetch
    }
  })

  it('discards a stale cookie snapshot while the WebView is still open', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    let resolveCookieRead
    const getCookieString = jest.fn().mockResolvedValue('')
      .mockImplementationOnce(() => new Promise(resolve => { resolveCookieRead = resolve }))
    const nativeClose = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString } })
      })
    }
    login = require('../api').login
    const authPromise = login()
    try {
      await onRequest({
        url: 'https://login.bankhapoalim.co.il/cgi-bin/poalwwwc?reqName=getLogonPage',
        headers: {}
      }, nativeClose)
      await onRequest({
        url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he',
        headers: { Cookie: 'TS=fresh; XSRF-TOKEN=fresh' }
      }, nativeClose)
      resolveCookieRead('SMSESSION=stale; XSRF-TOKEN=stale')
      for (let i = 0; i < 40; i++) {
        await Promise.resolve()
      }
      expect(fetchJsonMock).not.toHaveBeenCalled()
      expect(nativeClose).not.toHaveBeenCalled()
      jest.advanceTimersByTime(1000)
      const auth = await authPromise
      expect(auth.cookieHeader).toContain('TS=fresh')
      expect(auth.cookieHeader).not.toContain('stale')
      expect(fetchJsonMock.mock.calls[0][1].headers.Cookie).toContain('TS=fresh')
      expect(nativeClose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('rechecks session headers on SPA requests after the portal probe was not ready and jar reads are slow', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    fetchJsonMock.mockResolvedValueOnce({ status: 401, headers: {}, body: {} })
      .mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve({ status: 200, headers: {}, body: [] }), 900)
      }))
    const close = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn(),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({
          cookieJar: {
            getCookieString: jest.fn(() => new Promise(resolve => {
              setTimeout(() => resolve('SMSESSION=fresh; XSRF-TOKEN=fresh; TS=jar'), 600)
            }))
          }
        })
      })
    }
    const outcome = require('../api').login()
    try {
      await onRequest({ url: 'https://login.bankhapoalim.co.il/portalserver/HomePage', headers: { cookie: 'SMSESSION=fresh; XSRF-TOKEN=fresh; TS=0' } }, close)
      for (let i = 0; i < 80; i++) await Promise.resolve()
      expect(close).not.toHaveBeenCalled()
      for (let tick = 1; tick <= 5 && close.mock.calls.length === 0; tick++) {
        await onRequest({ url: 'https://login.bankhapoalim.co.il/ServerServices/poll', headers: { cookie: `SMSESSION=fresh; XSRF-TOKEN=fresh; TS=${tick}` } }, close)
        jest.advanceTimersByTime(300)
        for (let i = 0; i < 80; i++) await Promise.resolve()
      }
      expect(close).toHaveBeenCalledTimes(1)
      expect((await outcome).cookieHeader).toContain('SMSESSION=fresh')
      expect(fetchJsonMock).toHaveBeenCalledTimes(3)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it.each(['resolves', 'times out'])('waits for a portal accounts probe after native close until it %s', async (completion) => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let onRequest
    let onComplete
    let resolveAccounts
    fetchJsonMock.mockImplementationOnce(() => new Promise(resolve => { resolveAccounts = resolve }))
    const nativeClose = jest.fn((error, result) => onComplete(error, result))
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, requestCallback, completeCallback, options) => {
        onRequest = requestCallback
        onComplete = completeCallback
        options.configure({ cookieJar: { getCookieString: jest.fn().mockResolvedValue('') } })
      })
    }
    login = require('../api').login
    const outcome = login().then(auth => ({ auth }), error => ({ error }))
    try {
      expect(await onRequest({
        url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
        headers: { Cookie: 'SMSESSION=fresh; XSRF-TOKEN=fresh' }
      }, nativeClose)).toBeUndefined()
      onComplete(new Error('WebView closed'))
      for (let i = 0; i < 40; i++) {
        await Promise.resolve()
      }
      expect(fetchJsonMock).toHaveBeenCalledTimes(1)
      expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
      if (completion === 'resolves') {
        resolveAccounts({
          status: 200,
          headers: { 'set-cookie': 'SMSESSION=rotated; Path=/' },
          body: [{ accountNumber: '1' }]
        })
        const result = await outcome
        expect(result.auth.cookieHeader).toContain('SMSESSION=rotated')
        expect(fetchJsonMock).toHaveBeenCalledTimes(2)
        expect(fetchJsonMock.mock.calls[1][1].headers.Cookie).toContain('SMSESSION=rotated')
      } else {
        jest.advanceTimersByTime(15000)
        const result = await outcome
        expect(result.error.message).toContain('accounts probe timed out')
        expect(fetchJsonMock).toHaveBeenCalledTimes(1)
        resolveAccounts({ status: 200, headers: {}, body: [{ accountNumber: 'late' }] })
        for (let i = 0; i < 40; i++) {
          await Promise.resolve()
        }
      }
      expect(nativeClose).not.toHaveBeenCalled()
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('recovers native TemporaryError completions that are not internal probe timeouts', async () => {
    const { TemporaryError } = require('../../../errors')
    global.ZenMoney = {
      features: { webViewConfiguration: true },
      getCookies: jest.fn().mockResolvedValue([
        { domain: '.bankhapoalim.co.il', name: 'SMSESSION', value: 'store-session' }
      ]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, onRequest, onComplete) => {
        onComplete(new TemporaryError('Native WebView closed'))
      })
    }
    login = require('../api').login
    const auth = await login()
    expect(auth.cookieHeader).toContain('SMSESSION=store-session')
    expect(global.ZenMoney.getCookies).toHaveBeenCalled()
  })

  it('closes the configured WebView from cookie-jar polling through the actual network helper', async () => {
    const originalSetTimeout = global.setTimeout
    const originalClearTimeout = global.clearTimeout
    const scheduledCallbacks = []
    let cookieJarReads = 0

    global.setTimeout = jest.fn((callback, delay) => {
      if (delay !== 1000) {
        return originalSetTimeout(callback, delay)
      }
      scheduledCallbacks.push(callback)
      return scheduledCallbacks.length
    })
    global.clearTimeout = jest.fn(originalClearTimeout)

    global.ZenMoney = {
      features: {
        webViewConfiguration: true
      },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, onRequest, onComplete, options) => {
        const webView = {
          cookieJar: {
            getCookieString: jest.fn(async (cookieUrl) => {
              if (cookieUrl.includes('/ServerServices/general/accounts')) {
                cookieJarReads++
                return cookieJarReads >= 2
                  ? 'TS=poll-ts; XSRF-TOKEN=poll-xsrf'
                  : ''
              }
              return ''
            })
          }
        }

        Promise.resolve(options.configure(webView))
          .then(async () => {
            const mode = await onRequest({
              url: 'https://static.example.com/challenge',
              headers: {}
            }, (error, result) => onComplete(error, result))
            expect(mode).toBeUndefined()
          })
          .catch(error => onComplete(error))
      })
    }

    login = require('../api').login

    try {
      const authPromise = login()
      let completed = false
      authPromise.then(() => { completed = true })

      expect(scheduledCallbacks).toHaveLength(1)
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 40; j++) {
          await Promise.resolve()
        }
        if (!completed) {
          expect(scheduledCallbacks.length).toBeGreaterThan(0)
          await scheduledCallbacks.shift()()
        } else {
          break
        }
      }

      const auth = await authPromise
      expect(fetchJsonMock).toHaveBeenCalled()
      expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
      expect(auth.cookieHeader).toContain('TS=poll-ts')
      expect(auth.cookieHeader).toContain('XSRF-TOKEN=poll-xsrf')
      expect(auth.restContext).toBe('pib')
    } finally {
      global.setTimeout = originalSetTimeout
      global.clearTimeout = originalClearTimeout
    }
  })

  it.each([true, false])('recovers configured WebView auth after native close (error completion: %s)', async (errorCompletion) => {
    global.ZenMoney = {
      features: {
        webViewConfiguration: true
      },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, onRequest, onComplete, options) => {
        const webView = {
          cookieJar: {
            getCookieString: jest.fn(async (cookieUrl) => {
              if (cookieUrl.includes('/portalserver/HomePage')) {
                return 'TS=jar-ts; XSRF-TOKEN=jar-xsrf'
              }
              return ''
            })
          }
        }

        Promise.resolve(options.configure(webView))
          .then(async () => {
            await onRequest({
              url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
              headers: {}
            }, () => {})
            onComplete(errorCompletion ? new Error('WebView closed') : null)
          })
          .catch(error => onComplete(error))
      })
    }

    login = require('../api').login

    const auth = await login()

    expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
    expect(fetchJsonMock).toHaveBeenCalled()
    expect(auth.cookieHeader).toContain('TS=jar-ts')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=jar-xsrf')
    expect(auth.restContext).toBe('pib')
  })

  it('keeps the legacy cookie-store recovery path for older app versions', async () => {
    const originalSetTimeout = global.setTimeout

    global.setTimeout = jest.fn((callback) => {
      callback()
      return 1
    })

    global.ZenMoney = {
      features: {},
      getCookies: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { domain: '.bankhapoalim.co.il', name: 'SMSESSION', value: 'closed-session' },
          { domain: '.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'closed-xsrf' }
        ]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, onRequest, onComplete) => {
        onComplete(new Error('WebView closed'))
      })
    }

    login = require('../api').login

    try {
      const auth = await login()

      expect(global.ZenMoney.saveCookies).toHaveBeenCalled()
      expect(global.ZenMoney.getCookies).toHaveBeenCalledTimes(3)
      expect(fetchJsonMock).toHaveBeenCalled()
      expect(auth.cookieHeader).toContain('SMSESSION=closed-session')
      expect(auth.cookieHeader).toContain('XSRF-TOKEN=closed-xsrf')
      expect(auth.restContext).toBe('pib')
    } finally {
      global.setTimeout = originalSetTimeout
    }
  })
})
