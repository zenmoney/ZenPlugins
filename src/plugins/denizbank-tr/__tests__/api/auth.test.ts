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
})
