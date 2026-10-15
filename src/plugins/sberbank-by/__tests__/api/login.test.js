jest.mock('../../../../common/network', () => ({
  fetch: jest.fn()
}))

const { fetch } = require('../../../../common/network')
const { login } = require('../../api')

function mockOAuthFlow ({ loginLocation = '/api/v1/auth/oauth2/authorize?continue=true' } = {}) {
  fetch
    .mockResolvedValueOnce({
      status: 200,
      headers: {
        'set-cookie': 'session-cookie=authorize-cookie; Max-Age=86400; Path=/; secure; HttpOnly'
      },
      body: '{"errorCode":"sbol.auth.unauthenticated.error"}'
    })
    .mockResolvedValueOnce({
      status: 302,
      headers: {
        location: loginLocation,
        'set-cookie': 'login-cookie=login-cookie; Max-Age=86400; Path=/; secure; HttpOnly'
      },
      body: ''
    })
    .mockResolvedValueOnce({
      status: 302,
      headers: {
        location: 'https://digital.sber-bank.by/loginsbol?code=authorization-code'
      },
      body: ''
    })
    .mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: '{"access_token":"access-token","refresh_token":"refresh-token"}'
    })
}

describe('login', () => {
  beforeEach(() => {
    fetch.mockReset()
    global.ZenMoney = {
      device: {
        brand: 'test-brand',
        manufacturer: 'test-manufacturer',
        model: 'test-model',
        osVersion: '14'
      }
    }
  })

  it('logs in through oauth2 authorization code flow', async () => {
    mockOAuthFlow()

    const device = {
      androidId: 'android-id',
      udid: 'udid'
    }
    const auth = await login({
      login: 'test-login',
      password: 'test-password'
    }, device)

    expect(auth).toEqual({
      login: 'test-login',
      password: 'test-password',
      token: 'access-token',
      refreshToken: 'refresh-token',
      sessionId: expect.any(String),
      device
    })
    expect(fetch).toHaveBeenCalledTimes(4)
    // Official Android 4.2.5 (285), AuthServerUrls; confirmed live on 2026-10-15.
    expect(fetch.mock.calls[0][0]).toMatch(/^https:\/\/digital\.sber-bank\.by\/api\/v1\/auth\/oauth2\/authorize\?/)
    expect(fetch.mock.calls[1][0]).toBe('https://digital.sber-bank.by/api/v1/auth/oauth2/login')
    expect(fetch.mock.calls[1][1].headers['Accept-Language']).toBe('ru')
    expect(fetch.mock.calls[1][1].headers.Cookie).toBe('session-cookie=authorize-cookie')
    expect(fetch.mock.calls[1][1].body).toEqual({
      username: 'test-login',
      password: 'test-password'
    })
    expect(fetch.mock.calls[2][0]).toBe('https://digital.sber-bank.by/api/v1/auth/oauth2/authorize?continue=true')
    expect(fetch.mock.calls[2][1].headers.Cookie).toBe('session-cookie=authorize-cookie; login-cookie=login-cookie')
    expect(fetch.mock.calls[3][0]).toBe('https://digital.sber-bank.by/api/v1/auth/oauth2/token')
    expect(fetch.mock.calls[3][1].body).toMatchObject({
      grant_type: 'authorization_code',
      code: 'authorization-code',
      client_id: 'sbol-client'
    })
  })

  it('maps internal bank oauth redirects to the public auth endpoint', async () => {
    mockOAuthFlow({
      loginLocation: 'https://sbol-auth.apps.k8s-prom1.belpsb.by/oauth2/authorize?continue=true'
    })

    await login({
      login: 'test-login',
      password: 'test-password'
    }, {
      androidId: 'android-id',
      udid: 'udid'
    })

    expect(fetch.mock.calls[2][0]).toBe('https://digital.sber-bank.by/api/v1/auth/oauth2/authorize?continue=true')
  })

  it.each([
    'http://sbol-auth.apps.k8s-prom1.belpsb.by/',
    // Observed in the saved-device OAuth login flow on 2026-10-15.
    'http://sbol-api-gateway.apps.k8s-prom1.belpsb.by/'
  ])('continues internal bank root redirect %s through the public authorize endpoint', async (loginLocation) => {
    mockOAuthFlow({
      loginLocation
    })

    await login({
      login: 'test-login',
      password: 'test-password'
    }, {
      androidId: 'android-id',
      udid: 'udid'
    })

    expect(fetch.mock.calls[2][0]).toBe(`${fetch.mock.calls[0][0]}&continue=true`)
    expect(fetch.mock.calls[2][1].headers.Cookie).toBe('session-cookie=authorize-cookie; login-cookie=login-cookie')
    expect(fetch.mock.calls[3][1].body.code_verifier).toEqual(expect.any(String))
  })
})
