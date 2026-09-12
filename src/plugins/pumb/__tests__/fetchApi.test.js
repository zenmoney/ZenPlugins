const mockConnection = jest.fn()
const mockFetch = jest.fn()

jest.mock('../../../common/protocols/webSocket', () => ({
  __esModule: true,
  default: mockConnection
}))

jest.mock('../../../common/network', () => ({ fetch: mockFetch }))

const {
  SessionExpiredError,
  closeConnection,
  fetchAccounts,
  fetchAuthenticationByBiometry,
  fetchAuthenticationByPassword,
  fetchAuthenticationOtp,
  fetchDepositDetails,
  fetchDepositOperations,
  fetchDeposits,
  fetchDepositsArchive,
  fetchIdentify,
  fetchLoanOperations,
  fetchLoans,
  fetchOperationsHistory,
  openAuthenticatedConnection,
  openUnauthenticatedConnection
} = require('../fetchApi')

const device = { deviceId: 'bank-device-id', hardwareID: '0123456789abcdef' }

function makeConnection () {
  return {
    _socket: null,
    _callbacks: {},
    open: jest.fn().mockResolvedValue({ status: 101 }),
    send: jest.fn().mockResolvedValue({ body: { data: { device_id: 'bank-device-id' } } }),
    close: jest.fn().mockResolvedValue(undefined)
  }
}

function makeGraphqlResponse (data, overrides = {}) {
  return { status: 200, body: { data }, headers: {}, ...overrides }
}

describe('PUMB fetch API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    global.ZenMoney = {
      device: {
        manufacturer: 'Google',
        model: 'Pixel 8',
        os: { name: 'Android', version: '16' }
      }
    }
  })

  it('sends the current password, biometry and OTP GraphQL contracts', async () => {
    mockFetch
      .mockResolvedValueOnce(makeGraphqlResponse({ authenticationByPasswordV2: { token: 'password-token' } }))
      .mockResolvedValueOnce(makeGraphqlResponse({ authenticationByBiometryV2: { token: 'biometry-token' } }))
      .mockResolvedValueOnce(makeGraphqlResponse({ authenticationOtpCheck: { token: 'otp-token' } }))

    await fetchAuthenticationByPassword('+380501234567', '1234', device)
    await fetchAuthenticationByBiometry('+380501234567', 'saved-auth-key', device)
    await fetchAuthenticationOtp('+380501234567', '654321', 'correlation-id', device)

    expect(mockFetch.mock.calls.map(call => call[1].body.operationName)).toEqual([
      'AuthenticationByPasswordV2',
      'AuthenticationByBiometryV2',
      'AuthenticationOtpCheck'
    ])
    expect(mockFetch.mock.calls[0][1].body.variables.input).toMatchObject({
      login: '+380501234567',
      password: 'MTIzNA==',
      deviceId: 'bank-device-id',
      appVersion: '2.339.05',
      appType: 'A_PROD',
      deviceData: {
        os: 'ANDROID',
        osVersion: '16',
        deviceModel: 'Pixel 8',
        deviceHardwareId: '0123456789abcdef'
      }
    })
    expect(mockFetch.mock.calls[1][1].body.variables.input.authKey).toBe('saved-auth-key')
    expect(mockFetch.mock.calls[2][1].body.variables.input).toMatchObject({
      otp: '654321',
      correlationId: 'correlation-id'
    })
  })

  it('classifies only explicit persisted-session codes as SessionExpiredError', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      headers: {},
      body: {
        errors: [{ message: 'auth key rejected', extensions: { code: 'AUTH_KEY_INVALID' } }]
      }
    })

    await expect(fetchAuthenticationByBiometry('+380501234567', 'saved-auth-key', device))
      .rejects.toBeInstanceOf(SessionExpiredError)

    const genericFailure = {
      status: 401,
      headers: {},
      body: { errors: [{ message: 'Unauthorized request' }] }
    }
    mockFetch.mockResolvedValueOnce(genericFailure)
    let error
    try {
      await fetchAuthenticationByBiometry('+380501234567', 'saved-auth-key', device)
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(SessionExpiredError)
    expect(error).toMatchObject({ httpStatus: 401, operationName: 'AuthenticationByBiometryV2' })
  })

  it('uses Identify v6 and authenticated WebSocket headers', async () => {
    const publicConnection = makeConnection()
    const authenticatedConnection = makeConnection()
    mockConnection
      .mockImplementationOnce(() => publicConnection)
      .mockImplementationOnce(() => authenticatedConnection)

    await expect(openUnauthenticatedConnection()).resolves.toBe(publicConnection)
    await expect(fetchIdentify(publicConnection, device)).resolves.toEqual({ data: { device_id: 'bank-device-id' } })
    await closeConnection(publicConnection)
    await expect(openAuthenticatedConnection('jwt-token', 'bank-device-id')).resolves.toBe(authenticatedConnection)

    expect(publicConnection.send.mock.calls[0][1].body).toMatchObject({
      data: {
        app_version: '2.339.05',
        hardware_id: '0123456789abcdef',
        cz: { functional: 'INIT', request: 'IDENTIFY', version: 6 }
      },
      lang: 'UK',
      type: 'INIT'
    })
    expect(authenticatedConnection.open).toHaveBeenCalledWith('wss://mobile.pumb.ua/ws', {
      headers: { authorization: 'jwt-token', 'X-DEVICE-ID': 'bank-device-id' },
      sanitizeRequestLog: { headers: { authorization: true, 'X-DEVICE-ID': true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true, 'Set-Cookie': true } }
    })
  })

  it('fails a stalled WebSocket open with an ordinary timeout error', async () => {
    const timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(callback => {
      callback()
      return 1
    })
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout').mockImplementation(() => {})
    const socket = { close: jest.fn() }
    const connection = makeConnection()
    connection._socket = socket
    connection.open.mockReturnValue(new Promise(() => {}))
    mockConnection.mockImplementationOnce(() => connection)

    const promise = openUnauthenticatedConnection()

    await expect(promise).rejects.toEqual(expect.objectContaining({
      message: 'PUMB WebSocket timed out while waiting for connection opening'
    }))
    expect(socket.close).toHaveBeenCalledTimes(1)
    timeoutSpy.mockRestore()
    clearTimeoutSpy.mockRestore()
  })

  it('loads all current product and deposit-operation contracts', async () => {
    mockFetch
      .mockResolvedValueOnce(makeGraphqlResponse({ accounts: [{ id: 101 }] }))
      .mockResolvedValueOnce(makeGraphqlResponse({ deposits: [{ id: 201 }] }))
      .mockResolvedValueOnce(makeGraphqlResponse({ depositsArchive: { deposits: [{ depositId: 202 }] } }))
      .mockResolvedValueOnce(makeGraphqlResponse({ deposit: { depositId: 201, agreementNumber: 'D-201' } }))
      .mockResolvedValueOnce(makeGraphqlResponse({ loans: [{ loanId: 301 }] }))
      .mockResolvedValueOnce(makeGraphqlResponse({
        loanHistoryOperations: {
          loanOperations: [{ operationDate: '2026-08-11', isRepaid: true }],
          totalPaymentAmount: 10000,
          totalReplenishmentAmount: 10000
        }
      }))
      .mockResolvedValueOnce(makeGraphqlResponse({
        depositOperationsHistoryV2: {
          totalCount: 2,
          limit: 100,
          offset: 0,
          items: [{ operationId: 1 }, { operationId: 2 }]
        }
      }))
    const session = { token: 'jwt-token', sessionId: 'session-id', device }

    await expect(fetchAccounts(session)).resolves.toEqual([{ id: 101 }])
    await expect(fetchDeposits(session)).resolves.toEqual([{ id: 201 }])
    await expect(fetchDepositsArchive(session)).resolves.toEqual([{ depositId: 202 }])
    await expect(fetchDepositDetails(session, 201)).resolves.toEqual({ depositId: 201, agreementNumber: 'D-201' })
    await expect(fetchLoans(session)).resolves.toEqual([{ loanId: 301 }])
    await expect(fetchLoanOperations(session, 301)).resolves.toEqual([
      { operationDate: '2026-08-11', isRepaid: true }
    ])
    await expect(fetchDepositOperations(session, 201)).resolves.toEqual([{ operationId: 1 }, { operationId: 2 }])

    expect(mockFetch.mock.calls.map(call => call[1].body.operationName)).toEqual([
      'AccountsWithCardsMain',
      'DepositsList',
      'DepositsArchive',
      'DepositDetails',
      'Loans',
      'LoanHistoryOperations',
      'DepositOperationsHistoryV2'
    ])
    expect(mockFetch.mock.calls[5][1].body.variables).toEqual({ input: { loanId: 301 } })
    expect(mockFetch.mock.calls[6][1].body.variables).toEqual({
      input: { limit: 100, offset: 0, depositId: 201 }
    })
  })

  it('asserts missing product arrays instead of returning incomplete data', async () => {
    mockFetch.mockResolvedValue(makeGraphqlResponse({ accounts: null }))

    await expect(fetchAccounts({ token: 'jwt-token', sessionId: 'session-id', device }))
      .rejects.toMatchObject({ message: expect.stringContaining('AccountsWithCardsMain') })
  })

  it('uses the application operations-history protocol and rejects a missing list', async () => {
    const connection = makeConnection()
    connection.send.mockResolvedValueOnce({
      body: { data: { transactions_history_list: [{ source_system_id: 'operation-id' }] } }
    })
    const fromDate = new Date('2026-02-03T14:05:06.007Z')

    await expect(fetchOperationsHistory(
      connection,
      { sessionId: 'session-id', device },
      [101, 102],
      fromDate
    )).resolves.toEqual([{ source_system_id: 'operation-id' }])

    expect(connection.send.mock.calls[0][1].body).toMatchObject({
      data: {
        current_account_ids: [101, 102],
        date_end: '03.02.2026T14:05:06.007Z',
        cz: { functional: 'OPERATIONS_HISTORY', request: 'GET_OPERATIONS_HISTORY', version: 14 }
      },
      session_id: 'session-id',
      type: 'BUSINESS'
    })

    connection.send.mockResolvedValueOnce({ body: { data: {} } })
    await expect(fetchOperationsHistory(
      connection,
      { sessionId: 'session-id', device },
      [101],
      fromDate
    )).rejects.toMatchObject({ message: expect.stringContaining('transactions_history_list') })
  })
})
