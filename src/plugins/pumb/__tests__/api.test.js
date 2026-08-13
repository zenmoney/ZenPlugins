import { BankMessageError, UserInteractionError } from '../../../errors'

const mockOpenUnauthenticatedConnection = jest.fn()
const mockOpenAuthenticatedConnection = jest.fn()
const mockCloseConnection = jest.fn()
const mockFetchIdentify = jest.fn()
const mockFetchAuthenticationByPassword = jest.fn()
const mockFetchAuthenticationByBiometry = jest.fn()
const mockFetchAuthenticationOtp = jest.fn()
const mockFetchAccounts = jest.fn()
const mockFetchDeposits = jest.fn()
const mockFetchLoans = jest.fn()
const mockFetchOperationsHistory = jest.fn()

jest.mock('../fetchApi', () => {
  class PumbApiError extends Error {}
  class SessionExpiredError extends PumbApiError {}

  return {
    PumbApiError,
    SessionExpiredError,
    openUnauthenticatedConnection: mockOpenUnauthenticatedConnection,
    openAuthenticatedConnection: mockOpenAuthenticatedConnection,
    closeConnection: mockCloseConnection,
    fetchIdentify: mockFetchIdentify,
    fetchAuthenticationByPassword: mockFetchAuthenticationByPassword,
    fetchAuthenticationByBiometry: mockFetchAuthenticationByBiometry,
    fetchAuthenticationOtp: mockFetchAuthenticationOtp,
    fetchAccounts: mockFetchAccounts,
    fetchDeposits: mockFetchDeposits,
    fetchLoans: mockFetchLoans,
    fetchOperationsHistory: mockFetchOperationsHistory
  }
})

const { SessionExpiredError } = require('../fetchApi')
const { fetchProducts, fetchTransactions, generateDevice, login } = require('../api')

const preferences = {
  login: '+380501234567',
  password: '1234'
}

function makeAuthResult (overrides = {}) {
  return {
    __typename: 'AuthenticationResponseV2',
    token: 'jwt-token',
    authKey: 'new-auth-key',
    sessionId: 'session-id',
    additionalCheck: null,
    launchTransition: null,
    userType: 'INDIVIDUAL',
    ...overrides
  }
}

describe('PUMB API orchestration', () => {
  let storage

  beforeEach(() => {
    jest.clearAllMocks()
    storage = {}
    global.ZenMoney = {
      getData: jest.fn((key, fallback = undefined) => Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : fallback),
      setData: jest.fn((key, value) => { storage[key] = value }),
      saveData: jest.fn(),
      readLine: jest.fn()
    }
    mockOpenUnauthenticatedConnection.mockResolvedValue('public-connection')
    mockOpenAuthenticatedConnection.mockResolvedValue('authenticated-connection')
    mockCloseConnection.mockResolvedValue(undefined)
    mockFetchIdentify.mockResolvedValue({ data: { device_id: 'bank-device-id' } })
    mockFetchAuthenticationByPassword.mockResolvedValue(makeAuthResult())
    mockFetchAuthenticationByBiometry.mockResolvedValue(makeAuthResult())
    mockFetchAuthenticationOtp.mockResolvedValue(makeAuthResult())
  })

  it('migrates a legacy device to schema v2 and deliberately performs cold auth', async () => {
    storage.device = {
      deviceId: 'legacy-bank-device-id',
      hardwareID: '0123456789abcdef'
    }

    await expect(login(preferences, false)).resolves.toEqual({
      connection: 'authenticated-connection',
      device: {
        deviceId: 'bank-device-id',
        hardwareID: '0123456789abcdef'
      },
      sessionId: 'session-id',
      token: 'jwt-token'
    })

    expect(mockFetchIdentify).toHaveBeenCalledWith('public-connection', {
      deviceId: '',
      hardwareID: '0123456789abcdef'
    })
    expect(mockFetchAuthenticationByPassword).toHaveBeenCalledWith(
      '+380501234567',
      '1234',
      { deviceId: 'bank-device-id', hardwareID: '0123456789abcdef' }
    )
    expect(mockFetchAuthenticationByBiometry).not.toHaveBeenCalled()
    expect(storage.auth).toEqual({
      schemaVersion: 2,
      device: {
        deviceId: 'bank-device-id',
        hardwareID: '0123456789abcdef'
      },
      authKey: 'new-auth-key'
    })
  })

  it('does not start a required cold auth during a background sync', async () => {
    storage.device = {
      deviceId: 'legacy-bank-device-id',
      hardwareID: '0123456789abcdef'
    }

    await expect(login(preferences, true)).rejects.toBeInstanceOf(UserInteractionError)

    expect(storage.auth).toEqual({
      schemaVersion: 2,
      device: {
        deviceId: '',
        hardwareID: '0123456789abcdef'
      },
      authKey: null
    })
    expect(mockOpenUnauthenticatedConnection).not.toHaveBeenCalled()
    expect(mockFetchAuthenticationByPassword).not.toHaveBeenCalled()
  })

  it('uses AuthenticationByBiometryV2 for hot auth without the bank application', async () => {
    storage.auth = {
      schemaVersion: 2,
      device: {
        deviceId: 'bank-device-id',
        hardwareID: '0123456789abcdef'
      },
      authKey: 'saved-auth-key'
    }

    await expect(login(preferences, true)).resolves.toEqual({
      connection: 'authenticated-connection',
      device: storage.auth.device,
      sessionId: 'session-id',
      token: 'jwt-token'
    })

    expect(mockFetchAuthenticationByBiometry).toHaveBeenCalledWith(
      '+380501234567',
      'saved-auth-key',
      storage.auth.device
    )
    expect(mockOpenUnauthenticatedConnection).not.toHaveBeenCalled()
    expect(mockOpenAuthenticatedConnection).toHaveBeenCalledWith(
      'jwt-token',
      'bank-device-id'
    )
    expect(storage.auth.authKey).toBe('new-auth-key')
  })

  it('falls back from an expired hot auth to cold auth in foreground', async () => {
    storage.auth = {
      schemaVersion: 2,
      device: {
        deviceId: 'expired-device-id',
        hardwareID: '0123456789abcdef'
      },
      authKey: 'expired-auth-key'
    }
    mockFetchAuthenticationByBiometry.mockRejectedValue(new SessionExpiredError())

    await expect(login(preferences, false)).resolves.toMatchObject({
      connection: 'authenticated-connection',
      sessionId: 'session-id',
      token: 'jwt-token'
    })

    expect(mockFetchIdentify).toHaveBeenCalledWith('public-connection', {
      deviceId: '',
      hardwareID: '0123456789abcdef'
    })
    expect(mockFetchAuthenticationByPassword).toHaveBeenCalledTimes(1)
    expect(storage.auth.device.deviceId).toBe('bank-device-id')
    expect(storage.auth.authKey).toBe('new-auth-key')
  })

  it('completes an OTP challenge inside the plugin', async () => {
    storage.device = { hardwareID: '0123456789abcdef' }
    ZenMoney.readLine.mockResolvedValue('654321')
    mockFetchAuthenticationByPassword.mockResolvedValue(makeAuthResult({
      token: null,
      authKey: null,
      sessionId: null,
      additionalCheck: {
        __typename: 'AuthenticationOtpAdditionalCheck',
        correlationId: 'correlation-id'
      }
    }))

    await login(preferences, false)

    expect(ZenMoney.readLine).toHaveBeenCalledWith('Введите код из SMS от ПУМБ', {
      inputType: 'number',
      time: 120000
    })
    expect(mockFetchAuthenticationOtp).toHaveBeenCalledWith(
      '+380501234567',
      '654321',
      'correlation-id',
      { deviceId: 'bank-device-id', hardwareID: '0123456789abcdef' }
    )
  })

  it('reports an identity check that a headless plugin cannot complete', async () => {
    storage.device = { hardwareID: '0123456789abcdef' }
    mockFetchAuthenticationByPassword.mockResolvedValue(makeAuthResult({
      token: null,
      authKey: null,
      sessionId: null,
      additionalCheck: {
        __typename: 'AuthenticationLivenessAdditionalCheck',
        correlationId: 'correlation-id'
      }
    }))

    let error
    try {
      await login(preferences, false)
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(BankMessageError)
    expect(error.bankMessage).toContain('перевірку особи')
    expect(mockCloseConnection).toHaveBeenCalledWith('public-connection')
  })

  it('fetches raw products and operation history through fetchApi', async () => {
    mockFetchAccounts.mockResolvedValue([{ id: 101 }])
    mockFetchDeposits.mockResolvedValue([{ id: 201 }])
    mockFetchLoans.mockResolvedValue([{ loanId: 301 }])
    const session = {
      connection: 'authenticated-connection',
      device: { deviceId: 'bank-device-id', hardwareID: '0123456789abcdef' },
      sessionId: 'session-id',
      token: 'jwt-token'
    }
    mockFetchOperationsHistory.mockResolvedValue([{ source_system_id: 'operation-id' }])

    await expect(fetchProducts(session)).resolves.toEqual({
      accounts: [{ id: 101 }],
      deposits: [{ id: 201 }],
      loans: [{ loanId: 301 }]
    })
    await expect(fetchTransactions(session, { id: 101, type: 'account' }, new Date('2026-08-01T00:00:00Z')))
      .resolves.toEqual([{ source_system_id: 'operation-id' }])

    expect(mockFetchOperationsHistory).toHaveBeenCalledWith(
      'authenticated-connection',
      {
        sessionId: 'session-id',
        device: session.device
      },
      { id: 101, type: 'account' },
      new Date('2026-08-01T00:00:00Z')
    )
  })

  it('generates a stable hardware identity from the phone number', () => {
    expect(generateDevice('+380501234567')).toEqual(generateDevice('+380501234567'))
    expect(generateDevice('+380501234567').hardwareID).toMatch(/^[0-9a-f]{16}$/)
  })
})
