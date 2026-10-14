import { convertHeadersToPlainObject, FetchFunc, FetchOptions, FetchResponse } from '../../../common/network'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError } from '../../../errors'
import { IsBankApi, createDeviceIdentity } from '../api'
import { AuthSession, DeviceIdentity, StoredAuthRejectedError } from '../types'

const identity: DeviceIdentity = {
  deviceId: '11111111-2222-3333-4444-555555555555',
  androidId: '0123456789abcdef',
  manufacturer: 'Google',
  model: 'Pixel 8',
  osVersion: '15'
}

const session: AuthSession = {
  version: 3,
  ...identity,
  accessToken: 'old-access-token',
  refreshToken: 'old-refresh-token',
  randNo: 'old-rand-no',
  cookies: { JSESSIONID: 'secret-cookie' }
}

function response (body: unknown, status = 200, headers: HeadersInit = {}): FetchResponse {
  return {
    ok: status >= 200 && status < 300,
    statusText: '',
    status,
    url: 'https://mobil.isbank.com.tr/ClientGateway/test',
    headers: convertHeadersToPlainObject(headers),
    body
  }
}

function createSequenceFetch (...responses: Array<FetchResponse | Error>): jest.MockedFunction<FetchFunc> {
  const mock = jest.fn<ReturnType<FetchFunc>, Parameters<FetchFunc>>()
  for (const item of responses) {
    if (item instanceof Error) mock.mockRejectedValueOnce(item)
    else mock.mockResolvedValueOnce(item)
  }
  return mock
}

function successfulFirstFactor (): unknown {
  return {
    RandNo: 'next-rand-no',
    Error: null,
    authorization: {
      accessToken: 'mfa-token',
      refreshToken: 'temporary-refresh-token'
    },
    loginInfo: {
      security: {
        deviceMatchingStatus: 0,
        igaInformation: { astType: 2 }
      }
    }
  }
}

describe('İşCep API error classification', () => {
  beforeEach(() => {
    global.ZenMoney = { device: { model: 'Pixel 8' } } as unknown as typeof ZenMoney
  })

  it('classifies an exact password rejection as InvalidLoginOrPasswordError', async () => {
    const fetch = createSequenceFetch(response({
      Error: { Category: 'B', ErrorCode: 'SY01', Text: 'bank text' }
    }))
    const api = new IsBankApi({ identity, fetch })

    await expect(api.passwordVerification({ login: '123456', password: '123456' }))
      .rejects.toBeInstanceOf(InvalidLoginOrPasswordError)
  })

  it('keeps a nearby unknown password failure reportable', async () => {
    const fetch = createSequenceFetch(response({
      Error: { Category: 'B', ErrorCode: 'SMS_PROTOCOL_CHANGED', Text: 'OTP could not be delivered' }
    }))
    const api = new IsBankApi({ identity, fetch })

    const error = await api.passwordVerification({ login: '123456', password: '123456' }).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(InvalidLoginOrPasswordError)
    expect(String(error)).toContain('SMS_PROTOCOL_CHANGED')
  })

  it('keeps the freshly observed OLP-MRTSS risk response reportable', async () => {
    const fetch = createSequenceFetch(response({
      Error: {
        Category: 'U',
        Code: '2255307',
        ErrorCode: 'OLP-MRTSS',
        Text: 'Teknik nedenlerden dolayı işleminizi gerçekleştiremiyoruz.'
      }
    }))
    const api = new IsBankApi({ identity, fetch })

    const error = await api.passwordVerification({ login: '123456', password: '123456' })
      .catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(InvalidLoginOrPasswordError)
    expect(String(error)).toContain('OLP-MRTSS')
  })

  it('keeps an unsupported second-factor strategy reportable instead of treating it as an OTP flow', async () => {
    const firstFactor = successfulFirstFactor() as { loginInfo: { security: { igaInformation: { astType: number } } } }
    firstFactor.loginInfo.security.igaInformation.astType = 0
    const api = new IsBankApi({ identity, fetch: createSequenceFetch(response(firstFactor)) })

    const error = await api.passwordVerification({ login: '123456', password: '123456' })
      .catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(InvalidOtpCodeError)
    expect(String(error)).toContain('unsupported second-factor type')
  })

  it('classifies AST02 as an invalid OTP and leaves AST07 reportable', async () => {
    const wrongCodeFetch = createSequenceFetch(
      response(successfulFirstFactor()),
      response({ Error: { ErrorCode: 'AST02' } })
    )
    const wrongCodeApi = new IsBankApi({ identity, fetch: wrongCodeFetch })
    const firstFactor = await wrongCodeApi.passwordVerification({ login: '123456', password: '123456' })

    await expect(wrongCodeApi.verifyOtp('123456', firstFactor.astType, firstFactor.accessToken))
      .rejects.toBeInstanceOf(InvalidOtpCodeError)

    const nearbyFetch = createSequenceFetch(
      response(successfulFirstFactor()),
      response({ Error: { ErrorCode: 'AST07' } })
    )
    const nearbyApi = new IsBankApi({ identity, fetch: nearbyFetch })
    const nearbyFirstFactor = await nearbyApi.passwordVerification({ login: '123456', password: '123456' })
    const error = await nearbyApi.verifyOtp('123456', nearbyFirstFactor.astType, nearbyFirstFactor.accessToken)
      .catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(InvalidOtpCodeError)
  })

  it('propagates the original transport error unchanged', async () => {
    const transportError = new Error('connection reset')
    const api = new IsBankApi({
      identity,
      fetch: createSequenceFetch(transportError)
    })

    await expect(api.passwordVerification({ login: '123456', password: '123456' })).rejects.toBe(transportError)
  })

  it('allows cold-auth fallback only for a confirmed invalid refresh token', async () => {
    const api = new IsBankApi({
      identity,
      session,
      fetch: createSequenceFetch(response({ error: 'invalid_grant' }, 400))
    })

    const error = await api.refresh().catch((error: unknown) => error)

    expect(error).toBeInstanceOf(StoredAuthRejectedError)
    expect(error).toEqual(expect.objectContaining({ context: { status: 400, code: 'invalid_grant' } }))
  })

  it('keeps an unknown refresh failure reportable', async () => {
    const api = new IsBankApi({
      identity,
      session,
      fetch: createSequenceFetch(response({ error: 'temporarily_unavailable' }, 503))
    })

    const error = await api.refresh().catch((error: unknown) => error)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(StoredAuthRejectedError)
    expect(String(error)).toContain('temporarily_unavailable')
  })
})

describe('İşCep API requests', () => {
  beforeEach(() => {
    global.ZenMoney = {
      device: { manufacturer: 'Google', model: 'Pixel 8', os: { version: '15' } }
    } as unknown as typeof ZenMoney
  })

  it('uses a lowercase persistent-style UUID for a new İşCep installation', () => {
    expect(createDeviceIdentity().deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('bootstraps an unregistered installation before login', async () => {
    const fetch = createSequenceFetch(
      response({ Error: null, RandNo: 'startup-rand-no' }),
      response(successfulFirstFactor())
    )
    const api = new IsBankApi({ identity, fetch })

    await api.initialize()
    await api.passwordVerification({ login: '123456', password: '654321' })

    const url = fetch.mock.calls[0][0]
    const options = fetch.mock.calls[0][1] as FetchOptions
    const body = options.body as Record<string, unknown>
    const headers = options.headers as Record<string, string>
    expect(url).toBe('https://mobil.isbank.com.tr/ClientGateway/IsCepOnboardingInitialize/GetIsCepStartupParameters')
    expect(body).toEqual(expect.objectContaining({
      RegisteredCustomerListInDevice: ['UNREGISTERED'],
      Coordinates: { Latitude: '0.0', Longitude: '0.0' },
      DeviceNumber: identity.deviceId
    }))
    expect(headers['Clear-Site-Data']).toBe('cookie')
    expect(headers['diag-fc']).toBe('ACI76390.LandingFragment./ClientGateway/IsCepOnboardingInitialize/GetIsCepStartupParameters')
    expect(headers).not.toHaveProperty('Accept')
    expect(headers).not.toHaveProperty('Cookie')
    expect(fetch.mock.calls[1][1]?.body).not.toHaveProperty('RandNo')
  })

  it('matches the İşCep 10.12.1 password-verification fingerprint', async () => {
    const fetch = createSequenceFetch(response(successfulFirstFactor()))
    const api = new IsBankApi({ identity, fetch })

    await api.passwordVerification({ login: '123456', password: '654321' })

    const options = fetch.mock.calls[0][1] as FetchOptions
    const body = options.body as Record<string, unknown>
    const headers = options.headers as Record<string, string>
    expect(body).toEqual(expect.objectContaining({
      customerNumber: '123456',
      password: '654321',
      captchaVerified: true,
      captchaType: 'image',
      Coordinates: { Latitude: '0.0', Longitude: '0.0' },
      DeviceNumber: identity.deviceId,
      deviceMatchInfo: {
        SerialNumbers: [identity.deviceId],
        useRegisteredDeviceOnly: false,
        currentDeviceSerialNo: identity.deviceId,
        isRegisteredDevice: false,
        isPushEnabled: true,
        deviceSpecificIdentifiers: [{
          Key: 'deviceMatchingSerialNumber',
          Value: identity.deviceId,
          showInfoMessage: false
        }, {
          Key: 'androidId',
          Value: identity.androidId,
          showInfoMessage: false
        }],
        hasBiometricAuthentication: false
      }
    }))
    expect(body).not.toHaveProperty('corporateCustomerNumber')
    expect(body).not.toHaveProperty('citizenID')
    expect(body).not.toHaveProperty('captchaText')
    expect(body).not.toHaveProperty('captchaId')
    expect(body.deviceMatchInfo).not.toHaveProperty('iMEINumber')
    expect(headers['User-Agent']).toBe('IsCep/10.12.1 (Google/Pixel 8; Android/15; Scale/xxhdpi; MobileServices/FCM)')
    expect(headers['diag-fc']).toBe('ACI76390.AuthenticationLoginFirstFactorFragment./ClientGateway/IsCepLogin/PasswordVerification')
    expect(headers['diag-nc']).toBe(headers['diag-fc'])
  })

  it('uses citizenID without a null customer number for Turkish identity login', async () => {
    const fetch = createSequenceFetch(response(successfulFirstFactor()))
    const api = new IsBankApi({ identity, fetch })

    await api.passwordVerification({ login: '10000000146', password: '654321' })

    const body = (fetch.mock.calls[0][1] as FetchOptions).body as Record<string, unknown>
    expect(body).toEqual(expect.objectContaining({ citizenID: '10000000146' }))
    expect(body).not.toHaveProperty('customerNumber')
  })

  it('matches the unregistered-device OTP request shape', async () => {
    const fetch = createSequenceFetch(
      response(successfulFirstFactor()),
      response({
        Error: null,
        authorization: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      })
    )
    const api = new IsBankApi({ identity, fetch })
    const firstFactor = await api.passwordVerification({ login: '123456', password: '654321' })

    await api.verifyOtp('123456', firstFactor.astType, firstFactor.accessToken)

    const options = fetch.mock.calls[1][1] as FetchOptions
    const body = options.body as Record<string, unknown>
    const deviceMatchInfo = body.deviceMatchInfo as Record<string, unknown>
    const headers = options.headers as Record<string, string>
    expect(deviceMatchInfo).toEqual(expect.objectContaining({
      mobileApprovalCode: '123456',
      challengeResponse: '',
      isPushEnabled: false,
      hasBiometricAuthentication: false
    }))
    expect(deviceMatchInfo).not.toHaveProperty('iMEINumber')
    expect(body).toEqual(expect.objectContaining({
      secondFactorAuthentication: 2,
      mfaToken: 'mfa-token',
      HasDeviceNfc: true,
      DeviceNumber: identity.deviceId
    }))
    expect(headers['Proxy-Authorization']).toBe('Bearer mfa-token')
    expect(headers['diag-fc']).toBe('ACI76390.AuthenticationLoginMobileApprovalFragment./ClientGateway/IsCepLogin/IGAVerification')
  })

  it('uses the current transaction request shape and paginates with RemainingData', async () => {
    const fetch = createSequenceFetch(
      response({ Error: null, Activities: [{ ReceiptValue: '1' }], HasMore: true }),
      response({ Error: null, Activities: [{ ReceiptValue: '2' }], HasMore: false })
    )
    const api = new IsBankApi({ identity, session, fetch })

    await expect(api.fetchTransactions(
      { accountIndex: 'account-index', accountType: 1 },
      new Date('2026-07-01T00:00:00Z'),
      new Date('2026-08-18T00:00:00Z')
    )).resolves.toEqual([{ ReceiptValue: '1' }, { ReceiptValue: '2' }])

    const firstOptions = fetch.mock.calls[0][1] as FetchOptions
    const secondOptions = fetch.mock.calls[1][1] as FetchOptions
    expect(firstOptions.body).toEqual(expect.objectContaining({
      AccountIndex: 'account-index',
      Type: 0,
      FinancialType: 100,
      BeginTime: '2026-08-18',
      EndTime: '2026-07-01',
      RemainingData: false
    }))
    expect(firstOptions.body).not.toHaveProperty('Number')
    expect(firstOptions.body).not.toHaveProperty('OperationType')
    expect(firstOptions.body).not.toHaveProperty('addresses')
    expect(secondOptions.body).toEqual(expect.objectContaining({ RemainingData: true }))
    const firstTuid = (firstOptions.body as Record<string, unknown>).Tuid
    const secondTuid = (secondOptions.body as Record<string, unknown>).Tuid
    expect(firstTuid).toEqual(expect.stringMatching(/^[0-9A-F-]{36}$/))
    expect(secondTuid).toEqual(expect.stringMatching(/^[0-9A-F-]{36}$/))
    expect(secondTuid).not.toBe(firstTuid)
  })

  it('formats transaction boundaries as calendar dates in Istanbul', async () => {
    const fetch = createSequenceFetch(response({ Error: null, Activities: [], HasMore: false }))
    const api = new IsBankApi({ identity, session, fetch })

    await api.fetchTransactions(
      { accountIndex: 'account-index', accountType: 1 },
      new Date('2026-06-30T21:30:00Z'),
      new Date('2026-08-17T21:30:00Z')
    )

    expect((fetch.mock.calls[0][1] as FetchOptions).body).toEqual(expect.objectContaining({
      BeginTime: '2026-08-18',
      EndTime: '2026-07-01'
    }))
  })

  it('uses a fresh request identifier for refresh authentication', async () => {
    const fetch = createSequenceFetch(response({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token'
    }))
    const api = new IsBankApi({ identity, session, fetch })

    await expect(api.refresh()).resolves.toEqual(expect.objectContaining({
      version: 3,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    }))

    const headers = (fetch.mock.calls[0][1] as FetchOptions).headers as Record<string, string>
    expect(headers['x-tuid']).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/))
  })

  it('updates cookies and RandNo without exposing them through the returned session shape incorrectly', async () => {
    const fetch = createSequenceFetch(response({
      RandNo: 'new-rand-no',
      Error: null,
      accountList: []
    }, 200, {
      'set-cookie': 'JSESSIONID=new-cookie; Path=/; Secure, osc=new-osc; Path=/'
    }))
    const api = new IsBankApi({ identity, session, fetch })

    await api.fetchAccounts()

    expect(api.getSession()).toEqual(expect.objectContaining({
      randNo: 'new-rand-no',
      cookies: expect.objectContaining({ JSESSIONID: 'new-cookie', osc: 'new-osc' })
    }))
  })
})
