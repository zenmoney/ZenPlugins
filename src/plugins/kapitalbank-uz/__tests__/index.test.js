import fetchMock from 'fetch-mock'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'
import { TemporaryError } from '../../../errors'
import { scrape } from '..'

const BASE_URL = 'https://b2c-api.kapitalbank.uz/api/v1'
const preferences = {
  phone: '998000000000',
  password: 'test-password'
}
const fromDate = new Date('2026-01-01T00:00:00.000Z')
const storedAuth = {
  deviceId: 'device-id',
  sessionId: 'session-id',
  guid: 'user-guid',
  accessToken: 'access-token',
  refreshToken: 'refresh-token'
}

function createZenMoney (initialData = {}) {
  const pluginData = makePluginDataApi(initialData)
  global.ZenMoney = {
    ...pluginData.methods,
    isAccountSkipped: jest.fn().mockReturnValue(false),
    readLine: jest.fn().mockResolvedValue('000000'),
    takePicture: jest.fn()
  }
  return { pluginData, zenMoney: global.ZenMoney }
}

function mockEmptyScrape () {
  fetchMock.once(/\/cards\?/, { status: 200, body: [] })
  fetchMock.once(`${BASE_URL}/accounts`, { status: 200, body: [] })
  fetchMock.once(`${BASE_URL}/deposits`, { status: 200, body: [] })
}

describe('scrape', () => {
  afterEach(() => fetchMock.restore())

  it('does not request or log a camera image during a regular sync', async () => {
    const { zenMoney } = createZenMoney({ auth: storedAuth })
    mockEmptyScrape()

    await expect(scrape({ preferences, fromDate, isFirstRun: false })).resolves.toEqual({
      accounts: [],
      transactions: []
    })

    expect(zenMoney.takePicture).not.toHaveBeenCalled()
    expect(fetchMock.calls(`${BASE_URL}/auth/by-password`)).toHaveLength(0)
  })

  it('does not retry arbitrary API failures through interactive authentication', async () => {
    createZenMoney({ auth: storedAuth })
    fetchMock.once(/\/cards\?/, {
      status: 503,
      body: { errorDetail: 'Bank API is unavailable' }
    })

    await expect(scrape({ preferences, fromDate, isFirstRun: false })).rejects.toBeInstanceOf(TemporaryError)
    expect(fetchMock.calls(`${BASE_URL}/auth/by-password`)).toHaveLength(0)
  })

  it('refreshes an expired token and retries the scrape once', async () => {
    const { pluginData } = createZenMoney({
      auth: {
        ...storedAuth,
        accessToken: 'expired-token'
      }
    })
    fetchMock.once(/\/cards\?/, {
      status: 401,
      body: { errorDetail: 'Token expired' }
    })
    fetchMock.once(`${BASE_URL}/auth/tokens/re-creation`, {
      status: 200,
      body: {
        guid: 'user-guid',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
    })
    mockEmptyScrape()

    await expect(scrape({ preferences, fromDate, isFirstRun: false })).resolves.toEqual({
      accounts: [],
      transactions: []
    })

    expect(pluginData.currentData).toEqual({
      auth: {
        ...storedAuth,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
    })
    expect(pluginData.saveDataRequested).toBe(true)
  })

  it('stores tokens after first-run SMS authentication without requesting a photo', async () => {
    const { pluginData, zenMoney } = createZenMoney()
    fetchMock.once(`${BASE_URL}/auth/phone-number/998000000000`, {
      status: 200,
      body: { exist: true }
    })
    fetchMock.once(`${BASE_URL}/auth/by-password`, {
      status: 200,
      body: {
        verificationCode: 'verification-code',
        maskedPhoneNumber: '+998 ** *** ** 00',
        otpRequired: true,
        isSDKNeeded: false,
        sendingSources: [{ source: 'SMS', isAllowed: true }]
      }
    })
    fetchMock.once(`${BASE_URL}/auth/verify-by-password`, {
      status: 200,
      body: {
        guid: 'user-guid',
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }
    })
    mockEmptyScrape()

    await expect(scrape({ preferences, fromDate, isFirstRun: true })).resolves.toEqual({
      accounts: [],
      transactions: []
    })

    expect(pluginData.currentData).toEqual({
      auth: {
        deviceId: expect.any(String),
        sessionId: expect.any(String),
        guid: 'user-guid',
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }
    })
    expect(pluginData.saveDataRequested).toBe(true)
    expect(zenMoney.readLine).toHaveBeenCalledWith(
      'Введите код из СМС, отправленный на +998 ** *** ** 00',
      { inputType: 'number', time: 120000 }
    )
    expect(zenMoney.takePicture).not.toHaveBeenCalled()
  })

  it('finishes authentication without prompting when OTP is not required', async () => {
    const { zenMoney } = createZenMoney()
    fetchMock.once(`${BASE_URL}/auth/phone-number/998000000000`, {
      status: 200,
      body: { exist: true }
    })
    fetchMock.once(`${BASE_URL}/auth/by-password`, {
      status: 200,
      body: {
        verificationCode: 'verification-code',
        otpRequired: false,
        isSDKNeeded: false,
        sendingSources: []
      }
    })
    fetchMock.once(`${BASE_URL}/auth/verify-by-password`, {
      status: 200,
      body: {
        guid: 'user-guid',
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }
    })
    mockEmptyScrape()

    await scrape({ preferences, fromDate, isFirstRun: true })

    expect(zenMoney.readLine).not.toHaveBeenCalled()
    const [, request] = fetchMock.lastCall(`${BASE_URL}/auth/verify-by-password`)
    expect(JSON.parse(request.body)).toEqual({ verificationCode: 'verification-code' })
  })

  it('keeps the initial SMS channel when Telegram resend is available', async () => {
    const { zenMoney } = createZenMoney()
    fetchMock.once(`${BASE_URL}/auth/phone-number/998000000000`, {
      status: 200,
      body: { exist: true }
    })
    fetchMock.once(`${BASE_URL}/auth/by-password`, {
      status: 200,
      body: {
        verificationCode: 'sms-verification-code',
        maskedPhone: '+998 ** *** ** 00',
        otpRequired: true,
        sendingSources: [
          { source: 'SMS', isAllowed: false },
          { source: 'TELEGRAM', isAllowed: true }
        ]
      }
    })
    fetchMock.once(`${BASE_URL}/auth/verify-by-password`, {
      status: 200,
      body: {
        guid: 'user-guid',
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }
    })
    mockEmptyScrape()

    await scrape({ preferences, fromDate, isFirstRun: true })

    const passwordRequests = fetchMock.calls(`${BASE_URL}/auth/by-password`)
    expect(passwordRequests.map(([, request]) => JSON.parse(request.body))).toEqual([
      {
        phoneNumber: '998000000000',
        password: 'test-password',
        otpSendingSource: 'SMS'
      }
    ])
    expect(zenMoney.readLine).toHaveBeenCalledWith(
      'Введите код из СМС, отправленный на +998 ** *** ** 00',
      { inputType: 'number', time: 120000 }
    )
  })

  it('reauthenticates without OTP after both access and refresh tokens expire', async () => {
    const { pluginData, zenMoney } = createZenMoney({
      auth: {
        ...storedAuth,
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh-token'
      }
    })
    fetchMock.once(/\/cards\?/, {
      status: 401,
      body: { errorDetail: 'Access token expired' }
    })
    fetchMock.once(`${BASE_URL}/auth/tokens/re-creation`, {
      status: 401,
      body: { errorDetail: 'Refresh token expired' }
    })
    fetchMock.once(`${BASE_URL}/auth/by-password`, {
      status: 200,
      body: {
        verificationCode: 'verification-code',
        otpRequired: false,
        sendingSources: []
      }
    })
    fetchMock.once(`${BASE_URL}/auth/verify-by-password`, {
      status: 200,
      body: {
        guid: 'user-guid',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
    })
    mockEmptyScrape()

    await scrape({ preferences, fromDate, isFirstRun: false })

    expect(zenMoney.readLine).not.toHaveBeenCalled()
    expect(pluginData.currentData).toEqual({
      auth: {
        ...storedAuth,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
    })
  })

  it('fetches products, converts their transactions and merges both transfer sides', async () => {
    createZenMoney({ auth: storedAuth })
    const apiAccounts = [
      {
        guid: 'AP-00000000-0000-0000-0000-000000000001',
        accountNumber: '20200000000000000001',
        currency: { name: 'USD', scale: 2 },
        balance: 10000
      },
      {
        guid: 'AP-00000000-0000-0000-0000-000000000002',
        accountNumber: '20200000000000000002',
        currency: { name: 'USD', scale: 2 },
        balance: 20000
      }
    ]
    const makeTransfer = transactionType => ({
      group: { title: 'Переводы', type: 'P2P' },
      module: 'P2P',
      transactionDate: transactionType === 'DEBIT'
        ? '2026-01-10 12:00:00.+0000'
        : '2026-01-10 12:00:01.+0000',
      transactionGuid: '00000000-0000-0000-0000-000000000003',
      transactionType,
      status: 'SUCCESS',
      name: 'IVAN IVANOV',
      amount: 1000,
      currency: { name: 'USD', scale: 2 }
    })

    fetchMock.once(/\/cards\?/, { status: 200, body: [] })
    fetchMock.once(`${BASE_URL}/accounts`, { status: 200, body: apiAccounts })
    fetchMock.once(`${BASE_URL}/deposits`, { status: 200, body: [] })
    fetchMock.once(/productGuid=AP-00000000-0000-0000-0000-000000000001/, {
      status: 200,
      body: { content: [makeTransfer('DEBIT')], totalPages: 1 }
    })
    fetchMock.once(/productGuid=AP-00000000-0000-0000-0000-000000000002/, {
      status: 200,
      body: { content: [makeTransfer('CREDIT')], totalPages: 1 }
    })

    await expect(scrape({
      preferences,
      fromDate,
      toDate: new Date('2026-01-31T00:00:00.000Z')
    })).resolves.toEqual({
      accounts: [
        {
          id: 'AP-00000000-0000-0000-0000-000000000001',
          title: 'Счёт USD *0001',
          syncIds: ['20200000000000000001'],
          instrument: 'USD',
          type: 'checking',
          balance: 100
        },
        {
          id: 'AP-00000000-0000-0000-0000-000000000002',
          title: 'Счёт USD *0002',
          syncIds: ['20200000000000000002'],
          instrument: 'USD',
          type: 'checking',
          balance: 200
        }
      ],
      transactions: [{
        date: new Date('2026-01-10T12:00:00.000Z'),
        hold: false,
        merchant: null,
        comment: null,
        movements: [
          {
            id: '00000000-0000-0000-0000-000000000003',
            account: { id: 'AP-00000000-0000-0000-0000-000000000001' },
            invoice: null,
            sum: -10,
            fee: 0
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            account: { id: 'AP-00000000-0000-0000-0000-000000000002' },
            invoice: null,
            sum: 10,
            fee: 0
          }
        ]
      }]
    })
  })

  it('uses cold authentication instead of migrating legacy authentication fields', async () => {
    const { pluginData, zenMoney } = createZenMoney({
      deviceId: 'legacy-device-id',
      sessionId: 'legacy-session-id',
      requestId: 'legacy-request-id',
      guid: 'legacy-user-guid',
      accessToken: 'legacy-access-token',
      refreshToken: 'legacy-refresh-token',
      isFirstRun: false
    })
    fetchMock.once(`${BASE_URL}/auth/phone-number/998000000000`, {
      status: 200,
      body: { exist: true }
    })
    fetchMock.once(`${BASE_URL}/auth/by-password`, {
      status: 200,
      body: {
        verificationCode: 'verification-code',
        otpRequired: false,
        sendingSources: []
      }
    })
    fetchMock.once(`${BASE_URL}/auth/verify-by-password`, {
      status: 200,
      body: {
        guid: 'new-user-guid',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
    })
    mockEmptyScrape()

    await scrape({ preferences, fromDate, isFirstRun: false })

    expect(pluginData.currentData).toEqual({
      auth: {
        deviceId: expect.any(String),
        sessionId: expect.any(String),
        guid: 'new-user-guid',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
    })
    expect(pluginData.currentData.auth.deviceId).not.toBe('legacy-device-id')
    expect(pluginData.currentData.auth.sessionId).not.toBe('legacy-session-id')
    expect(fetchMock.calls(`${BASE_URL}/auth/tokens/re-creation`)).toHaveLength(0)
    expect(zenMoney.readLine).not.toHaveBeenCalled()
  })

  it('leaves required MyID identification to the official app', async () => {
    const { zenMoney } = createZenMoney()
    fetchMock.once(`${BASE_URL}/auth/phone-number/998000000000`, {
      status: 200,
      body: { exist: true }
    })
    fetchMock.once(`${BASE_URL}/auth/by-password`, {
      status: 403,
      body: { errorDetail: 'Identification required' }
    })

    let error
    try {
      await scrape({ preferences, fromDate, isFirstRun: true })
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(TemporaryError)
    expect(error).toEqual(expect.objectContaining({
      message: expect.stringContaining('приложения Kapitalbank')
    }))
    expect(zenMoney.takePicture).not.toHaveBeenCalled()
  })
})
