const mockActivateDeviceToken = jest.fn()
const mockFetchAccounts = jest.fn()
const mockFetchFullTransactions = jest.fn()
const mockFetchLastTransactions = jest.fn()
const mockFetchTransactionsAccId = jest.fn()
const mockLogin = jest.fn()
const mockLoginDeviceToken = jest.fn()
const mockLogoff = jest.fn()
const mockParseTransactionsAndOverdraft = jest.fn()
const mockRegisterDeviceToken = jest.fn()
const mockBuildActivationDescriptor = jest.fn()
const mockCreateDeviceIdentity = jest.fn()
const mockCreateDeviceState = jest.fn()
const mockGenerateDevicePin = jest.fn()
const mockGenerateDeviceOtp = jest.fn()
const mockHashAccountLogin = jest.fn()
const mockOpenDeviceState = jest.fn()
const mockSealDeviceState = jest.fn()
const mockValidateDevicePin = jest.fn()

jest.mock('../api', () => ({
  activateDeviceToken: mockActivateDeviceToken,
  fetchAccounts: mockFetchAccounts,
  fetchBalance: jest.fn(),
  fetchFullTransactions: mockFetchFullTransactions,
  fetchLastTransactions: mockFetchLastTransactions,
  fetchTransactionsAccId: mockFetchTransactionsAccId,
  login: mockLogin,
  loginDeviceToken: mockLoginDeviceToken,
  logoff: mockLogoff,
  parseTransactionsAndOverdraft: mockParseTransactionsAndOverdraft,
  registerDeviceToken: mockRegisterDeviceToken
}))

jest.mock('../deviceOtp', () => ({
  createDeviceAuthorizationProvider: jest.requireActual('../deviceOtp').createDeviceAuthorizationProvider,
  buildActivationDescriptor: mockBuildActivationDescriptor,
  createDeviceIdentity: mockCreateDeviceIdentity,
  createDeviceState: mockCreateDeviceState,
  generateDevicePin: mockGenerateDevicePin,
  generateDeviceOtp: mockGenerateDeviceOtp,
  hashAccountLogin: mockHashAccountLogin,
  openDeviceState: mockOpenDeviceState,
  sealDeviceState: mockSealDeviceState,
  validateDevicePin: mockValidateDevicePin
}))

const { scrape } = require('../index')
const { createDeviceAuthorizationProvider } = jest.requireActual('../deviceOtp')
const { shouldFetchFullStatement } = jest.requireActual('../converters')

const LOGIN = 'user@example.com'
const GENERATED_PIN = '582041'
const LEGACY_PIN = '401582'
const ACCOUNT_HASH = 'account-hash'
const OTHER_ACCOUNT_HASH = 'other-account-hash'
const IDENTITY = { registrationDeviceId: 'registration-device-id' }
const DEVICE_STATE = {
  accountHash: ACCOUNT_HASH,
  deviceNo: 'device-number',
  otpKey: 'otp-key',
  identity: IDENTITY
}
const SEALED_ENVELOPE = {
  version: 1,
  salt: 'salt',
  iv: 'iv',
  ciphertext: 'ciphertext',
  mac: 'mac'
}
const ACTIVE_PIN_DATA = {
  version: 1,
  active: { accountHash: ACCOUNT_HASH, pin: GENERATED_PIN },
  pending: null
}
const PENDING_PIN_DATA = {
  version: 1,
  active: null,
  pending: { accountHash: ACCOUNT_HASH, pin: GENERATED_PIN }
}
let pluginStorage

function createZenMoney (initialData = {}) {
  pluginStorage = { ...initialData }
  global.ZenMoney = {
    getData: jest.fn(key => pluginStorage[key]),
    setData: jest.fn((key, value) => { pluginStorage[key] = value }),
    saveData: jest.fn(),
    isAccountSkipped: jest.fn(() => false),
    readLine: jest.fn()
  }
  return pluginStorage
}

function preferences (extra = {}) {
  return {
    login: LOGIN,
    password: 'password',
    ...extra
  }
}

async function scrapeWithoutAccounts (extraPreferences = {}) {
  return scrape({
    preferences: preferences(extraPreferences),
    fromDate: new Date('2026-08-01T00:00:00.000Z'),
    toDate: new Date('2026-09-01T00:00:00.000Z')
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  createZenMoney()
  mockHashAccountLogin.mockReturnValue(ACCOUNT_HASH)
  mockGenerateDevicePin.mockReturnValue(GENERATED_PIN)
  mockLogin.mockResolvedValueOnce('registration-sid').mockResolvedValueOnce('activation-sid')
  mockCreateDeviceIdentity.mockReturnValue(IDENTITY)
  mockRegisterDeviceToken.mockResolvedValue({
    activationPassword: 'A1B2C3D4',
    deviceNo: DEVICE_STATE.deviceNo,
    xfad: 'xfad'
  })
  mockBuildActivationDescriptor.mockReturnValue({
    derivationOtp: 'activation-otp',
    otpKey: DEVICE_STATE.otpKey
  })
  mockCreateDeviceState.mockReturnValue(DEVICE_STATE)
  mockSealDeviceState.mockReturnValue(SEALED_ENVELOPE)
  mockGenerateDeviceOtp.mockReturnValue('device-otp')
  mockLoginDeviceToken.mockResolvedValue('device-sid')
  mockLogoff.mockResolvedValue(undefined)
  mockFetchAccounts.mockResolvedValue([])
  mockFetchLastTransactions.mockResolvedValue([])
  mockFetchTransactionsAccId.mockResolvedValue({ transactionsAccId: null, conditionsAccId: null })
  mockParseTransactionsAndOverdraft.mockReturnValue({ overdraft: null, transactions: [] })
})

describe('statement source selection', () => {
  afterEach(() => { jest.useRealTimers() })

  it('uses protected mailbox statements for complete deposit and card history', () => {
    expect(shouldFetchFullStatement({
      type: 'deposit',
      transactionsAccId: 'deposit-statement'
    }, true)).toBe(true)

    expect(shouldFetchFullStatement({
      type: 'card',
      transactionsAccId: 'card-statement'
    }, true)).toBe(true)
  })

  it('does not request a statement without device authorization or an action id', () => {
    expect(shouldFetchFullStatement({
      type: 'deposit',
      transactionsAccId: 'deposit-statement'
    }, false)).toBe(false)

    expect(shouldFetchFullStatement({
      type: 'deposit',
      transactionsAccId: null
    }, true)).toBe(false)
  })

  // These clock models verify refresh and bounded waits without assuming bank OTP acceptance rules.
  it('[model] rechecks the current period for concurrent protected actions', async () => {
    jest.useFakeTimers({ now: 1000, doNotFake: ['performance'] })
    const generateOtp = jest.fn(() => `otp-${Math.floor(Date.now() / 30000)}`)
    const waitForNextOtpPeriod = jest.fn(async () => {
      jest.setSystemTime((Math.floor(Date.now() / 30000) + 1) * 30000 + 250)
    })
    const getDeviceAuthorization = createDeviceAuthorizationProvider(DEVICE_STATE, GENERATED_PIN, 'otp-0', {
      generateOtp,
      waitForNextOtpPeriod
    })

    await expect(Promise.all([
      getDeviceAuthorization(),
      getDeviceAuthorization()
    ])).resolves.toEqual([
      { deviceNo: DEVICE_STATE.deviceNo, otp: 'otp-1' },
      { deviceNo: DEVICE_STATE.deviceNo, otp: 'otp-1' }
    ])
    expect(waitForNextOtpPeriod).toHaveBeenCalledTimes(1)
    expect(generateOtp).toHaveBeenCalledTimes(3)
  })

  it('[model] refreshes authorization after the real OTP period changes', async () => {
    jest.useFakeTimers({ now: 1000, doNotFake: ['performance'] })
    const generateOtp = jest.fn(() => `otp-${Math.floor(Date.now() / 30000)}`)
    const waitForNextOtpPeriod = jest.fn(async () => {
      jest.setSystemTime((Math.floor(Date.now() / 30000) + 1) * 30000 + 250)
    })
    const getDeviceAuthorization = createDeviceAuthorizationProvider(DEVICE_STATE, GENERATED_PIN, 'otp-0', {
      generateOtp,
      waitForNextOtpPeriod
    })

    await expect(getDeviceAuthorization()).resolves.toEqual({
      deviceNo: DEVICE_STATE.deviceNo,
      otp: 'otp-1'
    })
    await expect(getDeviceAuthorization()).resolves.toEqual({
      deviceNo: DEVICE_STATE.deviceNo,
      otp: 'otp-1'
    })
    jest.setSystemTime(60250)
    await expect(getDeviceAuthorization()).resolves.toEqual({
      deviceNo: DEVICE_STATE.deviceNo,
      otp: 'otp-2'
    })
    expect(waitForNextOtpPeriod).toHaveBeenCalledTimes(1)
    expect(generateOtp).toHaveBeenCalledTimes(4)
  })

  it('[model] fails after two unchanged OTP periods instead of waiting forever', async () => {
    jest.useFakeTimers({ now: 1000, doNotFake: ['performance'] })
    const generateOtp = jest.fn(() => 'login-otp')
    const waitForNextOtpPeriod = jest.fn(async () => {})
    const getDeviceAuthorization = createDeviceAuthorizationProvider(DEVICE_STATE, GENERATED_PIN, 'login-otp', {
      generateOtp,
      waitForNextOtpPeriod
    })

    await expect(getDeviceAuthorization()).rejects.toMatchObject({
      message: 'Не удалось получить новый код авторизации BGPB. Проверьте дату и время на устройстве и повторите синхронизацию.'
    })
    expect(waitForNextOtpPeriod).toHaveBeenCalledTimes(2)
    expect(generateOtp).toHaveBeenCalledTimes(3)
  })
})

describe('device PIN lifecycle', () => {
  // [model] A user activation code is requested only for a new registration, not a stored session.
  it('[model] asks for activation only during creation and reuses the saved connection', async () => {
    mockRegisterDeviceToken.mockResolvedValueOnce({
      activationPassword: '', deviceNo: DEVICE_STATE.deviceNo, xfad: 'xfad'
    })
    ZenMoney.readLine.mockResolvedValueOnce('A1B2C3D4')
    mockOpenDeviceState.mockReturnValue(DEVICE_STATE)

    await expect(scrapeWithoutAccounts()).resolves.toEqual({ accounts: [], transactions: [] })
    await expect(scrapeWithoutAccounts()).resolves.toEqual({ accounts: [], transactions: [] })

    expect(ZenMoney.readLine).toHaveBeenCalledTimes(1)
    expect(mockRegisterDeviceToken).toHaveBeenCalledTimes(1)
    expect(mockLoginDeviceToken).toHaveBeenCalledTimes(2)
    expect(pluginStorage['deviceOtp/pin/v1']).toEqual(ACTIVE_PIN_DATA)
    expect(pluginStorage['deviceOtp/v1']).toEqual(SEALED_ENVELOPE)
  })

  // [model] Failure of a stored connection cannot start a new interactive activation.
  it('[model] preserves a stored-session failure without requesting another activation code', async () => {
    pluginStorage['deviceOtp/v1'] = SEALED_ENVELOPE
    pluginStorage['deviceOtp/pin/v1'] = ACTIVE_PIN_DATA
    mockOpenDeviceState.mockReturnValue(DEVICE_STATE)
    const failure = new Error('Model stored-session authorization failure')
    mockLoginDeviceToken.mockRejectedValueOnce(failure)

    await expect(scrapeWithoutAccounts()).rejects.toBe(failure)

    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled()
    expect(ZenMoney.setData).not.toHaveBeenCalled()
    expect(ZenMoney.saveData).not.toHaveBeenCalled()
    expect(pluginStorage).toEqual({ 'deviceOtp/v1': SEALED_ENVELOPE, 'deviceOtp/pin/v1': ACTIVE_PIN_DATA })
  })

  it('generates and persists its own PIN during first registration', async () => {
    await expect(scrapeWithoutAccounts()).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockGenerateDevicePin).toHaveBeenCalledTimes(1)
    expect(mockBuildActivationDescriptor).toHaveBeenCalledWith(expect.objectContaining({ pin: GENERATED_PIN }))
    expect(mockActivateDeviceToken).toHaveBeenCalledWith('activation-sid', DEVICE_STATE.deviceNo, 'activation-otp')
    expect(ZenMoney.setData.mock.calls[0]).toEqual(['deviceOtp/pin/v1', PENDING_PIN_DATA])
    expect(pluginStorage['deviceOtp/pin/v1']).toEqual(ACTIVE_PIN_DATA)
    expect(pluginStorage['deviceOtp/v1']).toEqual(SEALED_ENVELOPE)
    expect(ZenMoney.saveData).toHaveBeenCalledTimes(2)
    expect(ZenMoney.saveData.mock.invocationCallOrder[0]).toBeLessThan(mockLogin.mock.invocationCallOrder[0])
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(mockLoginDeviceToken).toHaveBeenCalledWith(DEVICE_STATE.deviceNo, 'device-otp')
    expect(mockGenerateDeviceOtp).toHaveBeenCalledTimes(1)
    expect(ZenMoney.locale).toBe('ru')
  })

  it('reuses the generated PIN from plugin data without registering again', async () => {
    pluginStorage['deviceOtp/v1'] = SEALED_ENVELOPE
    pluginStorage['deviceOtp/pin/v1'] = ACTIVE_PIN_DATA
    mockOpenDeviceState.mockReturnValue(DEVICE_STATE)

    await expect(scrapeWithoutAccounts()).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockValidateDevicePin).toHaveBeenCalledWith(GENERATED_PIN)
    expect(mockOpenDeviceState).toHaveBeenCalledWith(SEALED_ENVELOPE, GENERATED_PIN)
    expect(mockGenerateDevicePin).not.toHaveBeenCalled()
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled()
    expect(ZenMoney.setData).not.toHaveBeenCalled()
    expect(mockLoginDeviceToken).toHaveBeenCalledWith(DEVICE_STATE.deviceNo, 'device-otp')
    expect(mockGenerateDeviceOtp).toHaveBeenCalledTimes(1)
  })

  it('reuses a PIN persisted before an interrupted first registration', async () => {
    pluginStorage['deviceOtp/pin/v1'] = PENDING_PIN_DATA

    await expect(scrapeWithoutAccounts()).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockGenerateDevicePin).not.toHaveBeenCalled()
    expect(mockBuildActivationDescriptor).toHaveBeenCalledWith(expect.objectContaining({ pin: GENERATED_PIN }))
    expect(pluginStorage['deviceOtp/v1']).toEqual(SEALED_ENVELOPE)
  })

  it('migrates a legacy activation PIN into plugin data', async () => {
    pluginStorage['deviceOtp/v1'] = SEALED_ENVELOPE
    mockOpenDeviceState.mockReturnValue(DEVICE_STATE)

    await expect(scrapeWithoutAccounts({ appPin: LEGACY_PIN })).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockOpenDeviceState).toHaveBeenCalledWith(SEALED_ENVELOPE, LEGACY_PIN)
    expect(pluginStorage['deviceOtp/v1']).toBe(SEALED_ENVELOPE)
    expect(pluginStorage['deviceOtp/pin/v1']).toEqual({
      version: 1,
      active: { accountHash: ACCOUNT_HASH, pin: LEGACY_PIN },
      pending: null
    })
    expect(ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled()
  })

  it('uses the legacy PIN to recover from an incorrect persisted PIN', async () => {
    pluginStorage['deviceOtp/v1'] = SEALED_ENVELOPE
    pluginStorage['deviceOtp/pin/v1'] = ACTIVE_PIN_DATA
    mockOpenDeviceState
      .mockImplementationOnce(() => { throw new InvalidPreferencesError('wrong PIN') })
      .mockReturnValueOnce(DEVICE_STATE)

    await expect(scrapeWithoutAccounts({ appPin: LEGACY_PIN })).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockOpenDeviceState.mock.calls).toEqual([
      [SEALED_ENVELOPE, GENERATED_PIN],
      [SEALED_ENVELOPE, LEGACY_PIN]
    ])
    expect(pluginStorage['deviceOtp/pin/v1']).toEqual({
      version: 1,
      active: { accountHash: ACCOUNT_HASH, pin: LEGACY_PIN },
      pending: null
    })
  })

  it('does not hide a corrupted device token as a wrong PIN', async () => {
    pluginStorage['deviceOtp/v1'] = SEALED_ENVELOPE
    pluginStorage['deviceOtp/pin/v1'] = ACTIVE_PIN_DATA
    mockOpenDeviceState.mockImplementation(() => { throw new Error('invalid envelope') })

    await expect(scrapeWithoutAccounts()).rejects.toThrow('invalid envelope')

    expect(mockGenerateDevicePin).not.toHaveBeenCalled()
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled()
  })

  it('does not silently replace a legacy activation that has no usable PIN', async () => {
    pluginStorage['deviceOtp/v1'] = SEALED_ENVELOPE

    await expect(scrapeWithoutAccounts()).rejects.toMatchObject({
      message: 'Не удалось подтвердить сохраненную активацию BGPB. Пересоздайте подключение к плагину Белгазпромбанка с нуля. PIN вводить не нужно: он создается автоматически.'
    })

    expect(mockGenerateDevicePin).not.toHaveBeenCalled()
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled()
    expect(ZenMoney.setData).not.toHaveBeenCalled()
  })

  it('ignores the legacy preference for a brand-new registration', async () => {
    await scrapeWithoutAccounts({ appPin: LEGACY_PIN })

    expect(mockGenerateDevicePin).toHaveBeenCalledTimes(1)
    expect(mockBuildActivationDescriptor).toHaveBeenCalledWith(expect.objectContaining({ pin: GENERATED_PIN }))
    expect(mockBuildActivationDescriptor).not.toHaveBeenCalledWith(expect.objectContaining({ pin: LEGACY_PIN }))
  })

  // [model] An unusable saved PIN must not replace a connection or expose a manual PIN workflow.
  it('[model] asks to recreate an unusable activation while preserving saved state', async () => {
    pluginStorage['deviceOtp/v1'] = SEALED_ENVELOPE
    pluginStorage['deviceOtp/pin/v1'] = ACTIVE_PIN_DATA
    mockOpenDeviceState.mockImplementation(() => { throw new InvalidPreferencesError('model wrong PIN') })

    await expect(scrapeWithoutAccounts()).rejects.toMatchObject({
      message: 'Не удалось подтвердить сохраненную активацию BGPB. Пересоздайте подключение к плагину Белгазпромбанка с нуля. PIN вводить не нужно: он создается автоматически.'
    })

    expect(pluginStorage).toEqual({ 'deviceOtp/v1': SEALED_ENVELOPE, 'deviceOtp/pin/v1': ACTIVE_PIN_DATA })
    expect(ZenMoney.setData).not.toHaveBeenCalled()
    expect(ZenMoney.saveData).not.toHaveBeenCalled()
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockLoginDeviceToken).not.toHaveBeenCalled()
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled()
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('keeps the active PIN while retrying a failed registration for another account', async () => {
    const otherAccountState = { ...DEVICE_STATE, accountHash: OTHER_ACCOUNT_HASH }
    const otherPinData = {
      version: 1,
      active: { accountHash: OTHER_ACCOUNT_HASH, pin: LEGACY_PIN },
      pending: null
    }
    pluginStorage['deviceOtp/v1'] = SEALED_ENVELOPE
    pluginStorage['deviceOtp/pin/v1'] = otherPinData
    mockOpenDeviceState.mockReturnValue(otherAccountState)
    mockLogin.mockResolvedValue('password-sid')
    mockRegisterDeviceToken.mockRejectedValueOnce(new Error('network failed'))

    await expect(scrapeWithoutAccounts()).rejects.toThrow('network failed')

    expect(pluginStorage['deviceOtp/pin/v1']).toEqual({
      version: 1,
      active: otherPinData.active,
      pending: { accountHash: ACCOUNT_HASH, pin: GENERATED_PIN }
    })

    await expect(scrapeWithoutAccounts()).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockGenerateDevicePin).toHaveBeenCalledTimes(1)
    expect(mockOpenDeviceState).toHaveBeenCalledTimes(1)
    expect(pluginStorage['deviceOtp/pin/v1']).toEqual(ACTIVE_PIN_DATA)
  })

  it('does not contact the bank when the generated PIN cannot be persisted', async () => {
    ZenMoney.saveData.mockImplementationOnce(() => { throw new Error('save failed') })

    await expect(scrapeWithoutAccounts()).rejects.toThrow('save failed')

    expect(pluginStorage['deviceOtp/pin/v1']).toEqual(PENDING_PIN_DATA)
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockRegisterDeviceToken).not.toHaveBeenCalled()
  })
})
