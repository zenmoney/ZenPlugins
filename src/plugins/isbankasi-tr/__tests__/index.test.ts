import { UserInteractionError } from '../../../errors'
import { AuthSession, DeviceIdentity, StoredAuthRejectedError } from '../types'

const mockRefresh = jest.fn()
const mockInitialize = jest.fn()
const mockPasswordVerification = jest.fn()
const mockVerifyOtp = jest.fn()
const mockFetchAccounts = jest.fn()
const mockFetchTransactions = jest.fn()
const mockGetSession = jest.fn()
const mockCreateDeviceIdentity = jest.fn()
const mockGetCurrentDeviceProfile = jest.fn()
const mockIsBankApi = jest.fn().mockImplementation(() => ({
  refresh: mockRefresh,
  initialize: mockInitialize,
  passwordVerification: mockPasswordVerification,
  verifyOtp: mockVerifyOtp,
  fetchAccounts: mockFetchAccounts,
  fetchTransactions: mockFetchTransactions,
  getSession: mockGetSession
}))

jest.mock('../api', () => ({
  IsBankApi: mockIsBankApi,
  createDeviceIdentity: mockCreateDeviceIdentity,
  getCurrentDeviceProfile: mockGetCurrentDeviceProfile
}))

const identity: DeviceIdentity = {
  deviceId: '11111111-2222-3333-4444-555555555555',
  androidId: '0123456789abcdef',
  manufacturer: 'Google',
  model: 'Pixel 8',
  osVersion: '15'
}

const storedSession: AuthSession = {
  version: 3,
  ...identity,
  accessToken: 'stored-access-token',
  refreshToken: 'stored-refresh-token',
  cookies: {}
}

const refreshedSession: AuthSession = {
  ...storedSession,
  accessToken: 'refreshed-access-token',
  refreshToken: 'refreshed-refresh-token'
}

function configureZenMoney (stored: Record<string, unknown> = {}): void {
  global.ZenMoney = {
    getData: jest.fn((key: string) => stored[key]),
    setData: jest.fn(),
    saveData: jest.fn(),
    readLine: jest.fn(),
    isAccountSkipped: jest.fn(() => false),
    device: { manufacturer: 'Google', model: 'Pixel 8', os: { version: '15' } }
  } as unknown as typeof ZenMoney
}

function scrapeOptions (isInBackground: boolean): Parameters<typeof import('../index').scrape>[0] {
  return {
    preferences: { login: '123456', password: '123456' },
    fromDate: new Date('2026-08-01T00:00:00Z'),
    toDate: new Date('2026-08-18T00:00:00Z'),
    isFirstRun: false,
    isInBackground
  }
}

describe('İşCep scrape authorization recovery', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrape } = require('../index') as typeof import('../index')

  beforeEach(() => {
    jest.clearAllMocks()
    configureZenMoney()
    mockCreateDeviceIdentity.mockReturnValue(identity)
    mockGetCurrentDeviceProfile.mockReturnValue({
      manufacturer: identity.manufacturer,
      model: identity.model,
      osVersion: identity.osVersion
    })
    mockRefresh.mockResolvedValue(refreshedSession)
    mockInitialize.mockResolvedValue(undefined)
    mockGetSession.mockReturnValue(refreshedSession)
    mockFetchAccounts.mockResolvedValue([])
    mockFetchTransactions.mockResolvedValue([])
  })

  it('uses a stored session through hot authentication', async () => {
    configureZenMoney({ authSession: storedSession })

    await expect(scrape(scrapeOptions(true))).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockIsBankApi).toHaveBeenCalledWith(expect.objectContaining({ session: storedSession }))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockPasswordVerification).not.toHaveBeenCalled()
    expect(ZenMoney.setData).toHaveBeenCalledWith('authSession', refreshedSession)
  })

  it('migrates a complete legacy stored session into the current hot-auth format', async () => {
    configureZenMoney({
      authSession: {
        version: 1,
        deviceId: identity.deviceId,
        androidId: identity.androidId,
        model: identity.model,
        accessToken: storedSession.accessToken,
        refreshToken: storedSession.refreshToken,
        cookies: {},
        tuid: 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
      }
    })

    await expect(scrape(scrapeOptions(true))).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockIsBankApi).toHaveBeenCalledWith(expect.objectContaining({
      session: expect.objectContaining({
        version: 3,
        manufacturer: 'Google',
        osVersion: '15'
      })
    }))
    expect(mockIsBankApi.mock.calls[0][0].session).not.toHaveProperty('tuid')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('treats blank stored authorization artifacts as missing and does not attempt hot authentication', async () => {
    configureZenMoney({ authSession: { ...storedSession, refreshToken: '' } })

    await expect(scrape(scrapeOptions(true))).rejects.toBeInstanceOf(UserInteractionError)

    expect(mockRefresh).not.toHaveBeenCalled()
    expect(mockIsBankApi).toHaveBeenCalledTimes(1)
    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockPasswordVerification).not.toHaveBeenCalled()
    expect(mockCreateDeviceIdentity).not.toHaveBeenCalled()
  })

  it('runs the non-interactive startup request and stops background cold auth before OTP delivery', async () => {
    const promise = scrape(scrapeOptions(true))

    await expect(promise).rejects.toBeInstanceOf(UserInteractionError)
    expect(mockIsBankApi).toHaveBeenCalledTimes(1)
    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockPasswordVerification).not.toHaveBeenCalled()
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(ZenMoney.setData).toHaveBeenCalledWith('deviceIdentity', identity)
  })

  it('falls back after a confirmed stored-token rejection but still stops before interaction in background', async () => {
    configureZenMoney({ authSession: storedSession })
    mockRefresh.mockRejectedValue(new StoredAuthRejectedError({ status: 400, code: 'invalid_grant' }))

    const promise = scrape(scrapeOptions(true))

    await expect(promise).rejects.toBeInstanceOf(UserInteractionError)
    expect(mockIsBankApi).toHaveBeenCalledTimes(2)
    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockPasswordVerification).not.toHaveBeenCalled()
  })

  it('propagates an unknown hot-auth failure unchanged without starting cold authentication', async () => {
    configureZenMoney({ authSession: storedSession })
    const transportError = new Error('connection reset')
    mockRefresh.mockRejectedValue(transportError)

    await expect(scrape(scrapeOptions(false))).rejects.toBe(transportError)
    expect(mockIsBankApi).toHaveBeenCalledTimes(1)
    expect(mockInitialize).not.toHaveBeenCalled()
    expect(mockPasswordVerification).not.toHaveBeenCalled()
  })

  it('propagates a startup failure unchanged without initiating login', async () => {
    const startupError = new Error('startup failed')
    mockInitialize.mockRejectedValue(startupError)

    await expect(scrape(scrapeOptions(false))).rejects.toBe(startupError)

    expect(mockPasswordVerification).not.toHaveBeenCalled()
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(ZenMoney.setData).not.toHaveBeenCalled()
  })

  it('completes the foreground password and OTP flow when no stored session exists', async () => {
    mockPasswordVerification.mockResolvedValue({ astType: 2, accessToken: 'mfa-token' })
    mockVerifyOtp.mockResolvedValue(refreshedSession)
    ;(ZenMoney.readLine as jest.Mock).mockResolvedValue('654321')

    await expect(scrape(scrapeOptions(false))).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockPasswordVerification).toHaveBeenCalledWith({ login: '123456', password: '123456' })
    expect(mockInitialize.mock.invocationCallOrder[0]).toBeLessThan(mockPasswordVerification.mock.invocationCallOrder[0])
    expect(mockVerifyOtp).toHaveBeenCalledWith('654321', 2, 'mfa-token')
    expect(ZenMoney.setData).toHaveBeenCalledWith('authSession', refreshedSession)
  })
})
