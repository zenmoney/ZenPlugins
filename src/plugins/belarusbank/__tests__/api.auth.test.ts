import fetchMock from 'fetch-mock'
import { UserInteractionError, ZPAPIError } from '../../../errors'

const mockAuthorize = jest.fn()
jest.mock('../sso', () => ({ authorizeInWebView: mockAuthorize }))
const { authenticate } = jest.requireActual<typeof import('../api')>('../api')

// Model auth lifecycle obligations; token expiry is the JWT exp used by both bank clients.
describe('authentication lifecycle [model]', () => {
  const tokens = { sessionToken: 'model-session', refreshToken: 'model-refresh', tokenType: 'Bearer' }

  beforeEach(() => {
    mockAuthorize.mockReset().mockResolvedValue(tokens)
    global.ZenMoney = { getData: jest.fn(() => null), setData: jest.fn(), saveData: jest.fn() } as unknown as typeof ZenMoney
  })
  afterEach(() => { fetchMock.restore() })

  it('delegates missing persisted authorization to the official interactive flow', async () => {
    await expect(authenticate(null, false)).resolves.toEqual(tokens)
    expect(mockAuthorize).toHaveBeenCalledWith(false)
    expect(fetchMock.called()).toBe(false)
  })

  it('refreshes a compatible legacy session independently of preference credentials', async () => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', { token: 'model-rotated', refreshToken: 'model-rotated-refresh', tokenType: 'Bearer' })
    await expect(authenticate({ login: 'legacy-login', ...tokens }, true)).resolves.toEqual({
      sessionToken: 'model-rotated', refreshToken: 'model-rotated-refresh', tokenType: 'Bearer'
    })
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('starts cold authentication when the saved refresh JWT has expired', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(2000)
    try {
      await expect(authenticate({ ...tokens, refreshToken: 'e30.eyJleHAiOjF9.signature' }, false)).resolves.toEqual(tokens)
      expect(mockAuthorize).toHaveBeenCalledWith(false)
      expect(fetchMock.called()).toBe(false)
    } finally { jest.restoreAllMocks() }
  })

  it.each([400, 401, 403, 503])('keeps an unclassified refresh HTTP %s reportable without cold fallback', async (status) => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', { status, body: {} })
    const error = await authenticate(tokens, false).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error).toHaveProperty('message', expect.stringContaining('[auth/hot]'))
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it.each(['Model transport failure', 'ECONNRESET', '[NER]'])('preserves the original refresh transport error: %s', async (message) => {
    const error = new Error(message)
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', { throws: error })
    await expect(authenticate(tokens, false)).rejects.toBe(error)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('rejects incomplete successful refresh data without replacing it with old tokens', async () => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', { token: 'model-new-session' })
    await expect(authenticate(tokens, false)).rejects.toBeInstanceOf(Error)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('keeps incomplete successful browser authorization reportable', async () => {
    mockAuthorize.mockResolvedValue({ sessionToken: 'model-incomplete' })
    const error = await authenticate(null, false).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error).toHaveProperty('message', expect.stringContaining('[auth/cold]'))
    expect(error).toHaveProperty('message', expect.not.stringContaining('model-incomplete'))
  })

  it('passes the background guard through unchanged for incompatible saved state', async () => {
    const error = new UserInteractionError()
    mockAuthorize.mockRejectedValue(error)
    await expect(authenticate({ sessionToken: 'model-incomplete' }, true)).rejects.toBe(error)
    expect(mockAuthorize).toHaveBeenCalledWith(true)
    expect(fetchMock.called()).toBe(false)
  })
})
