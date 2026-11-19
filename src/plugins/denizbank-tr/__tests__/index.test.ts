import type { Session } from '../api'

jest.mock('../api', () => ({ createDenizBankApi: jest.fn() }))
const mockedApi = jest.requireMock<typeof import('../api')>('../api')
const { scrape } = jest.requireActual<typeof import('../index')>('../index')

it('persists confirmed authentication updates before propagating a later failure [model]', async () => {
  // Model invariant: neither a financial loading failure nor a preference change undoes confirmed authentication.
  const failure = new Error('Loading failed')
  const initial: Session = { clientId: 'client', encryptionKey: 'key', token: 'initial', createdDate: new Date('2026-11-15T00:00:00Z'), timeoutSeconds: 1800 }
  const rotated: Session = { clientId: 'client', encryptionKey: 'key', token: 'rotated', createdDate: new Date('2026-11-15T00:00:00Z'), timeoutSeconds: 1800 }
  const setData = jest.fn()
  const saveData = jest.fn()
  const zenMoney: Partial<typeof ZenMoney> = { getData: jest.fn(() => null), setData, saveData }
  global.ZenMoney = zenMoney as typeof ZenMoney
  const login = jest.fn(async () => initial)
  jest.mocked(mockedApi.createDenizBankApi).mockImplementation(onUpdate => ({
    login,
    fetchCards: async () => { onUpdate?.(rotated); throw failure }
  } as unknown as ReturnType<typeof mockedApi.createDenizBankApi>))
  await expect(scrape({ preferences: { login: 'changed', password: 'changed' }, fromDate: new Date('2026-11-01T00:00:00Z'), toDate: new Date('2026-11-15T00:00:00Z'), isInBackground: false, isFirstRun: false })).rejects.toBe(failure)
  expect(login).toHaveBeenCalledWith({ login: 'changed', password: 'changed' }, false, undefined)
  expect(setData.mock.calls).toEqual([['session', initial], ['session', rotated]])
  expect(saveData).toHaveBeenCalledTimes(2)
  expect(ZenMoney.locale).toBe('tr')
})
