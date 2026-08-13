import fetchMock from 'fetch-mock'
import { scrape } from '..'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'

const BASE_URL = 'https://bnb-mobile.bnb.by/'

describe('scrape', () => {
  afterEach(() => fetchMock.restore())

  it('authenticates through Iskra and converts products and operations', async () => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      isAccountSkipped: jest.fn().mockReturnValue(false),
      readLine: jest.fn()
        .mockResolvedValueOnce('123456')
        .mockResolvedValueOnce('112233')
        .mockResolvedValueOnce('654321'),
      ...pluginData.methods
    }

    fetchMock.once(`${BASE_URL}user/v1/auth/otp`, {
      status: 200,
      body: { secret: 'otp-request-secret', expiredTime: 60, otpLength: 6 }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/auth/otp/validation`, {
      status: 200,
      body: { secret: 'validated-secret' }
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
        secret: 'device-verification-secret',
        validationType: 'OTP',
        expiredTime: 60,
        otpLength: 6
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
    fetchMock.once(`${BASE_URL}user/v1/fingerprint`, {
      status: 200,
      body: { referenceState: 'NEED_CREATE_UPDATE', fingerprintId: 'fingerprint-id' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/fingerprint/reference/verification`, {
      status: 200,
      body: {
        secret: 'device-otp-secret',
        validationType: 'OTP',
        expiredTime: 60,
        otpLength: 6
      }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/users/otp/validation`, {
      status: 200,
      body: { secret: 'device-task-id' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/fingerprint/reference`, {
      status: 204
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations/products`, {
      status: 200,
      body: {
        cards: [{
          id: 'card-1',
          name: '1-2-3',
          balance: { amount: '125.40', currency: 'BYN', sign: 'PLUS' },
          pan: '5355********1234'
        }],
        accounts: [],
        credits: [],
        deposits: [{
          id: 'deposit-1',
          name: 'Верное решение',
          balance: { amount: '1000.00', currency: 'USD', sign: 'PLUS' }
        }]
      }
    })
    fetchMock.once(`${BASE_URL}deposit/v1/deposits/sync`, {
      status: 200,
      body: {
        deposits: [{
          id: 'deposit-1',
          name: 'Верное решение',
          balance: { amount: '1000.00', currency: 'USD', sign: 'PLUS' },
          contractOpenDate: '2025-06-01',
          contractEndDate: '2026-06-01',
          interestRateType: 'FIXED',
          currentInterestRate: '5.25',
          maxInterestRate: null,
          isIrrevocable: false
        }]
      }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 200,
      body: {
        operations: [{
          id: 'operation-1',
          idType: 'OPERATION',
          productId: 'card-1',
          productType: 'CARD',
          paymentDate: '2026-07-28T12:30:00+03:00',
          operationName: 'Оплата товаров и услуг',
          operationDetail: {
            operationDate: '2026-07-28T12:29:00+03:00',
            merchantName: 'COFFEE SHOP',
            mccCode: '5814',
            terminalLocation: 'BLR MINSK',
            authorizationCode: '654321',
            statusCode: 'EXECUTED'
          },
          operationSum: { amount: '12.50', currency: 'BYN', sign: 'MINUS' },
          transactionSum: { amount: '12.50', currency: 'BYN', sign: 'MINUS' }
        }],
        totalCount: 1
      }
    }, { method: 'POST' })

    const result = await scrape({
      preferences: {
        phone: '+375000000000',
        identificationNumber: 'TEST123',
        isResident: 'true'
      },
      fromDate: new Date('2026-07-01T00:00:00Z'),
      toDate: new Date('2026-07-29T00:00:00Z')
    })

    expect(result.accounts).toEqual([{
      id: 'card-1',
      type: 'card',
      title: '1-2-3',
      currencyCode: 'BYN',
      instrument: 'BYN',
      balance: 125.4,
      syncID: ['card-1', '1234']
    }, {
      id: 'deposit-1',
      type: 'deposit',
      title: 'Депозит Верное решение',
      currencyCode: 'USD',
      instrument: 'USD',
      balance: 1000,
      syncID: ['deposit-1'],
      startDate: new Date('2025-06-01'),
      startBalance: 1000,
      capitalization: true,
      percent: 5.25,
      endDateOffsetInterval: 'day',
      endDateOffset: 365,
      payoffInterval: 'month',
      payoffStep: 1
    }])
    expect(result.transactions).toEqual([{
      date: new Date('2026-07-28T09:29:00Z'),
      movements: [{
        id: 'OPERATION:operation-1',
        account: { id: 'card-1' },
        invoice: null,
        sum: -12.5,
        fee: 0
      }],
      merchant: {
        title: 'COFFEE SHOP',
        mcc: 5814,
        city: 'MINSK',
        country: 'BLR',
        location: null
      },
      comment: 'Оплата товаров и услуг',
      hold: false
    }])
    expect(pluginData.currentData.auth).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      deviceTrustStatus: 'TRUSTED'
    })
    expect(pluginData.currentData.device).toMatchObject({
      uuid: expect.stringMatching(/^[0-9a-f-]{36}$/),
      fingerprint: {
        deviceModel: 'samsung SM-S948B',
        deviceName: 'SM-S948B',
        locale: 'ru-RU'
      }
    })
    expect(global.ZenMoney.readLine).toHaveBeenCalledTimes(3)
    expect(fetchMock.calls(`${BASE_URL}user/v1/fingerprint`)).toHaveLength(1)
    expect(pluginData.saveDataRequested).toBe(true)
  })

  it('returns skipped accounts without requesting their operations', async () => {
    const pluginData = makePluginDataApi({
      auth: {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token',
        deviceTrustStatus: 'TRUSTED'
      }
    })
    global.ZenMoney = {
      device: { manufacturer: 'Zenmoney', model: 'Sync' },
      isAccountSkipped: jest.fn(id => id === 'card-skipped'),
      readLine: jest.fn(),
      ...pluginData.methods
    }

    fetchMock.once(`${BASE_URL}user/v1/oauth/refresh`, {
      status: 200,
      body: { accessToken: 'access-token', refreshToken: 'refresh-token' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}user/v1/fingerprint`, {
      status: 200,
      body: { referenceState: 'CONFIRMED', fingerprintId: 'fingerprint-id' }
    }, { method: 'POST' })
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations/products`, {
      status: 200,
      body: {
        cards: [{
          id: 'card-active',
          name: 'Активная карта',
          balance: { amount: '10.00', currency: 'BYN', sign: 'PLUS' }
        }, {
          id: 'card-skipped',
          name: 'Пропущенная карта',
          balance: { amount: '20.00', currency: 'BYN', sign: 'PLUS' }
        }],
        accounts: [],
        deposits: []
      }
    })
    fetchMock.once(`${BASE_URL}product-transaction/v1/operations`, {
      status: 200,
      body: { operations: [], totalCount: 0 }
    }, { method: 'POST' })

    const result = await scrape({
      preferences: {},
      fromDate: new Date('2026-07-01T00:00:00Z'),
      toDate: new Date('2026-07-29T00:00:00Z')
    })

    expect(result.accounts.map(account => account.id)).toEqual(['card-active', 'card-skipped'])
    const [, operationsRequest] = fetchMock.lastCall(`${BASE_URL}product-transaction/v1/operations`)
    expect(JSON.parse(operationsRequest.body).filter.productTypes).toEqual([
      { id: 'card-active', type: 'CARD' }
    ])
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
  })
})
