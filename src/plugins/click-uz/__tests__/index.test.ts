const mockColdAuth = jest.fn()
const mockHotAuth = jest.fn()
const mockFetchAccounts = jest.fn()
const mockFetchTransactions = jest.fn()

jest.mock('../api', () => ({
  coldAuth: mockColdAuth,
  hotAuth: mockHotAuth,
  fetchAccounts: mockFetchAccounts,
  fetchTransactions: mockFetchTransactions
}))

const storedAuth = {
  imei: 'stored-imei',
  deviceId: 'stored-device-id',
  authToken: 'stored-auth-token',
  sessionKey: 'stored-session-key'
}

const newAuth = {
  imei: 'new-imei',
  deviceId: 'new-device-id',
  authToken: 'new-auth-token',
  sessionKey: 'new-session-key'
}

function mockStorage (data: Record<string, unknown>): void {
  global.ZenMoney = {
    getData: jest.fn((key: string) => data[key]),
    setData: jest.fn(),
    saveData: jest.fn(),
    clearData: jest.fn(),
    isAccountSkipped: jest.fn(() => false)
  } as unknown as typeof ZenMoney
}

describe('Click auth persistence', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getStoredAuth, scrape } = require('../index') as typeof import('../index')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SessionExpiredError } = require('../fetchApi') as typeof import('../fetchApi')

  beforeEach(() => {
    jest.clearAllMocks()
    mockColdAuth.mockResolvedValue(newAuth)
    mockHotAuth.mockResolvedValue(newAuth)
    mockFetchAccounts.mockResolvedValue({ cards: [], balances: [] })
  })

  it('preserves a complete auth object and ignores obsolete top-level fields', () => {
    mockStorage({ auth: storedAuth, sessionKey: 'obsolete-session-key' })

    expect(getStoredAuth()).toEqual(storedAuth)
    expect(ZenMoney.clearData).not.toHaveBeenCalled()
  })

  it.each([
    ['legacy fields', { sessionKey: 'legacy-session-key', deviceId: 'legacy-device-id' }],
    ['partial auth', { auth: { deviceId: 'partial-device-id' } }],
    ['empty auth fields', { auth: { ...storedAuth, authToken: '' } }]
  ])('clears %s so the next run performs cold auth', (_label, data) => {
    mockStorage(data)

    expect(getStoredAuth()).toBeUndefined()
    expect(ZenMoney.clearData).toHaveBeenCalledTimes(1)
    expect(ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it('falls back from an expired hot session to cold authentication', async () => {
    mockStorage({ auth: storedAuth })
    mockHotAuth.mockRejectedValue(new SessionExpiredError('Authentication required', 200))

    await expect(scrape({
      preferences: { phone: '998001234567', password: '12345' },
      fromDate: new Date('2026-08-01T00:00:00.000Z'),
      toDate: new Date('2026-08-07T00:00:00.000Z'),
      isFirstRun: false,
      isInBackground: false
    })).resolves.toEqual({ accounts: [], transactions: [] })

    expect(mockHotAuth).toHaveBeenCalledWith({ phone: '998001234567', password: '12345' }, storedAuth)
    expect(mockColdAuth).toHaveBeenCalledWith({ phone: '998001234567', password: '12345' })
    expect(ZenMoney.setData).toHaveBeenCalledWith('auth', newAuth)
  })
})
