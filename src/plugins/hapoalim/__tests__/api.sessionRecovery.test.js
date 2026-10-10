/* eslint-disable @typescript-eslint/no-var-requires */

const ACCOUNTS_URL = 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he'
const PORTAL_URL = 'https://login.bankhapoalim.co.il/portalserver/HomePage'

// [model] Scoped synthetic cookies and envelopes test recovery isolation and deadlines,
// not bank payloads or native Android persistence.
describe('[model] hapoalim silent session recovery', () => {
  let api
  let fetchMock
  let fetchJsonMock
  let webViewMock
  let consoleSpies

  beforeEach(() => {
    jest.resetModules()
    consoleSpies = ['log', 'warn'].map(method => jest.spyOn(console, method).mockImplementation(() => {}))
    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      url: PORTAL_URL,
      headers: {},
      body: 'window.bnhpApp = { restContext: "/pib" }'
    })
    fetchJsonMock = jest.fn().mockResolvedValue({ status: 200, url: ACCOUNTS_URL, headers: {}, body: [] })
    webViewMock = jest.fn()
    global.ZenMoney = {
      getCookies: jest.fn().mockResolvedValue([
        { name: 'SMSESSION', value: 'recovered', domain: 'login.bankhapoalim.co.il', path: '/', expires: null }
      ]),
      saveCookies: jest.fn()
    }
    jest.doMock('../../../common/network', () => ({
      ...jest.requireActual('../../../common/network'),
      fetch: fetchMock,
      fetchJson: fetchJsonMock,
      openWebViewAndInterceptRequest: webViewMock
    }))
    jest.doMock('../../../common/network/cookies', () => ({
      ...jest.requireActual('../../../common/network/cookies'),
      cookieJar: {
        serialize: async () => ({ cookies: (await global.ZenMoney.getCookies()).map(({ name, ...cookie }) => ({ ...cookie, key: name })) })
      }
    }))
    api = require('../api')
  })

  afterEach(() => {
    jest.useRealTimers()
    for (const spy of consoleSpies) {
      spy.mockRestore()
    }
  })

  it.each(['SMSESSION=recovered', 'TS=recovered; XSRF-TOKEN=fresh-xsrf'])('verifies %s without SMSESSION-only assumptions or WebView', async cookieHeader => {
    global.ZenMoney.getCookies.mockResolvedValue(cookieHeader.split('; ').map(cookie => {
      const [name, value] = cookie.split('=')
      return { name, value, domain: '.bankhapoalim.co.il', path: '/' }
    }))
    const storedAuth = { cookieHeader: 'SMSESSION=old', restContext: 'old' }
    const snapshot = { ...storedAuth }
    const recovered = await api.recoverAuthFromCookieStore(storedAuth)
    expect(recovered.cookieHeader).toBe(cookieHeader)
    expect(recovered.restContext).toBe('pib')
    expect(storedAuth).toEqual(snapshot)
    expect(fetchJsonMock).toHaveBeenCalledTimes(1)
    expect(fetchJsonMock).toHaveBeenCalledWith(ACCOUNTS_URL, expect.objectContaining({
      headers: expect.objectContaining({ Cookie: cookieHeader }), log: false
    }))
    expect(webViewMock).not.toHaveBeenCalled()
    expect(global.ZenMoney.saveCookies).not.toHaveBeenCalled()
  })

  it('uses only unexpired cookies matching the accounts host and path', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([
      { name: 'SMSESSION', value: 'expired', domain: 'login.bankhapoalim.co.il', path: '/', expires: '2020-01-01T00:00:00Z' },
      { name: 'SMSESSION', value: 'wrong-path', domain: 'login.bankhapoalim.co.il', path: '/auth' },
      { name: 'SMSESSION', value: 'wrong-host', domain: 'other.bankhapoalim.co.il', path: '/' },
      { name: 'SMSESSION', value: 'valid', domain: '.bankhapoalim.co.il', path: '/ServerServices' },
      { name: 'SMSESSION', value: 'wrong-boundary', domain: 'login.bankhapoalim.co.il', path: '/ServerService' }
    ])
    expect((await api.recoverAuthFromCookieStore(null)).cookieHeader).toBe('SMSESSION=valid')
  })

  it.each([
    ['login.bankhapoalim.co.il', '.bankhapoalim.co.il'],
    ['login.bankhapoalim.co.il', '.login.bankhapoalim.co.il'],
    ['.login.bankhapoalim.co.il', 'bankhapoalim.co.il'],
    ['bankhapoalim.co.il', '.bankhapoalim.co.il'],
    ['.bankhapoalim.co.il', null]
  ].flatMap(([preferred, other]) => [false, true].map(reverse => ({ preferred, other, reverse }))))('uses deterministic host/domain precedence independent of cookie order: $preferred > $other ($reverse)', async ({ preferred, other, reverse }) => {
    const cookies = [
      { name: 'SMSESSION', value: 'preferred', domain: preferred, path: '/' },
      { name: 'SMSESSION', value: 'other', domain: other, path: '/ServerServices/general' }
    ]
    global.ZenMoney.getCookies.mockResolvedValue(reverse ? cookies.reverse() : cookies)
    const persisted = jest.fn()
    expect((await api.recoverAuthFromCookieStore(null, { onAuthUpdate: persisted })).cookieHeader).toBe('SMSESSION=preferred')
    expect(fetchJsonMock).toHaveBeenCalledWith(ACCOUNTS_URL, expect.objectContaining({ headers: expect.objectContaining({ Cookie: 'SMSESSION=preferred' }) }))
    expect(persisted).toHaveBeenCalledWith(expect.objectContaining({ cookieHeader: 'SMSESSION=preferred' }))
  })

  it.each([false, true])('prefers the longer matching cookie path within the same domain (%s)', async reverse => {
    const cookies = [
      { name: 'SMSESSION', value: 'root', domain: 'login.bankhapoalim.co.il', path: '/' },
      { name: 'SMSESSION', value: 'specific', domain: 'login.bankhapoalim.co.il', path: '/ServerServices/general' }
    ]
    global.ZenMoney.getCookies.mockResolvedValue(reverse ? cookies.reverse() : cookies)
    expect((await api.recoverAuthFromCookieStore(null)).cookieHeader).toBe('SMSESSION=specific')
  })

  it('does not probe when the only auth cookie is expired', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([
      { name: 'SMSESSION', value: 'expired', domain: '.bankhapoalim.co.il', path: '/', expires: '2020-01-01T00:00:00Z' }
    ])
    expect(await api.recoverAuthFromCookieStore(null)).toBeNull()
    expect(fetchJsonMock).not.toHaveBeenCalled()
  })

  it('does not treat a malformed shared cookie snapshot as missing auth', async () => {
    const { cookieJar } = require('../../../common/network/cookies')
    jest.spyOn(cookieJar, 'serialize').mockResolvedValue({ cookies: null })
    await expect(api.recoverAuthFromCookieStore(null)).rejects.toMatchObject({ message: 'unexpected cookie store snapshot' })
    expect(fetchJsonMock).not.toHaveBeenCalled()
  })

  it('retains a missing jar XSRF token only for the same SMSESSION without merging stale cookies', async () => {
    const storedAuth = { cookieHeader: 'SMSESSION=recovered; XSRF-TOKEN=same%2Ftoken; obsolete=old', xsrfToken: 'same/token' }
    const recovered = await api.recoverAuthFromCookieStore(storedAuth)
    expect(recovered.cookieHeader).toBe('SMSESSION=recovered; XSRF-TOKEN=same%2Ftoken')
    expect(recovered.xsrfToken).toBe('same/token')
    expect(storedAuth.cookieHeader).toContain('obsolete=old')
  })

  it('does not transfer an old XSRF token into a different jar-only session', async () => {
    const storedAuth = { cookieHeader: 'SMSESSION=other; XSRF-TOKEN=old', xsrfToken: 'old' }
    expect(await api.recoverAuthFromCookieStore(storedAuth)).toBeNull()
    expect(fetchJsonMock).not.toHaveBeenCalled()
    expect(storedAuth.cookieHeader).toBe('SMSESSION=other; XSRF-TOKEN=old')
  })

  it('does not resurrect an expired XSRF token from the snapshot even for the same session', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([
      { name: 'SMSESSION', value: 'recovered', domain: '.bankhapoalim.co.il', path: '/' },
      { name: 'XSRF-TOKEN', value: 'expired', domain: '.bankhapoalim.co.il', path: '/', expires: '2020-01-01T00:00:00Z' }
    ])
    expect(await api.recoverAuthFromCookieStore({ cookieHeader: 'SMSESSION=recovered; XSRF-TOKEN=expired' })).toBeNull()
    expect(fetchJsonMock).not.toHaveBeenCalled()
  })

  it('keeps cookies rotated by verification and portal requests in the recovered snapshot', async () => {
    fetchJsonMock.mockResolvedValue({ status: 200, headers: { 'set-cookie': 'SMSESSION=rotated; Path=/' }, body: [] })
    fetchMock.mockResolvedValue({ status: 200, headers: { 'set-cookie': 'XSRF-TOKEN=rotated-xsrf; Path=/' }, body: 'restContext: "/pib"' })
    const recovered = await api.recoverAuthFromCookieStore(null)
    expect(recovered.cookieHeader).toBe('SMSESSION=rotated; XSRF-TOKEN=rotated-xsrf')
    expect(recovered.xsrfToken).toBe('rotated-xsrf')
    expect(recovered.restContext).toBe('pib')
  })

  it.each([401, 403, 200])('returns no session on bank auth refusal (%s)', async status => {
    fetchJsonMock.mockResolvedValue({ status, url: 'https://login.bankhapoalim.co.il/ng-portals/auth/he/', headers: { 'content-type': 'text/html' }, body: 'login' })
    expect(await api.recoverAuthFromCookieStore(null)).toBeNull()
    expect(fetchJsonMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([200, 429, 500, 503])('preserves a non-auth HTML failure (%s) without cold fallback', async status => {
    fetchJsonMock.mockResolvedValue({ status, url: ACCOUNTS_URL, headers: { 'content-type': 'text/html' }, body: 'maintenance' })
    await expect(api.recoverAuthFromCookieStore(null)).rejects.toMatchObject({ responseSummary: { status } })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(webViewMock).not.toHaveBeenCalled()
  })

  it('accepts only a known login redirect as confirmed expiry', async () => {
    fetchJsonMock.mockResolvedValue({ status: 302, headers: { location: '/ng-portals-bt/auth/he/' }, body: '' })
    expect(await api.recoverAuthFromCookieStore(null)).toBeNull()
  })

  it('does not persist an accounts-only jar when the challenged request still requires OTP', async () => {
    const stored = { cookieHeader: 'SMSESSION=old; native-only=model-cookie', restContext: 'pib' }
    const onAuthUpdate = jest.fn()
    const gate = { responseSummary: { status: 401, errCode: 'STEPUPOTP' } }
    const verify = jest.fn().mockRejectedValue(gate)
    expect(await api.recoverAuthFromCookieStore(stored, { onAuthUpdate, verify })).toBeNull()
    expect(verify).toHaveBeenCalledWith(expect.objectContaining({ cookieHeader: 'SMSESSION=recovered' }))
    expect(onAuthUpdate).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(stored.cookieHeader).toBe('SMSESSION=old; native-only=model-cookie')
  })

  it('persists a silently recovered session only after its challenged request succeeds', async () => {
    const onAuthUpdate = jest.fn()
    const verify = jest.fn(async auth => {
      expect(onAuthUpdate).not.toHaveBeenCalled()
      auth.cookieHeader = 'SMSESSION=verified-rotation'
    })
    expect((await api.recoverAuthFromCookieStore(null, { onAuthUpdate, verify })).cookieHeader).toBe('SMSESSION=verified-rotation')
    expect(onAuthUpdate).toHaveBeenNthCalledWith(1, expect.objectContaining({ cookieHeader: 'SMSESSION=verified-rotation' }))
  })

  it('propagates an unknown challenged-request failure without replacing saved auth', async () => {
    const error = new Error('model unavailable')
    const onAuthUpdate = jest.fn()
    await expect(api.recoverAuthFromCookieStore(null, { onAuthUpdate, verify: async () => { throw error } })).rejects.toBe(error)
    expect(onAuthUpdate).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    { status: 200, headers: { 'content-type': 'text/html' }, body: 'login' },
    { status: 200, headers: { 'content-type': 'application/json' }, body: { error: 'unauthorized' } }
  ])('rejects an ambiguous accounts response without permitting cold login %#', async response => {
    fetchJsonMock.mockResolvedValue(response)
    await expect(api.recoverAuthFromCookieStore(null)).rejects.toBeInstanceOf(Error)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([429, 500, 503])('does not treat HTTP %s as auth-suspect even in foreground', async status => {
    fetchJsonMock.mockResolvedValue({ status, headers: { 'content-type': 'text/html' }, body: 'maintenance' })
    await expect(api.recoverAuthFromCookieStore(null)).rejects.toMatchObject({ responseSummary: { status } })
  })

  it('preserves malformed JSON and network errors as non-auth errors', async () => {
    const { ParseError } = jest.requireActual('../../../common/network')
    const parseError = new ParseError('malformed JSON', { status: 200, headers: { 'content-type': 'application/json' } })
    expect(api.isLikelyAuthGateError(parseError)).toBe(false)
    fetchJsonMock.mockRejectedValue(parseError)
    await expect(api.recoverAuthFromCookieStore(null)).rejects.toMatchObject({
      message: 'Bank Hapoalim returned an unexpected response instead of JSON.',
      responseSummary: { status: 200 }
    })
    const networkError = new Error('network unavailable')
    expect(api.isLikelyAuthGateError(networkError)).toBe(false)
    fetchJsonMock.mockRejectedValue(networkError)
    await expect(api.recoverAuthFromCookieStore(null)).rejects.toBe(networkError)
  })

  it('recognizes a login HTML ParseError but not HTML server failures', () => {
    const { ParseError } = jest.requireActual('../../../common/network')
    expect(api.isLikelyAuthGateError(new ParseError('HTML', { status: 200, url: 'https://login.bankhapoalim.co.il/ng-portals/auth/he/', headers: { 'Content-Type': 'text/html' } }))).toBe(true)
    expect(api.isLikelyAuthGateError(new ParseError('HTML', { status: 200, url: ACCOUNTS_URL, headers: { 'Content-Type': 'text/html' } }))).toBe(false)
    expect(api.isLikelyAuthGateError(new ParseError('HTML', { status: 503, headers: { 'content-type': 'text/html' } }))).toBe(false)
  })

  it('propagates cookie store read failures without flushing the store', async () => {
    const error = new Error('cookie bridge failed')
    global.ZenMoney.getCookies.mockRejectedValue(error)
    await expect(api.recoverAuthFromCookieStore(null)).rejects.toBe(error)
    expect(global.ZenMoney.saveCookies).not.toHaveBeenCalled()
    expect(fetchJsonMock).not.toHaveBeenCalled()
  })

  it.each(['rejects', 'times out'])('preserves a cookie read that %s without committing a late candidate', async failure => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let resolvePending
    global.ZenMoney.getCookies.mockImplementation(() => failure === 'rejects'
      ? Promise.reject(new Error('cookie store unavailable'))
      : new Promise(resolve => { resolvePending = resolve }))
    const outcome = api.recoverAuthFromCookieStore(null).catch(error => error)
    for (let i = 0; i < 40; i++) await Promise.resolve()
    if (failure === 'times out') jest.advanceTimersByTime(15000)
    expect(await outcome).toBeInstanceOf(Error)
    if (resolvePending) resolvePending([{ name: 'SMSESSION', value: 'late', domain: '.bankhapoalim.co.il', path: '/' }])
    for (let i = 0; i < 40; i++) await Promise.resolve()
    expect(fetchJsonMock).not.toHaveBeenCalled()
    expect(global.ZenMoney.saveCookies).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
  })

  it.each(['cookie store read', 'silent accounts verification'])('bounds a pending %s and ignores its late result', async label => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let resolvePending
    const pending = new Promise(resolve => { resolvePending = resolve })
    if (label === 'cookie store read') global.ZenMoney.getCookies.mockReturnValue(pending)
    if (label === 'silent accounts verification') fetchJsonMock.mockReturnValue(pending)
    const storedAuth = { cookieHeader: 'SMSESSION=old', restContext: 'old' }
    const outcome = api.recoverAuthFromCookieStore(storedAuth).then(auth => ({ auth }), error => ({ error }))
    for (let i = 0; i < 40; i++) await Promise.resolve()
    jest.advanceTimersByTime(15000)
    expect(await outcome).toMatchObject({ error: { message: expect.stringContaining(`${label} timed out`) } })
    resolvePending(label === 'cookie store read'
      ? [{ name: 'SMSESSION', value: 'late', domain: '.bankhapoalim.co.il', path: '/' }]
      : { status: 200, headers: { 'set-cookie': 'SMSESSION=late; Path=/' }, body: label === 'silent accounts verification' ? [] : 'no context' })
    for (let i = 0; i < 40; i++) await Promise.resolve()
    expect(storedAuth).toEqual({ cookieHeader: 'SMSESSION=old', restContext: 'old' })
    expect(fetchJsonMock).toHaveBeenCalledTimes(label === 'cookie store read' ? 0 : 1)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
    expect(webViewMock).not.toHaveBeenCalled()
  })

  it.each(['old', null])('persists verified recovery before context %s times out and ignores late changes', async restContext => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let resolvePending
    fetchMock.mockReturnValue(new Promise(resolve => { resolvePending = resolve }))
    const storedAuth = { cookieHeader: 'SMSESSION=old', restContext }
    const snapshot = { ...storedAuth }
    const persisted = jest.fn(async () => {})
    const result = api.recoverAuthFromCookieStore(storedAuth, { onAuthUpdate: persisted }).catch(error => error)
    for (let i = 0; i < 40; i++) await Promise.resolve()
    jest.advanceTimersByTime(15000)
    expect(await result).toMatchObject({ message: expect.stringContaining('silent portal context discovery timed out') })
    expect(persisted).toHaveBeenCalledTimes(1)
    const recovered = persisted.mock.calls[0][0]
    expect(recovered.cookieHeader).toBe('SMSESSION=recovered')
    expect(recovered.restContext).toBeNull()
    resolvePending({ status: 200, headers: { 'set-cookie': 'SMSESSION=late; Path=/' }, body: 'restContext: "/late"' })
    for (let i = 0; i < 40; i++) await Promise.resolve()
    expect(recovered.cookieHeader).toBe('SMSESSION=recovered')
    expect(recovered.restContext).toBeNull()
    expect(storedAuth).toEqual(snapshot)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('persists each verified portal rotation before a later context failure', async () => {
    fetchMock.mockResolvedValueOnce({ status: 200, headers: { 'set-cookie': 'SMSESSION=portal-rotated; Path=/' }, body: 'no context' })
      .mockResolvedValueOnce({ status: 503, headers: {}, body: 'model failure' })
    const persisted = jest.fn(async () => {})
    await expect(api.recoverAuthFromCookieStore(null, { onAuthUpdate: persisted })).rejects.toMatchObject({ responseSummary: { status: 503 } })
    expect(persisted).toHaveBeenCalledWith(expect.objectContaining({ cookieHeader: 'SMSESSION=portal-rotated' }))
  })
})
