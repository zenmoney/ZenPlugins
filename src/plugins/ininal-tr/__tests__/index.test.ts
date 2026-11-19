import { scrape } from '../index'
import { ininalApi } from '../api'
import { Session } from '../models'

const args = {
  preferences: { login: '+900000000000', password: '000000' },
  fromDate: new Date('2025-01-01T00:00:00Z'),
  toDate: new Date('2025-02-01T00:00:00Z'),
  isInBackground: false,
  isFirstRun: false
}
const session: Session = { deviceId: 'test-device', userId: 'test-user', accessToken: 'test-access' }

beforeEach(() => {
  jest.restoreAllMocks()
  jest.spyOn(ininalApi, 'fetchAccounts')
  jest.spyOn(ininalApi, 'fetchAccountTransactions')
  global.ZenMoney = {
    getData: jest.fn().mockReturnValue(undefined),
    setData: jest.fn(),
    saveData: jest.fn(),
    isAccountSkipped: jest.fn().mockReturnValue(false)
  } as unknown as typeof ZenMoney
  jest.spyOn(ininalApi, 'login').mockResolvedValue({ ...session })
})

describe('[model] session lifecycle', () => {
  // Domain sessions and dependency failures model persistence, not bank payloads.
  it('accepts absent saved state and persists login before an account failure', async () => {
    jest.mocked(ZenMoney.getData).mockReturnValue(null)
    const failure = new Error('Model account transport failure')
    jest.mocked(ininalApi.fetchAccounts).mockImplementation(async () => {
      expect(ZenMoney.setData).toHaveBeenCalledWith('session', session)
      expect(ZenMoney.saveData).toHaveBeenCalledTimes(1)
      throw failure
    })
    await expect(scrape(args)).rejects.toBe(failure)
    expect(ininalApi.login).toHaveBeenCalledWith(args.preferences, false, undefined)
    expect(ZenMoney.locale).toBe('tr')
  })

  it('persists a rotated session before subsequent account processing fails', async () => {
    const failure = new Error('Model account processing failure')
    const rotated = { ...session, accessToken: 'test-rotated' }
    jest.mocked(ininalApi.fetchAccounts).mockImplementation(async (_session, onSession) => {
      onSession?.(rotated)
      throw failure
    })
    await expect(scrape(args)).rejects.toBe(failure)
    expect(ZenMoney.setData).toHaveBeenLastCalledWith('session', rotated)
    expect(ZenMoney.saveData).toHaveBeenCalledTimes(2)
  })

  it('rejects empty account results without returning partial success', async () => {
    jest.mocked(ininalApi.fetchAccounts).mockResolvedValue({ accounts: [] })
    await expect(scrape(args)).rejects.toThrow('No accounts returned')
    expect(ininalApi.fetchAccountTransactions).not.toHaveBeenCalled()
  })
})
