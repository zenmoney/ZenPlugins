const mockFetchJson = jest.fn()

jest.mock('../../../../common/network', () => ({ fetchJson: mockFetchJson }))

const EXPECTED_REQUEST_REDACTION = { headers: { Cookie: true }, body: { email: true, code: true } }
const EXPECTED_RESPONSE_REDACTION = {
  headers: { 'set-cookie': true },
  body: { accessToken: true, refreshToken: true }
}

describe('fetchApi — credentials are never written to the logs', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sendCode, verifyCode, fetchCards } = require('../../fetchApi') as typeof import('../../fetchApi')

  beforeEach(() => {
    global.ZenMoney = {
      setCookie: jest.fn(async () => {}),
      getCookies: jest.fn(async () => [])
    } as unknown as typeof ZenMoney
    mockFetchJson.mockResolvedValue({
      status: 200,
      url: '',
      headers: {},
      body: { accessToken: 'A', refreshToken: 'R', cards: [] }
    })
  })

  afterEach(() => { jest.clearAllMocks() })

  it('redacts the email on send-code', async () => {
    await sendCode('a@b.c')
    const options = mockFetchJson.mock.calls[0][1]
    expect(options.sanitizeRequestLog).toEqual(EXPECTED_REQUEST_REDACTION)
    expect(options.sanitizeResponseLog).toEqual(EXPECTED_RESPONSE_REDACTION)
  })

  it('redacts the OTP code and the returned tokens on verify-code', async () => {
    await verifyCode('a@b.c', '123456')
    const options = mockFetchJson.mock.calls[0][1]
    // the code + email are in the request body, the tokens in the response body
    expect(options.body).toEqual({ email: 'a@b.c', code: '123456', type: 'LOGIN' })
    expect(options.sanitizeRequestLog).toEqual(EXPECTED_REQUEST_REDACTION)
    expect(options.sanitizeResponseLog).toEqual(EXPECTED_RESPONSE_REDACTION)
  })

  it('redacts cookies on authed data requests too', async () => {
    await fetchCards()
    const options = mockFetchJson.mock.calls[0][1]
    expect(options.sanitizeRequestLog).toEqual(EXPECTED_REQUEST_REDACTION)
    expect(options.sanitizeResponseLog).toEqual(EXPECTED_RESPONSE_REDACTION)
  })

  it('never puts the session in a request header (the sandbox cookie jar owns it)', async () => {
    await fetchCards()
    const options = mockFetchJson.mock.calls[0][1]
    expect(Object.keys(options.headers as Record<string, string>)).not.toContain('Cookie')
    expect(JSON.stringify(options.headers)).not.toContain('access_token')
  })
})
