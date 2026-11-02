import { ZPAPIError } from '../../../errors'
import { AccountType, Transaction } from '../../../types/zenmoney'
import { AuthenticationOptions } from '../api'
import { Session } from '../models'

const mockCreateClient = jest.fn()
const mockFetchGraph = jest.fn()
const mockFetchHistory = jest.fn()
const mockConvertAccounts = jest.fn()
const mockConvertTransactions = jest.fn()
jest.mock('../api', () => ({ createClient: mockCreateClient, fetchAccountGraph: mockFetchGraph, fetchHistory: mockFetchHistory }))
jest.mock('../converters', () => ({ convertAccounts: mockConvertAccounts, convertTransactions: mockConvertTransactions }))

// Internal domain objects exercise entrypoint persistence and selection; neither
// the provider transport nor the financial converters are mocked with bank data.
describe('[model] Q-Pay entrypoint', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrape } = require('../index') as typeof import('../index')
  const originalZenMoney = global.ZenMoney
  const setData = jest.fn()
  const saveData = jest.fn()
  const isAccountSkipped = jest.fn()
  const args = { preferences: { email: 'model@example.invalid' }, fromDate: new Date('2026-01-01T00:00:00Z'), isFirstRun: false, isInBackground: false }
  const client = { run: jest.fn() }
  const accountA = { id: 'model-a', type: AccountType.checking, title: 'Model A', instrument: 'USD', syncIds: ['model-a'] }
  const accountB = { id: 'model-b', type: AccountType.checking, title: 'Model B', instrument: 'USD', syncIds: ['model-b'] }
  const accountC = { id: 'model-c', type: AccountType.ccard, title: 'Model C', instrument: 'USD', syncIds: ['model-c'] }

  beforeEach(() => {
    jest.clearAllMocks()
    global.ZenMoney = { getData: jest.fn(), setData, saveData, isAccountSkipped } as unknown as typeof ZenMoney
    mockCreateClient.mockResolvedValue(client)
    mockFetchGraph.mockResolvedValue({})
    mockFetchHistory.mockResolvedValue({ operations: [], cards: [] })
    mockConvertAccounts.mockReturnValue([{ accounts: [accountA], fetchParams: { kind: 'wallet' } }])
    mockConvertTransactions.mockReturnValue([])
    isAccountSkipped.mockReturnValue(false)
  })
  afterEach(() => { global.ZenMoney = originalZenMoney })

  it('physically saves confirmed authorization before a later loading failure and propagates that failure', async () => {
    const session: Session = {
      version: 2,
      email: 'model@example.invalid',
      tenantId: 'model-tenant',
      device: { id: 'model-device', fingerprint: 'model-fingerprint' },
      accessToken: 'model-access',
      refreshToken: 'model-refresh',
      expiresAt: 1798761600000,
      stage: 'active',
      methods: [],
      pinReset: false
    }
    mockCreateClient.mockImplementation(async (_preferences: unknown, _stored: unknown, _device: unknown, options: AuthenticationOptions) => {
      await options.saveSession(session)
      return client
    })
    const failure = new Error('model account loading failure')
    mockFetchGraph.mockImplementation(async () => {
      expect(setData).toHaveBeenCalledWith('session', session)
      expect(saveData).toHaveBeenCalledTimes(1)
      throw failure
    })
    await expect(scrape(args)).rejects.toBe(failure)
    expect(ZenMoney.locale).toBe('ru')
  })

  it('executes a shared plan once, skips selected histories and retains all discovered accounts', async () => {
    const included: Transaction = {
      date: new Date('2026-01-02T00:00:00Z'),
      hold: false,
      movements: [{ id: 'model-included', account: { id: 'model-a' }, sum: 5, fee: 0, invoice: null }],
      merchant: null,
      comment: null
    }
    const skipped: Transaction = {
      date: new Date('2026-01-02T00:00:00Z'),
      hold: false,
      movements: [{ id: 'model-skipped', account: { id: 'model-b' }, sum: 5, fee: 0, invoice: null }],
      merchant: null,
      comment: null
    }
    mockConvertAccounts.mockReturnValue([
      { accounts: [accountA, accountB], fetchParams: { kind: 'wallet' } },
      { account: accountC, fetchParams: { kind: 'card', cardId: 'model-card' } }
    ])
    isAccountSkipped.mockImplementation((id: string) => id !== 'model-a')
    mockConvertTransactions.mockReturnValue([included, skipped])
    await expect(scrape(args)).resolves.toEqual({ accounts: [accountA, accountB, accountC], transactions: [included] })
    expect(mockFetchHistory).toHaveBeenCalledTimes(1)
    expect(mockFetchHistory).toHaveBeenCalledWith(client, { kind: 'wallet' }, args.fromDate, undefined)
  })

  it('rejects an empty account result as an ordinary reportable failure', async () => {
    mockConvertAccounts.mockReturnValue([])
    const error = await scrape(args).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(mockFetchHistory).not.toHaveBeenCalled()
  })
})
