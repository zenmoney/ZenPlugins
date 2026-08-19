import fetchMock from 'fetch-mock'
import { fetchAccounts, fetchTransactions, generateDeviceID, login } from '../api'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'
import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../../errors'

const BASE_URL = 'https://bnb-mobile.bnb.by/'

describe('Iskra API', () => {
  afterEach(() => fetchMock.restore())

  it('generates the UUID format used by the Iskra app', () => {
    expect(generateDeviceID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('reuses a refresh token without requesting an SMS code', async () => {
    const pluginData = makePluginDataApi({
      auth: { accessToken: 'old-access-token', refreshToken: 'old-refresh-token', deviceTrustStatus: 'TRUSTED' }
    })
    global.ZenMoney = {
      device: {
        manufacturer: 'Zenmoney Manufacturer',
        brand: 'zenmoney-brand',
        model: 'Sync',
        os: { name: 'android', version: '15' }
      },
      readLine: jest.fn(),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/oauth/refresh`, {
      status: 200,
      body: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        deviceTrustStatus: 'NOT_TRUSTED_WITH_OTHER_TRUSTED'
      }
    }, { method: 'POST' })
    await expect(login({})).resolves.toBe('new-access-token')
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
    expect(pluginData.currentData.auth).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      deviceTrustStatus: 'TRUSTED'
    })
    expect(pluginData.currentData.device).toMatchObject({
      uuid: expect.stringMatching(/^[0-9a-f-]{36}$/),
      fingerprint: {
        location: { latitude: '53.900000', longitude: '27.566700' },
        deviceModel: 'samsung SM-S948B',
        deviceName: 'SM-S948B',
        locale: 'ru-RU',
        timeZone: '180',
        osName: 'Android',
        osVersion: '16',
        deviceDisplayData: { width: '1440', height: '3120', scale: '3.5' },
        buildBootLoader: 'S948BXXS4AZG5',
        buildDisplay: 'S948BXXS4AZG5',
        buildFingerprint: 'samsung/m3qxxx/m3q:16/BP4A.251205.006/S948BXXS4AZG5:user/release-keys',
        buildId: 'BP4A.251205.006',
        buildRadio: 'S948BXXS4AZG5',
        buildManufacturer: 'samsung',
        systemFeatures: expect.arrayContaining([
          'android.hardware.fingerprint',
          'android.hardware.location.gps',
          'android.hardware.nfc',
          'android.software.secure_lock_screen'
        ])
      }
    })
    const [, refreshRequest] = fetchMock.lastCall(`${BASE_URL}user/v1/oauth/refresh`)
    expect(refreshRequest.headers).toMatchObject({
      'user-agent': 'Android/GOOGLE/16/samsung/SM-S948B/1.8.3',
      'accept-language': 'RU'
    })
    expect(pluginData.saveDataRequested).toBe(true)
  })

  it('preserves saved authentication when token refresh fails temporarily', async () => {
    const savedAuth = {
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
      deviceTrustStatus: 'TRUSTED'
    }
    const pluginData = makePluginDataApi({ auth: savedAuth })
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      readLine: jest.fn(),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/oauth/refresh`, {
      status: 503,
      body: { message: 'Service unavailable' }
    }, { method: 'POST' })

    await expect(login({})).rejects.toBeInstanceOf(TemporaryError)
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
    expect(fetchMock.calls(`${BASE_URL}user/v1/auth/otp`)).toHaveLength(0)
    expect(pluginData.currentData.auth).toEqual(savedAuth)
  })

  it('preserves saved authentication when token refresh response is incomplete', async () => {
    const savedAuth = {
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
      deviceTrustStatus: 'TRUSTED'
    }
    const pluginData = makePluginDataApi({ auth: savedAuth })
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      readLine: jest.fn(),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/oauth/refresh`, {
      status: 200,
      body: { accessToken: 'new-access-token' }
    }, { method: 'POST' })

    await expect(login({})).rejects.toBeInstanceOf(TemporaryError)
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
    expect(fetchMock.calls(`${BASE_URL}user/v1/auth/otp`)).toHaveLength(0)
    expect(pluginData.currentData.auth).toEqual(savedAuth)
  })

  it('requests login SMS only when the refresh token has explicitly expired', async () => {
    const pluginData = makePluginDataApi({
      auth: { accessToken: 'old-access-token', refreshToken: 'old-refresh-token', deviceTrustStatus: 'TRUSTED' }
    })
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      readLine: jest.fn().mockResolvedValueOnce(null),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/oauth/refresh`, {
      status: 498,
      body: { code: 'REFRESH_TOKEN_EXPIRED' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/auth/otp`, {
      status: 200,
      body: { secret: 'login-secret', validationType: 'OTP', expiredTime: 60 }
    }, { method: 'POST' })

    await expect(login({
      phone: '+375000000000',
      identificationNumber: 'TEST123',
      isResident: true
    })).rejects.toBeInstanceOf(InvalidOtpCodeError)
    expect(global.ZenMoney.readLine).toHaveBeenCalledTimes(1)
    expect(fetchMock.calls(`${BASE_URL}user/v1/auth/otp`)).toHaveLength(1)
    expect(pluginData.currentData.auth).toBeNull()
  })

  it('completes the captured phone verification without requesting fingerprint enrollment', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'OnePlus', brand: 'OnePlus', model: 'NE2211', os: { version: '11' } },
      readLine: jest.fn()
        .mockResolvedValueOnce('111111')
        .mockResolvedValueOnce('222222'),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/auth/otp`, {
      status: 200,
      body: { secret: 'login-secret', validationType: 'OTP', expiredTime: 60 }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/auth/otp/validation`, {
      status: 200,
      body: { secret: 'validated-login-secret' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/auth`, {
      status: 200,
      body: {
        actionType: 'SUCCESS_AUTHENTICATION',
        authData: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          deviceTrustStatus: 'NOT_TRUSTED_WITH_OTHER_TRUSTED'
        }
      }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/devices/verification`, {
      status: 200,
      body: {
        steps: [{ type: 'PHONE', status: 'ENABLED' }],
        policy: 'ALL_SUCCESS',
        status: 'IN_PROGRESS'
      }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/devices/verification/phone/otp`, {
      status: 200,
      body: {
        secret: 'device-secret',
        validationType: 'OTP',
        expiredTime: 60,
        creationStatus: 'NEW',
        recipient: '+375*********',
        recipientType: 'PHONE'
      }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/devices/verification/phone`, {
      status: 200,
      body: {
        steps: [{ type: 'PHONE', status: 'SUCCESS' }],
        policy: 'ALL_SUCCESS',
        status: 'SUCCESS'
      }
    }, { method: 'POST' })
    await expect(login({
      phone: '+375000000000',
      identificationNumber: 'TEST123',
      isResident: true
    })).resolves.toBe('access-token')

    expect(global.ZenMoney.readLine).toHaveBeenCalledTimes(2)
    expect(pluginData.currentData.auth).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      deviceTrustStatus: 'TRUSTED'
    })
    expect(fetchMock.calls().matched.map(([url]) => url)).toEqual([
      `${BASE_URL}user/v1/auth/otp`,
      `${BASE_URL}user/v1/auth/otp/validation`,
      `${BASE_URL}user/v1/auth`,
      `${BASE_URL}user/v1/devices/verification`,
      `${BASE_URL}user/v1/devices/verification/phone/otp`,
      `${BASE_URL}user/v1/devices/verification/phone`
    ])
    const [, deviceOtpRequest] = fetchMock.lastCall(`${BASE_URL}user/v1/devices/verification/phone`)
    expect(JSON.parse(deviceOtpRequest.body)).toEqual({ secret: 'device-secret', otp: '222222' })
  })

  it('does not request fingerprint enrollment after a trusted refresh', async () => {
    const pluginData = makePluginDataApi({
      auth: { accessToken: 'old-access-token', refreshToken: 'old-refresh-token', deviceTrustStatus: 'TRUSTED' }
    })
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', brand: 'zenmoney', model: 'Sync', os: { version: '15' } },
      readLine: jest.fn(),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/oauth/refresh`, {
      status: 200,
      body: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }
    }, { method: 'POST' })
    await expect(login({})).resolves.toBe('new-access-token')

    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
    expect(fetchMock.calls().matched.map(([url]) => url)).toEqual([
      `${BASE_URL}user/v1/oauth/refresh`
    ])
  })

  it('rejects an unsupported trusted-device verification step', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      readLine: jest.fn().mockResolvedValueOnce('111111'),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/auth/otp`, {
      status: 200,
      body: { secret: 'login-secret', expiredTime: 60 }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/auth/otp/validation`, {
      status: 200,
      body: { secret: 'validated-login-secret' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/auth`, {
      status: 200,
      body: {
        actionType: 'SUCCESS_AUTHENTICATION',
        authData: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          deviceTrustStatus: 'NOT_TRUSTED_WITH_OTHER_TRUSTED'
        }
      }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/devices/verification`, {
      status: 200,
      body: {
        steps: [{ type: 'EMAIL', status: 'ENABLED' }],
        policy: 'ALL_SUCCESS',
        status: 'IN_PROGRESS'
      }
    }, { method: 'POST' })

    await expect(login({
      phone: '+375000000000',
      identificationNumber: 'TEST123',
      isResident: true
    })).rejects.toMatchObject({
      message: expect.stringContaining('EMAIL')
    })
    expect(global.ZenMoney.readLine).toHaveBeenCalledTimes(1)
  })

  it('classifies an incorrect trusted-device SMS code as an invalid OTP', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      readLine: jest.fn()
        .mockResolvedValueOnce('111111')
        .mockResolvedValueOnce('222222'),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/auth/otp`, {
      status: 200,
      body: { secret: 'login-secret', expiredTime: 60 }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/auth/otp/validation`, {
      status: 200,
      body: { secret: 'validated-login-secret' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/auth`, {
      status: 200,
      body: {
        actionType: 'SUCCESS_AUTHENTICATION',
        authData: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          deviceTrustStatus: 'NOT_TRUSTED_WITH_OTHER_TRUSTED'
        }
      }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/devices/verification`, {
      status: 200,
      body: {
        steps: [{ type: 'PHONE', status: 'ENABLED' }],
        policy: 'ALL_SUCCESS',
        status: 'IN_PROGRESS'
      }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/devices/verification/phone/otp`, {
      status: 200,
      body: { secret: 'device-secret', validationType: 'OTP', expiredTime: 60 }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/devices/verification/phone`, {
      status: 400,
      body: { code: 'INCORRECT_OTP', userMessage: 'Некорректный код' }
    }, { method: 'POST' })

    await expect(login({
      phone: '+375000000000',
      identificationNumber: 'TEST123',
      isResident: true
    })).rejects.toBeInstanceOf(InvalidOtpCodeError)
  })

  it('migrates a legacy synthetic fingerprint without replacing device identifiers', async () => {
    const pluginData = makePluginDataApi({
      auth: { accessToken: 'old-access-token', refreshToken: 'old-refresh-token', deviceTrustStatus: 'TRUSTED' },
      device: {
        uuid: 'existing-uuid',
        fingerprint: {
          location: null,
          deviceId: 'existing-device-id',
          adsUUID: 'existing-ads-uuid'
        }
      }
    })
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', brand: 'zenmoney', model: 'Sync', os: { version: '9' } },
      readLine: jest.fn(),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/oauth/refresh`, {
      status: 200,
      body: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }
    }, { method: 'POST' })
    await expect(login({})).resolves.toBe('new-access-token')

    expect(pluginData.currentData.device).toEqual({
      uuid: 'existing-uuid',
      fingerprint: expect.objectContaining({
        location: { latitude: '53.900000', longitude: '27.566700' },
        deviceModel: 'samsung SM-S948B',
        deviceName: 'SM-S948B',
        deviceId: 'existing-device-id',
        adsUUID: 'existing-ads-uuid',
        osVersion: '16',
        buildDisplay: 'S948BXXS4AZG5',
        buildFingerprint: 'samsung/m3qxxx/m3q:16/BP4A.251205.006/S948BXXS4AZG5:user/release-keys'
      })
    })
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('paginates operations using the APK request contract', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      ...pluginData.methods
    }
    const firstPage = Array.from({ length: 20 }, (_, index) => ({ id: `operation-${index}` }))
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 200,
      body: { operations: firstPage, totalCount: 21 }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 200,
      body: { operations: [{ id: 'operation-20' }], totalCount: 21 }
    }, { method: 'POST' })

    const result = await fetchTransactions(
      'access-token',
      [{ id: 'card-1', type: 'card' }],
      new Date('2026-07-01T00:00:00Z'),
      new Date('2026-07-29T00:00:00Z')
    )

    expect(result).toHaveLength(21)
    const requestBodies = fetchMock.calls(`${BASE_URL}product-transaction/v1/operations`)
      .map(([, options]) => JSON.parse(options.body))
    expect(requestBodies).toEqual([{
      filter: {
        date: {
          till: '2026-07-29T00:00:00.000Z',
          from: '2026-07-01T00:00:00.000Z'
        },
        productTypes: [{ id: 'card-1', type: 'CARD' }]
      },
      pagination: { limit: 20, offset: 0 }
    }, {
      filter: {
        date: {
          till: '2026-07-29T00:00:00.000Z',
          from: '2026-07-01T00:00:00.000Z'
        },
        productTypes: [{ id: 'card-1', type: 'CARD' }]
      },
      pagination: { limit: 20, offset: 20 }
    }])
  })

  it('refreshes an expired bearer token and retries a protected request once', async () => {
    const pluginData = makePluginDataApi({
      auth: { accessToken: 'expired-access-token', refreshToken: 'old-refresh-token', deviceTrustStatus: 'TRUSTED' }
    })
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', brand: 'zenmoney', model: 'Sync', os: { version: '9' } },
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations/products`, {
      status: 401,
      body: { code: 'UNAUTHORIZED' }
    })
    fetchMock.once(`${BASE_URL}user/v1/oauth/refresh`, {
      status: 200,
      body: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations/products`, {
      status: 200,
      body: { cards: [], accounts: [], deposits: [] }
    })

    await expect(fetchAccounts('expired-access-token')).resolves.toEqual({
      cards: [],
      checkingAccounts: [],
      deposits: []
    })

    const productRequests = fetchMock.calls(`${BASE_URL}product-transaction/v1/operations/products`)
    expect(productRequests).toHaveLength(2)
    expect(productRequests[0][1].headers.Authorization).toBe('Bearer expired-access-token')
    expect(productRequests[1][1].headers.Authorization).toBe('Bearer new-access-token')
    expect(pluginData.currentData.auth).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      deviceTrustStatus: 'TRUSTED'
    })

    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 200,
      body: { operations: [], totalCount: 0 }
    }, { method: 'POST' })
    await fetchTransactions(
      'expired-access-token',
      [{ id: 'card-1', type: 'card' }],
      new Date('2026-07-01T00:00:00Z'),
      new Date('2026-07-29T00:00:00Z')
    )
    const [, operationsRequest] = fetchMock.lastCall(`${BASE_URL}product-transaction/v1/operations`)
    expect(operationsRequest.headers.Authorization).toBe('Bearer new-access-token')
    expect(fetchMock.calls(`${BASE_URL}user/v1/oauth/refresh`)).toHaveLength(1)
  })

  it('does not classify a product request INVALID_DATA response as invalid preferences', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 400,
      body: { code: 'INVALID_DATA', userMessage: 'Некорректный фильтр' }
    }, { method: 'POST' })

    const promise = fetchTransactions(
      'access-token',
      [{ id: 'card-1', type: 'card' }],
      new Date('2026-07-01T00:00:00Z')
    )
    await expect(promise).rejects.toBeInstanceOf(TemporaryError)
    await expect(promise).rejects.not.toBeInstanceOf(InvalidPreferencesError)
  })

  it('classifies the APK incorrect-phone response as invalid preferences', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      readLine: jest.fn(),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}user/v1/auth/otp`, {
      status: 400,
      body: { code: 'INCORRECT_PHONE_ERROR', userMessage: 'Некорректный номер телефона' }
    }, { method: 'POST' })

    await expect(login({
      phone: '+375000000000',
      identificationNumber: 'TEST123',
      isResident: true
    })).rejects.toBeInstanceOf(InvalidPreferencesError)
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('rejects malformed product arrays', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations/products`, {
      status: 200,
      body: { cards: null, accounts: [], deposits: [] }
    })

    await expect(fetchAccounts('access-token')).rejects.toBeInstanceOf(TemporaryError)
  })

  it('imports only deposits exposed by the operations service', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations/products`, {
      status: 200,
      body: { cards: [], accounts: [], deposits: [{ id: 'deposit-1' }] }
    })
    fetchMock.once(`${BASE_URL}deposit/v1/deposits/sync`, {
      status: 200,
      body: { deposits: [{ id: 'deposit-1' }, { id: 'deposit-hidden' }] }
    }, { method: 'POST' })

    await expect(fetchAccounts('access-token')).resolves.toEqual({
      cards: [],
      checkingAccounts: [],
      deposits: [{ id: 'deposit-1' }]
    })
  })

  it.each([
    'FRAUD_BLOCKED_ERROR',
    'MISSING_FATCA_DATA_BLOCKED_ERROR',
    'PHOBOS_BLOCKED_ERROR',
    'USER_AGREEMENTS_BLOCKED_ERROR',
    'USER_AML_BLOCKED_ERROR',
    'USER_FRAUD_BLOCKED_ERROR',
    'USER_MANUAL_BLOCKED_ERROR',
    'USER_OTP_BLOCKED_ERROR'
  ])('reports the %s bank block without exposing its internal service name', async code => {
    const pluginData = makePluginDataApi({
      auth: { accessToken: 'old-access-token', refreshToken: 'old-refresh-token', deviceTrustStatus: 'TRUSTED' }
    })
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      readLine: jest.fn(),
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations/products`, {
      status: 400,
      body: { code, message: 'User blocked by phobos' }
    })

    const promise = fetchAccounts('access-token')
    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining('Откройте приложение Iskra')
    })
    await expect(promise).rejects.not.toMatchObject({
      message: expect.stringContaining('phobos')
    })
  })

  it('rejects a malformed operations response', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 200,
      body: { totalCount: 1 }
    }, { method: 'POST' })

    await expect(fetchTransactions(
      'access-token',
      [{ id: 'card-1', type: 'card' }],
      new Date('2026-07-01T00:00:00Z')
    )).rejects.toBeInstanceOf(TemporaryError)
  })

  it('rejects a malformed operations total count', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 200,
      body: { operations: [], totalCount: 'unknown' }
    }, { method: 'POST' })

    await expect(fetchTransactions(
      'access-token',
      [{ id: 'card-1', type: 'card' }],
      new Date('2026-07-01T00:00:00Z')
    )).rejects.toBeInstanceOf(TemporaryError)
  })

  it('stops when the bank returns an empty page before totalCount is reached', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      ...pluginData.methods
    }
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 200,
      body: { operations: [], totalCount: 1 }
    }, { method: 'POST' })

    await expect(fetchTransactions(
      'access-token',
      [{ id: 'card-1', type: 'card' }],
      new Date('2026-07-01T00:00:00Z')
    )).rejects.toBeInstanceOf(TemporaryError)
  })
})
