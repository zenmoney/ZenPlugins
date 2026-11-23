import fetchMock from 'fetch-mock'
import { DenizBankApi } from '../../api'
import { UserInteractionError, ZPAPIError } from '../../../../errors'

// These models verify control flow without interpreting bank response formats.
describe('authentication [model]', () => {
  const api = new DenizBankApi({ baseUrl: 'https://example.com/', encryptionStaticKeyBase64: '' })

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    jest.setSystemTime(new Date('2026-11-15T00:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
    fetchMock.restore()
    jest.restoreAllMocks()
  })

  it('stops background cold login before starting any interaction', async () => {
    fetchMock.mock(/.*/, { throws: new Error('Unexpected network request') })
    const network = jest.spyOn(global, 'fetch')
    await expect(api.login({ login: 'login', password: 'password' }, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(network).not.toHaveBeenCalled()
  })

  it('preserves a transport failure without starting cold authentication', async () => {
    const error = new Error('Transport failure')
    fetchMock.get('https://example.com/auth/session-extension', { throws: error })
    const network = jest.spyOn(global, 'fetch')
    const session = { clientId: 'client', encryptionKey: 'key', token: 'saved', createdDate: new Date(), timeoutSeconds: 1800 }
    await expect(api.login({ login: 'changed', password: 'changed' }, false, session)).rejects.toBe(error)
    expect(network).toHaveBeenCalledTimes(1)
    expect(session.token).toBe('saved')
  })

  it('rejects an HTTP history failure instead of returning missing card history', async () => {
    fetchMock.get(/https:\/\/example\.com\/cards\//, { status: 503, body: {} })
    let error: unknown
    try {
      await api.fetchCardTransactions({ clientId: 'client' }, 'card', new Date('2026-11-01T00:00:00Z'))
    } catch (e) { error = e }
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
  })
  it('accepts credentials while the login still awaits push confirmation', async () => {
    // Reduced from an observed 2026-11-22 credentials response (profile fields omitted):
    // the bank accepted the login but returned isSuccess: false with an empty errorMessage before the push step.
    fetchMock.patch('https://example.com/auth/token', {
      status: 200,
      body: { currentTime: '2026-11-22T11:12:04.7068609+03:00', sessionTimeout: 570, isSuccess: false, errorMessage: '' }
    })
    const session = { clientId: 'client', encryptionKey: 'key', token: 'token' }
    const result = await (api as unknown as {
      sendCredentials: (...args: unknown[]) => Promise<{ currentTime: Date, sessionTimeout: number }>
    }).sendCredentials(session, 'login', 'secret', 'captchaId', 'ABCD', 'JanusIB-20261117.1-')
    expect(result.sessionTimeout).toBe(570)
  })
})
