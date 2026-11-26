import { AccountType, AccountOrCard, ScrapeFunc } from '../../../../types/zenmoney'
import { UserInteractionError, TemporaryError } from '../../../../errors'
import { assertCashbackPayload } from '../../../../common/cashback/validate'

jest.mock('../../api', () => ({ parsePdfStatements: jest.fn(), getMobileExchangeRates: jest.fn() }))
jest.mock('../../../../common/ui', () => ({ ui: { readLine: jest.fn(), alert: jest.fn() } }))

const { scrape } = jest.requireActual<typeof import('../../index')>('../../index')
const { parsePdfStatements, getMobileExchangeRates } = jest.requireMock<jest.Mocked<typeof import('../../api')>>('../../api')
const { ui } = jest.requireMock<{ ui: jest.Mocked<typeof import('../../../../common/ui').ui> }>('../../../../common/ui')
const { cashbackMonth, configureCashbacks, readCashbackSettings } = jest.requireActual<typeof import('../../cashback-api')>('../../cashback-api')

// Domain objects model orchestration only; no PDF parsing or bank response is simulated.
const card: AccountOrCard = { id: 'card-1', type: AccountType.ccard, title: 'Card', instrument: 'KZT', syncIds: ['card-1'], balance: 10 }
const args: Parameters<ScrapeFunc<Record<string, never>>>[0] = { preferences: {}, fromDate: new Date('2026-01-01'), toDate: undefined, isFirstRun: false, isInBackground: false }
const originalZenMoney = global.ZenMoney
let state: Record<string, unknown>

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance'], now: new Date('2026-11-03T09:00:00Z') })
  jest.clearAllMocks()
  state = {}
  global.ZenMoney = {
    getData: jest.fn((key: string) => state[key]),
    setData: jest.fn((key: string, value: unknown) => { state[key] = value }),
    saveData: jest.fn()
  } as unknown as typeof ZenMoney
  jest.mocked(parsePdfStatements).mockResolvedValue([{ account: card, transactions: [] }])
  jest.mocked(getMobileExchangeRates).mockResolvedValue({ KZT: { buyRate: 1, sellRate: 1 } })
})

afterEach(() => {
  jest.useRealTimers()
  global.ZenMoney = originalZenMoney
})

describe('[model] monthly cashback workflow', () => {
  it('saves the level after one prompt and reuses it on a repeated PDF import', async () => {
    jest.mocked(ui.readLine).mockResolvedValueOnce('3')
    const first = await scrape({ ...args, preferences: { login: '', password: '' } })
    assertCashbackPayload(first.cashbacks)
    expect(ui.readLine).toHaveBeenCalledTimes(1)
    expect(state.cashbackSettings).toEqual({ version: 1, month: '2026-11', enabled: true, level: 'Gold', basePercent: '3', applePayPercent: '1.5', qrPercent: '2' })
    expect(ZenMoney.locale).toBe('ru')
    jest.mocked(ui.readLine).mockClear()
    const repeated = await scrape({ ...args, preferences: { login: '', password: '' } })
    expect(repeated).toEqual(first)
    expect(ui.readLine).not.toHaveBeenCalled()
  })

  it('does not save settings or return a partial import after cancellation', async () => {
    jest.mocked(ui.readLine).mockResolvedValueOnce(null)
    await expect(scrape({ ...args, preferences: { login: '', password: '' } })).rejects.toBeInstanceOf(TemporaryError)
    expect(state.cashbackSettings).toBeUndefined()
  })

  it('does not open a wizard for a non-card domain account', async () => {
    jest.mocked(parsePdfStatements).mockResolvedValue([{ account: { ...card, type: AccountType.checking }, transactions: [] }])
    const result = await scrape({ ...args, preferences: { login: '', password: '' } })
    expect(result).toEqual({ accounts: [{ ...card, type: AccountType.checking }], transactions: [] })
    expect(ui.readLine).not.toHaveBeenCalled()
  })

  it('imports a card without configuring cashbacks when cashback loading is disabled', async () => {
    // The saved switch takes precedence over a request to reconfigure cashbacks.
    const result = await scrape({
      ...args,
      preferences: { login: '', password: '', shouldScrapeCashbacks: false, reconfigureCashbacks: true }
    })
    expect(result).toEqual({ accounts: [card], transactions: [] })
    expect(ui.readLine).not.toHaveBeenCalled()
    expect(state.cashbackSettings).toBeUndefined()
  })

  it('requires new input next month and guards background UI', async () => {
    state.cashbackSettings = { version: 1, month: '2026-10', enabled: true, level: 'Gold', basePercent: '3', applePayPercent: '0', qrPercent: '2' }
    await expect(scrape({ ...args, isInBackground: true, preferences: { login: '', password: '' } })).rejects.toBeInstanceOf(UserInteractionError)
    expect(ui.readLine).not.toHaveBeenCalled()
  })

  it('does not turn a PDF loading failure into a successful cashback-only import', async () => {
    const error = new Error('PDF read failed')
    jest.mocked(parsePdfStatements).mockRejectedValue(error)
    await expect(scrape({ ...args, preferences: { login: '', password: '' } })).rejects.toBe(error)
    expect(ui.readLine).not.toHaveBeenCalled()
    expect(state.cashbackSettings).toBeUndefined()
  })

  it('remembers an explicit monthly opt-out without publishing an empty snapshot', async () => {
    jest.mocked(ui.readLine).mockResolvedValueOnce('0')
    const first = await scrape({ ...args, preferences: { login: '', password: '' } })
    expect(first).toEqual({ accounts: [card], transactions: [] })
    expect(ui.readLine).toHaveBeenCalledTimes(1)
    jest.mocked(ui.readLine).mockClear()
    expect(await scrape({ ...args, preferences: { login: '', password: '' } })).toEqual(first)
    expect(ui.readLine).not.toHaveBeenCalled()
  })

  it('allows explicit reconfiguration in the same month', async () => {
    state.cashbackSettings = { version: 1, month: '2026-11', enabled: false, level: '', basePercent: '0', applePayPercent: '0', qrPercent: '0' }
    jest.mocked(ui.readLine).mockResolvedValueOnce('3')
    const result = await scrape({ ...args, preferences: { login: '', password: '', reconfigureCashbacks: true } })
    assertCashbackPayload(result.cashbacks)
    expect(state.cashbackSettings).toEqual({ version: 1, month: '2026-11', enabled: true, level: 'Gold', basePercent: '3', applePayPercent: '1.5', qrPercent: '2' })
  })

  it.each([
    ['1', 'Standard', '1', '0.5'],
    ['2', 'Silver', '2', '1'],
    ['3', 'Gold', '3', '1.5'],
    ['4', 'Platinum', '4', '2']
  ])('fills published rates for level choice %s without percentage input', async (choice, level, basePercent, applePayPercent) => {
    // The official bank table is the expectation; prompts collect only a numbered level choice.
    jest.mocked(ui.readLine).mockResolvedValueOnce(choice)
    expect(await configureCashbacks('2026-11', false)).toEqual({
      version: 1, month: '2026-11', enabled: true, level, basePercent, applePayPercent, qrPercent: '2'
    })
  })

  it('migrates saved settings by dropping fuel overrides and adding the QR condition', () => {
    // Old locally saved settings must not keep publishing the removed fuel rule.
    expect(readCashbackSettings({ version: 1, month: '2026-11', enabled: true, level: 'Gold', basePercent: '3', applePayPercent: '1.5', fuelPercent: '5' })).toEqual({
      version: 1, month: '2026-11', enabled: true, level: 'Gold', basePercent: '3', applePayPercent: '1.5', qrPercent: '2'
    })
  })

  it('uses Kazakhstan month boundaries, not the device calendar', () => {
    expect(cashbackMonth(new Date('2026-10-31T18:59:59Z'))).toBe('2026-10')
    expect(cashbackMonth(new Date('2026-10-31T19:00:00Z'))).toBe('2026-11')
  })
})
