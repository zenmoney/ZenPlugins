import { TemporaryError } from '../../../errors'
import { ParseError } from '../../../common/network'

const mockGenerateRandomString = jest.fn(() => '0123456789abcdef')
const mockFetchDeviceRegister = jest.fn()
const mockFetchConfirmRegister = jest.fn()
const mockFetchLogin = jest.fn()
const mockFetchHistory = jest.fn()

jest.mock('../../../common/utils', () => ({
  ...jest.requireActual('../../../common/utils'),
  generateRandomString: mockGenerateRandomString
}))

jest.mock('../fetchApi', () => ({
  ...jest.requireActual('../fetchApi'),
  fetchDeviceRegister: mockFetchDeviceRegister,
  fetchConfirmRegister: mockFetchConfirmRegister,
  fetchLogin: mockFetchLogin,
  fetchHistory: mockFetchHistory
}))

describe('Click authentication', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { coldAuth, fetchTransactions, hotAuth } = require('../api') as typeof import('../api')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ClickApiError, getAuthToken } = require('../fetchApi') as typeof import('../fetchApi')

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchHistory.mockReset()
    mockFetchDeviceRegister.mockResolvedValue('registered-device-id')
    mockFetchConfirmRegister.mockResolvedValue(undefined)
    mockFetchLogin.mockResolvedValue('new-session-key')
    global.ZenMoney = {
      readLine: jest.fn(async () => '123456')
    } as unknown as typeof ZenMoney
  })

  it('creates one complete auth object during cold authentication', async () => {
    await expect(coldAuth({ phone: '+998001234567', password: '12345' })).resolves.toEqual({
      imei: '0123456789abcdef',
      deviceId: 'registered-device-id',
      authToken: getAuthToken('998001234567', 'registered-device-id', '123456'),
      sessionKey: 'new-session-key'
    })
    expect(mockFetchDeviceRegister).toHaveBeenCalledWith('998001234567', '0123456789abcdef')
    expect(mockFetchConfirmRegister).toHaveBeenCalledWith('998001234567', '123456', { deviceId: 'registered-device-id' })
  })

  it('refreshes a hot session without mutating stored auth', async () => {
    const storedAuth = {
      imei: 'old-imei',
      deviceId: 'old-device-id',
      authToken: 'old-auth-token',
      sessionKey: 'old-session-key'
    }

    await expect(hotAuth({ phone: '998001234567', password: '12345' }, storedAuth)).resolves.toEqual({
      ...storedAuth,
      sessionKey: 'new-session-key'
    })
    expect(storedAuth.sessionKey).toBe('old-session-key')
  })

  it('turns a server failure into a retryable user-facing error', async () => {
    mockFetchHistory.mockRejectedValue(new ClickApiError(undefined, 'Server error', 500))

    const error = await fetchTransactions(
      { id: '12345678', cardType: 'SMARTV' },
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-07T00:00:00.000Z'),
      {
        imei: 'test-imei',
        deviceId: 'test-device-id',
        authToken: 'test-auth-token',
        sessionKey: 'test-session-key'
      }
    ).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(TemporaryError)
    expect((error as TemporaryError).message).toBe('CLICK временно не выполнил запрос: Server error')
  })

  it('turns malformed JSON into a retryable user-facing error', async () => {
    mockFetchHistory.mockRejectedValue(new ParseError(
      'Could not parse response',
      { status: 200, url: 'https://api.click.uz/evo/', headers: {}, body: '<html>' },
      new Error('Unexpected token')
    ))

    const error = await fetchTransactions(
      { id: '12345678', cardType: 'SMARTV' },
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-07T00:00:00.000Z'),
      {
        imei: 'test-imei',
        deviceId: 'test-device-id',
        authToken: 'test-auth-token',
        sessionKey: 'test-session-key'
      }
    ).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(TemporaryError)
    expect((error as TemporaryError).message).toBe('CLICK вернул некорректный ответ. Повторите синхронизацию позже.')
  })
})
