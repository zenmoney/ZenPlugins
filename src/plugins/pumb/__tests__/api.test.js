import {
  InvalidLoginOrPasswordError,
  InvalidOtpCodeError,
  UserInteractionError
} from '../../../errors'

const mockOpenUnauthenticatedConnection = jest.fn()
const mockOpenAuthenticatedConnection = jest.fn()
const mockCloseConnection = jest.fn()
const mockFetchIdentify = jest.fn()
const mockFetchAuthenticationByPassword = jest.fn()
const mockFetchAuthenticationByBiometry = jest.fn()
const mockFetchAuthenticationOtp = jest.fn()
const mockFetchAccounts = jest.fn()
const mockFetchDeposits = jest.fn()
const mockFetchDepositsArchive = jest.fn()
const mockFetchDepositDetails = jest.fn()
const mockFetchDepositOperations = jest.fn()
const mockFetchLoanOperations = jest.fn()
const mockFetchLoans = jest.fn()
const mockFetchOperationsHistory = jest.fn()

jest.mock('../fetchApi', () => {
  class SessionExpiredError extends Error {
    constructor (code = 'AUTH_KEY_INVALID', operationName = 'AuthenticationByBiometryV2') {
      super(code)
      this.code = code
      this.operationName = operationName
    }
  }
  return {
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
    fetchDepositsArchive: mockFetchDepositsArchive,
    fetchDepositDetails: mockFetchDepositDetails,
    fetchDepositOperations: mockFetchDepositOperations,
    fetchLoanOperations: mockFetchLoanOperations,
    fetchLoans: mockFetchLoans,
    fetchOperationsHistory: mockFetchOperationsHistory
  }
})

const { SessionExpiredError } = require('../fetchApi')
const {
  fetchProducts,
  fetchTransactions,
  generateDevice,
  login,
  normalizeAuthState,
  validatePreferences
} = require('../api')

const preferences = { login: '380501234567', password: '1234' }

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

function makePersistedAuth () {
  const auth = normalizeAuthState({}, '+380501234567')
  auth.device.deviceId = 'bank-device-id'
  auth.authKey = 'saved-auth-key'
  return auth
}

function makeApiError (code, operationName) {
  const error = new Error(code)
  error.code = code
  error.operationName = operationName
  return error
}

describe('PUMB API orchestration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.ZenMoney = { readLine: jest.fn() }
    mockOpenUnauthenticatedConnection.mockResolvedValue('public-connection')
    mockOpenAuthenticatedConnection.mockResolvedValue('authenticated-connection')
    mockCloseConnection.mockResolvedValue(undefined)
    mockFetchIdentify.mockResolvedValue({ data: { device_id: 'new-bank-device-id' } })
    mockFetchAuthenticationByPassword.mockResolvedValue(makeAuthResult())
    mockFetchAuthenticationByBiometry.mockResolvedValue(makeAuthResult())
    mockFetchAuthenticationOtp.mockResolvedValue(makeAuthResult())
  })

  it.each([
    ['+380501234567', '+380501234567'],
    ['380501234567', '+380501234567'],
    ['0501234567', '+380501234567']
  ])('accepts supported phone input %s', (input, expected) => {
    expect(validatePreferences({ login: input, password: '1234' })).toEqual({
      login: expected,
      password: '1234'
    })
  })

  it('migrates legacy state to cold auth without writing storage from api', async () => {
    const persistedState = {
      legacyDevice: { deviceId: 'legacy-device-id', hardwareID: '0123456789abcdef' }
    }

    await expect(login(preferences, false, persistedState)).resolves.toEqual({
      connection: 'authenticated-connection',
      device: { deviceId: 'new-bank-device-id', hardwareID: '0123456789abcdef' },
      sessionId: 'session-id',
      token: 'jwt-token',
      authState: expect.objectContaining({
        schemaVersion: 3,
        loginHash: expect.any(String),
        authKey: 'new-auth-key',
        device: { deviceId: 'new-bank-device-id', hardwareID: '0123456789abcdef' }
      })
    })

    expect(mockFetchAuthenticationByBiometry).not.toHaveBeenCalled()
    expect(mockFetchAuthenticationByPassword).toHaveBeenCalledWith(
      '+380501234567',
      '1234',
      { deviceId: 'new-bank-device-id', hardwareID: '0123456789abcdef' }
    )
  })

  it('stops background cold auth immediately before the password request', async () => {
    await expect(login(preferences, true, {})).rejects.toBeInstanceOf(UserInteractionError)

    expect(mockOpenUnauthenticatedConnection).toHaveBeenCalledTimes(1)
    expect(mockFetchIdentify).toHaveBeenCalledTimes(1)
    expect(mockFetchAuthenticationByPassword).not.toHaveBeenCalled()
    expect(mockCloseConnection).toHaveBeenCalledWith('public-connection')
  })

  it('uses persisted artifacts for hot auth', async () => {
    const auth = makePersistedAuth()

    const session = await login(preferences, true, { auth })

    expect(mockFetchAuthenticationByBiometry).toHaveBeenCalledWith(
      '+380501234567',
      'saved-auth-key',
      auth.device
    )
    expect(mockOpenUnauthenticatedConnection).not.toHaveBeenCalled()
    expect(session.authState.authKey).toBe('new-auth-key')
  })

  it('falls back to cold auth only after an explicit persisted-session rejection', async () => {
    mockFetchAuthenticationByBiometry.mockRejectedValue(new SessionExpiredError())

    await expect(login(preferences, false, { auth: makePersistedAuth() })).resolves.toMatchObject({
      token: 'jwt-token',
      sessionId: 'session-id'
    })

    expect(mockFetchIdentify).toHaveBeenCalledTimes(1)
    expect(mockFetchAuthenticationByPassword).toHaveBeenCalledTimes(1)
  })

  it('preserves an unknown hot-auth failure and does not start cold auth', async () => {
    const failure = new Error('network connection reset')
    mockFetchAuthenticationByBiometry.mockRejectedValue(failure)

    await expect(login(preferences, false, { auth: makePersistedAuth() })).rejects.toBe(failure)

    expect(mockOpenUnauthenticatedConnection).not.toHaveBeenCalled()
    expect(mockFetchAuthenticationByPassword).not.toHaveBeenCalled()
  })

  it('completes an OTP challenge inside the foreground plugin', async () => {
    ZenMoney.readLine.mockResolvedValue('654321')
    mockFetchAuthenticationByPassword.mockResolvedValue(makeAuthResult({
      token: null,
      authKey: null,
      sessionId: null,
      additionalCheck: { __typename: 'AuthenticationOtpAdditionalCheck', correlationId: 'correlation-id' }
    }))

    await login(preferences, false, {})

    expect(ZenMoney.readLine).toHaveBeenCalledWith('Введіть код із SMS від ПУМБ', {
      inputType: 'number',
      time: 120000
    })
    expect(mockFetchAuthenticationOtp).toHaveBeenCalledWith(
      '+380501234567',
      '654321',
      'correlation-id',
      expect.objectContaining({ deviceId: 'new-bank-device-id' })
    )
  })

  it('signals unavailable UI when hot auth confirms that OTP input is needed', async () => {
    mockFetchAuthenticationByBiometry.mockResolvedValue(makeAuthResult({
      token: null,
      authKey: null,
      sessionId: null,
      additionalCheck: { __typename: 'AuthenticationOtpAdditionalCheck', correlationId: 'correlation-id' }
    }))

    await expect(login(preferences, true, { auth: makePersistedAuth() }))
      .rejects.toBeInstanceOf(UserInteractionError)

    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(mockFetchAuthenticationOtp).not.toHaveBeenCalled()
  })

  it('maps only explicit credential and OTP codes to non-reportable errors', async () => {
    mockFetchAuthenticationByPassword.mockRejectedValueOnce(
      makeApiError('INVALID_CREDENTIALS', 'AuthenticationByPasswordV2')
    )
    await expect(login(preferences, false, {})).rejects.toBeInstanceOf(InvalidLoginOrPasswordError)

    mockFetchAuthenticationByPassword.mockResolvedValueOnce(makeAuthResult({
      token: null,
      authKey: null,
      sessionId: null,
      additionalCheck: { __typename: 'AuthenticationOtpAdditionalCheck', correlationId: 'correlation-id' }
    }))
    ZenMoney.readLine.mockResolvedValueOnce('654321')
    mockFetchAuthenticationOtp.mockRejectedValueOnce(
      makeApiError('OTP_EXPIRED', 'AuthenticationOtpCheck')
    )
    await expect(login(preferences, false, {})).rejects.toBeInstanceOf(InvalidOtpCodeError)
  })

  it('keeps nearby unclassified auth and OTP failures reportable', async () => {
    const passwordFailure = makeApiError('AUTH_SERVICE_FAILURE', 'AuthenticationByPasswordV2')
    mockFetchAuthenticationByPassword.mockRejectedValueOnce(passwordFailure)
    await expect(login(preferences, false, {})).rejects.toBe(passwordFailure)

    const otpFailure = makeApiError('OTP_DELIVERY_FAILURE', 'AuthenticationOtpCheck')
    mockFetchAuthenticationByPassword.mockResolvedValueOnce(makeAuthResult({
      token: null,
      authKey: null,
      sessionId: null,
      additionalCheck: { __typename: 'AuthenticationOtpAdditionalCheck', correlationId: 'correlation-id' }
    }))
    ZenMoney.readLine.mockResolvedValueOnce('654321')
    mockFetchAuthenticationOtp.mockRejectedValueOnce(otpFailure)
    await expect(login(preferences, false, {})).rejects.toBe(otpFailure)
  })

  it('keeps unsupported liveness checks as ordinary reportable errors with context', async () => {
    mockFetchAuthenticationByPassword.mockResolvedValue(makeAuthResult({
      token: null,
      authKey: null,
      sessionId: null,
      additionalCheck: { __typename: 'AuthenticationLivenessAdditionalCheck', correlationId: 'correlation-id' }
    }))

    await expect(login(preferences, false, {})).rejects.toMatchObject({
      message: expect.stringContaining('AuthenticationLivenessAdditionalCheck')
    })
  })

  it('fetches active deposit details, archived deposits and all operation source types', async () => {
    mockFetchAccounts.mockResolvedValue([{ id: 101 }])
    mockFetchDeposits.mockResolvedValue([{ id: 201, balance: 100 }])
    mockFetchDepositsArchive.mockResolvedValue([{ depositId: 202, lastBalance: 0 }])
    mockFetchDepositDetails.mockResolvedValue({ depositId: 201, agreementNumber: 'D-201' })
    mockFetchLoans.mockResolvedValue([{ loanId: 301 }])
    mockFetchOperationsHistory.mockResolvedValue([{ source_system_id: 'account-operation' }])
    mockFetchDepositOperations.mockResolvedValue([{ operationId: 'deposit-operation' }])
    mockFetchLoanOperations.mockResolvedValue([{ operationDate: '2026-08-11', isRepaid: true }])
    const session = {
      connection: 'authenticated-connection',
      device: { deviceId: 'bank-device-id', hardwareID: '0123456789abcdef' },
      sessionId: 'session-id',
      token: 'jwt-token'
    }

    await expect(fetchProducts(session)).resolves.toEqual({
      accounts: [{ id: 101 }],
      deposits: [
        expect.objectContaining({ id: 201, agreementNumber: 'D-201', archived: false }),
        expect.objectContaining({ id: 202, archived: true })
      ],
      loans: [{ loanId: 301 }]
    })
    await expect(fetchTransactions(session, {
      sources: [
        { type: 'account', accountIds: [101] },
        { type: 'deposit', depositId: 201 },
        { type: 'loan', loanId: 301 }
      ]
    }, new Date('2026-08-01T00:00:00Z'))).resolves.toEqual([
      { type: 'account', data: { source_system_id: 'account-operation' } },
      { type: 'deposit', depositId: 201, data: { operationId: 'deposit-operation' } },
      { type: 'loan', loanId: 301, data: { operationDate: '2026-08-11', isRepaid: true } }
    ])
  })

  it('generates a stable hardware identity from the normalized phone number', () => {
    expect(generateDevice('+380501234567')).toEqual(generateDevice('+380501234567'))
    expect(generateDevice('+380501234567').hardwareID).toMatch(/^[0-9a-f]{16}$/)
  })
})
