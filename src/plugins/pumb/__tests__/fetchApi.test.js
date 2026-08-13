const mockConnection = jest.fn()
const mockFetch = jest.fn()

jest.mock('../../../common/protocols/webSocket', () => ({
  __esModule: true,
  default: mockConnection
}))

jest.mock('../../../common/network', () => ({
  fetch: mockFetch,
  ParseError: class ParseError {}
}))

const {
  closeConnection,
  fetchAccounts,
  fetchAuthenticationByBiometry,
  fetchAuthenticationByPassword,
  fetchAuthenticationOtp,
  fetchDeposits,
  fetchIdentify,
  fetchLoans,
  fetchOperationsHistory,
  openAuthenticatedConnection,
  openUnauthenticatedConnection
} = require('../fetchApi')

const device = {
  deviceId: 'bank-device-id',
  hardwareID: '0123456789abcdef'
}

function makeConnection () {
  return {
    open: jest.fn().mockResolvedValue({ status: 101 }),
    send: jest.fn().mockResolvedValue({
      body: {
        data: {
          device_id: 'bank-device-id'
        }
      }
    }),
    close: jest.fn().mockResolvedValue(undefined)
  }
}

function makeGraphqlResponse (data) {
  return {
    status: 200,
    body: { data },
    headers: {}
  }
}

describe('PUMB fetch API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.ZenMoney = {
      device: {
        manufacturer: 'Google',
        model: 'Pixel 8',
        os: {
          name: 'Android',
          version: '16'
        }
      }
    }
  })

  it('sends the current AuthenticationByPasswordV2 request', async () => {
    mockFetch.mockResolvedValue(makeGraphqlResponse({
      authenticationByPasswordV2: { token: 'jwt-token' }
    }))

    await expect(fetchAuthenticationByPassword('+380501234567', '1234', device))
      .resolves.toEqual({ token: 'jwt-token' })

    expect(mockFetch).toHaveBeenCalledWith('https://mobile.pumb.ua/graphql', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Api-Key': expect.stringMatching(/^Bearer /),
        'Device-ID': 'bank-device-id',
        Lang: 'UK'
      }),
      body: {
        operationName: 'AuthenticationByPasswordV2',
        variables: {
          input: {
            login: '+380501234567',
            password: 'MTIzNA==',
            deviceId: 'bank-device-id',
            appVersion: '2.338.05',
            appType: 'A_PROD',
            deviceData: expect.objectContaining({
              os: 'ANDROID',
              osVersion: '16',
              deviceModel: 'Pixel 8',
              deviceHardwareId: '0123456789abcdef'
            })
          }
        },
        query: expect.stringContaining('mutation AuthenticationByPasswordV2')
      }
    }))
  })

  it('sends AuthenticationByBiometryV2 with the stored auth key', async () => {
    mockFetch.mockResolvedValue(makeGraphqlResponse({
      authenticationByBiometryV2: { token: 'jwt-token' }
    }))

    await fetchAuthenticationByBiometry('+380501234567', 'saved-auth-key', device)

    expect(mockFetch.mock.calls[0][1].body).toEqual({
      operationName: 'AuthenticationByBiometryV2',
      variables: {
        input: {
          login: '+380501234567',
          authKey: 'saved-auth-key',
          deviceId: 'bank-device-id',
          appVersion: '2.338.05',
          appType: 'A_PROD',
          deviceData: expect.objectContaining({
            deviceHardwareId: '0123456789abcdef'
          })
        }
      },
      query: expect.stringContaining('mutation AuthenticationByBiometryV2')
    })
    expect(mockFetch.mock.calls[0][1].headers).toMatchObject({
      'Api-Key': expect.stringMatching(/^Bearer /),
      'Device-ID': 'bank-device-id'
    })
  })

  it('sends OTP through the public GraphQL context', async () => {
    mockFetch.mockResolvedValue(makeGraphqlResponse({
      authenticationOtpCheck: { token: 'jwt-token' }
    }))

    await fetchAuthenticationOtp('+380501234567', '654321', 'correlation-id', device)

    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Api-Key': expect.stringMatching(/^Bearer /),
        'Device-ID': 'bank-device-id',
        Lang: 'UK'
      },
      body: {
        operationName: 'AuthenticationOtpCheck',
        variables: {
          input: {
            login: '+380501234567',
            deviceId: 'bank-device-id',
            correlationId: 'correlation-id',
            otp: '654321'
          }
        },
        query: expect.stringContaining('mutation AuthenticationOtpCheck')
      }
    })
  })

  it('uses Identify v6 and authenticates the WebSocket with the JWT', async () => {
    const publicConnection = makeConnection()
    const authenticatedConnection = makeConnection()
    mockConnection
      .mockImplementationOnce(() => publicConnection)
      .mockImplementationOnce(() => authenticatedConnection)

    await expect(openUnauthenticatedConnection()).resolves.toBe(publicConnection)
    await expect(fetchIdentify(publicConnection, device)).resolves.toEqual({
      data: { device_id: 'bank-device-id' }
    })
    await closeConnection(publicConnection)
    await expect(openAuthenticatedConnection('jwt-token', 'bank-device-id'))
      .resolves.toBe(authenticatedConnection)

    expect(publicConnection.send.mock.calls[0][1].body).toMatchObject({
      data: {
        app_version: '2.338.05',
        hardware_id: '0123456789abcdef',
        cz: {
          functional: 'INIT',
          request: 'IDENTIFY',
          version: 6
        }
      },
      lang: 'UK',
      type: 'INIT'
    })
    expect(authenticatedConnection.open).toHaveBeenCalledWith('wss://mobile.pumb.ua/ws', {
      headers: {
        authorization: 'jwt-token',
        'X-DEVICE-ID': 'bank-device-id'
      },
      sanitizeRequestLog: {
        headers: {
          authorization: true,
          'X-DEVICE-ID': true
        }
      }
    })
  })

  it('loads current product lists with authenticated GraphQL headers', async () => {
    mockFetch
      .mockResolvedValueOnce(makeGraphqlResponse({ accounts: [{ id: 101 }] }))
      .mockResolvedValueOnce(makeGraphqlResponse({ deposits: [{ id: 201 }] }))
      .mockResolvedValueOnce(makeGraphqlResponse({ loans: [{ loanId: 301 }] }))
    const session = {
      token: 'jwt-token',
      sessionId: 'session-id',
      device
    }

    await expect(Promise.all([
      fetchAccounts(session),
      fetchDeposits(session),
      fetchLoans(session)
    ])).resolves.toEqual([
      [{ id: 101 }],
      [{ id: 201 }],
      [{ loanId: 301 }]
    ])

    expect(mockFetch.mock.calls.map(call => call[1].body.operationName)).toEqual([
      'AccountsWithCardsMain',
      'DepositsList',
      'Loans'
    ])
    for (const call of mockFetch.mock.calls) {
      expect(call[1].headers).toMatchObject({
        Authorization: 'Bearer jwt-token',
        'Session-ID': 'session-id',
        'Device-ID': 'bank-device-id',
        Lang: 'UK'
      })
    }
  })

  it('uses operations history protocol version 14', async () => {
    const connection = makeConnection()
    connection.send.mockResolvedValue({
      body: {
        data: {
          transactions_history_list: [{ source_system_id: 'operation-id' }]
        }
      }
    })
    const fromDate = new Date('2026-02-03T14:05:06.007Z')

    await expect(fetchOperationsHistory(
      connection,
      { sessionId: 'session-id', device },
      { id: 101, type: 'account' },
      fromDate
    )).resolves.toEqual([{ source_system_id: 'operation-id' }])

    expect(connection.send.mock.calls[0][1].body).toMatchObject({
      data: {
        current_account_ids: [101],
        date_end: '03.02.2026T14:05:06.007Z',
        cz: {
          functional: 'OPERATIONS_HISTORY',
          request: 'GET_OPERATIONS_HISTORY',
          version: 14
        }
      },
      lang: 'UK',
      session_id: 'session-id',
      type: 'BUSINESS'
    })
  })
})
