import type { Auth } from '../api'

jest.mock('../api', () => ({
  ...jest.requireActual<typeof import('../api')>('../api'),
  authenticateAndFetchBalance: jest.fn(),
  fetchLedgers: jest.fn()
}))
const mockedApi = jest.requireMock<typeof import('../api')>('../api')
const { scrape } = jest.requireActual<typeof import('../index')>('../index')

it('[model] persists a new login immediately and keeps it when history loading fails', async () => {
  // Model invariant: confirmed authentication is saved before later loading, and the later failure propagates unchanged.
  const auth: Auth = { token: 'master-token', expiresAt: '2026-11-23T22:55:52.000Z', deviceIdentifier: 'fedcba9876543210fedcba9876543210' }
  const failure = new Error('Loading failed')
  const setData = jest.fn()
  const saveData = jest.fn()
  global.ZenMoney = { getData: jest.fn(() => undefined), setData, saveData, isAccountSkipped: () => false } as unknown as typeof ZenMoney
  jest.mocked(mockedApi.authenticateAndFetchBalance).mockImplementation(async (_preferences, saved, isInBackground, onAuth) => {
    expect({ saved, isInBackground }).toEqual({ saved: undefined, isInBackground: false })
    onAuth(auth)
    return {
      auth,
      balance: { balances: [{ currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false }, totalBalance: 1, lockedBalance: 0, availableBalance: 1, iban: 'TR000000000000000000000001' }] }
    }
  })
  jest.mocked(mockedApi.fetchLedgers).mockRejectedValue(failure)
  await expect(scrape({ preferences: { phone: '+905000000000', password: 'secret' }, fromDate: new Date('2026-11-01T00:00:00Z'), toDate: undefined, isInBackground: false, isFirstRun: true }))
    .rejects.toBe(failure)
  expect(setData.mock.calls).toEqual([['auth', auth]])
  expect(saveData).toHaveBeenCalledTimes(1)
  expect(ZenMoney.locale).toBe('tr')
})
