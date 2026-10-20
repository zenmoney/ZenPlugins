import fetchMock from 'fetch-mock'
import { scrape } from '../index'
import completed from '../__fixtures__/mobile-fast-login.json'
import accounts from '../__fixtures__/mobile-accounts.json'
import page1 from '../__fixtures__/mobile-history-page1.json'
import terminal from '../__fixtures__/mobile-history-terminal.json'
import expectedTransactions from '../__fixtures__/mobile-expected-transactions.json'
import { expectedAccounts } from '../__fixtures__/expected-accounts'
import { arrayAt, stringAt } from '../validation'

// Model request credentials and page sequencing only. Every response is complete
// captured bank JSON; omitted intermediate pages are not live-completeness evidence.
describe('ZEN.COM mobile-only request sequence [model]', () => {
  afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

  it('persists hot login and imports real records without portal, cookie or cloning requests', async () => {
    const base = 'https://api.zen.com/mobile'
    global.ZenMoney = {
      device: { model: 'Sync', os: { name: 'android', version: '9' } },
      getData: jest.fn(() => ({ version: 1, deviceId: 'model-device', loginToken: 'model-saved-token', passcode: 'model-passcode' })),
      setData: jest.fn(),
      saveData: jest.fn(),
      isAccountSkipped: jest.fn(() => false),
      readLine: jest.fn()
    } as unknown as typeof ZenMoney
    fetchMock.post(`${base}/mobile-authentication/authentications/fast-login`, JSON.stringify(completed))
    fetchMock.get(`${base}/v2/accounts?hidden=true&checkCache=false`, () => {
      expect(ZenMoney.setData).toHaveBeenCalledWith('mobileAuth', expect.objectContaining({ loginToken: stringAt(completed, 'accessToken.token') }))
      expect(ZenMoney.saveData).toHaveBeenCalledTimes(1)
      return JSON.stringify(accounts)
    })
    fetchMock.get(`${base}/history-entries`, JSON.stringify(page1))
    fetchMock.get(`${base}/history-entries?lastHistoryEntryId=${stringAt(arrayAt(page1, 'historyEntries')[19], 'id')}`, JSON.stringify(terminal))
    const result = await scrape({ preferences: { useMobileAuth: false }, fromDate: new Date('2026-01-01T00:00:00Z'), isFirstRun: false, isInBackground: true })
    expect(result.accounts).toEqual(expectedAccounts)
    expect(result.transactions.map(tx => ({ ...tx, date: tx.date.toISOString() }))).toEqual(expectedTransactions)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(arrayAt(fetchMock.calls(), 'matched').map(call => stringAt(call, '0'))).toEqual([
      `${base}/mobile-authentication/authentications/fast-login`,
      `${base}/v2/accounts?hidden=true&checkCache=false`,
      `${base}/history-entries`,
      `${base}/history-entries?lastHistoryEntryId=${stringAt(arrayAt(page1, 'historyEntries')[19], 'id')}`
    ])
  })
})
