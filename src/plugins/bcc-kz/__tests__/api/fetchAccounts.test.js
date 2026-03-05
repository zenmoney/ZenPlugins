import { fetchAccounts } from '../../api'

function makeNetworkResponse (body) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://m.bcc.kz/mock',
    headers: {
      forEach: () => {}
    },
    text: async () => JSON.stringify(body)
  }
}

function createJwt (payload) {
  const header = { alg: 'none', typ: 'JWT' }
  const encode = (obj) => Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${encode(header)}.${encode(payload)}.signature`
}

describe('bcc-kz fetchAccounts web api', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('calls main endpoint with bearer token and session code', async () => {
    global.fetch
      .mockResolvedValueOnce(makeNetworkResponse({
        success: true,
        reason: {
          card: [],
          current: [],
          dep: [],
          loan: [],
          broker: [],
          metal: []
        }
      }))
      .mockResolvedValueOnce(makeNetworkResponse({
        success: true,
        reason: {
          accounts_info: []
        }
      }))

    await fetchAccounts({
      accessToken: 'bearer-token',
      sessionCode: 'session-code'
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
    const firstUrl = global.fetch.mock.calls[0][0]
    expect(firstUrl).toContain('https://m.bcc.kz/mb/!pkg_w_mb_main.operation?')
    expect(firstUrl).toContain('action=ACCOUNTS_INFO')
    expect(firstUrl).toContain('level=0')
    expect(firstUrl).toContain('session_code=session-code')
    expect(firstUrl).toContain('timestamp=')
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer bearer-token')

    const secondUrl = global.fetch.mock.calls[1][0]
    expect(secondUrl).toContain('action=ACCOUNTS_ADDITIONAL_INFO')
  })

  it('recovers missing sessionCode from access token payload', async () => {
    global.fetch
      .mockResolvedValueOnce(makeNetworkResponse({
        success: true,
        reason: {
          card: [],
          current: [],
          dep: [],
          loan: [],
          broker: [],
          metal: []
        }
      }))
      .mockResolvedValueOnce(makeNetworkResponse({
        success: true,
        reason: {
          accounts_info: []
        }
      }))

    await fetchAccounts({
      accessToken: createJwt({ session_state: 'jwt-session-code' })
    })

    const firstUrl = global.fetch.mock.calls[0][0]
    expect(firstUrl).toContain('session_code=jwt-session-code')
  })
})
