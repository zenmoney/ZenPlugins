import fetchMock from 'fetch-mock'
import { fetchAccounts, fetchTransactions } from '../api'
import { accountsResponse } from '../__fixtures__/accounts'
import page1 from '../__fixtures__/mobile-history-page1.json'
import page2 from '../__fixtures__/mobile-history-page2.json'
import terminal from '../__fixtures__/mobile-history-terminal.json'
import { arrayAt, dateAt, stringAt } from '../validation'

const base = 'https://api.zen.com/mobile'
const session = { deviceId: 'model-device', accessToken: 'model-access-token' }
const rows = [...arrayAt(page1, 'historyEntries'), ...arrayAt(page2, 'historyEntries'), ...arrayAt(terminal, 'historyEntries')]
const plan = { accountIds: arrayAt(accountsResponse, 'accounts').map(account => stringAt(account, 'id')) }

beforeEach(() => {
  global.ZenMoney = { device: { os: { name: 'android', version: '9' }, model: 'Sync' } } as unknown as typeof ZenMoney
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

describe('ZEN.COM mobile financial responses', () => {
  it('loads the complete captured graph including hidden currency accounts', async () => {
    fetchMock.get(`${base}/v2/accounts?hidden=true&checkCache=false`, JSON.stringify(accountsResponse))
    expect(await fetchAccounts(session)).toEqual(arrayAt(accountsResponse, 'accounts'))
    expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Access-Token': session.accessToken }))
  })
})

// Model pagination ordering and failures with complete observed pages. Intermediate
// source pages are deliberately omitted; this does not claim complete live history.
describe('ZEN.COM mobile pagination [model]', () => {
  function history (): void {
    fetchMock.get(`${base}/history-entries`, JSON.stringify(page1))
    fetchMock.get(`${base}/history-entries?lastHistoryEntryId=${stringAt(arrayAt(page1, 'historyEntries')[19], 'id')}`, JSON.stringify(page2))
    fetchMock.get(`${base}/history-entries?lastHistoryEntryId=${stringAt(arrayAt(page2, 'historyEntries')[19], 'id')}`, JSON.stringify(terminal))
  }

  it('continues through full pages until the explicit terminal flag', async () => {
    history()
    expect(await fetchTransactions(session, plan, new Date('2020-01-01T00:00:00Z'))).toEqual(rows)
    expect(arrayAt(fetchMock.calls(), 'matched')).toHaveLength(3)
  })

  it('keeps inclusive date boundaries and an unbounded upper date', async () => {
    history()
    const date = new Date('2026-09-27T16:16:12Z')
    expect(await fetchTransactions(session, plan, date, date)).toEqual(rows.filter(row => dateAt(row, 'transaction.createdAt').getTime() === date.getTime()))
    fetchMock.restore()
    history()
    expect(await fetchTransactions(session, plan, date)).toEqual(rows.filter(row => dateAt(row, 'transaction.createdAt') >= date))
  })

  it('rejects a repeated nonterminal cursor', async () => {
    fetchMock.get(`${base}/history-entries`, JSON.stringify(page1))
    fetchMock.get(`${base}/history-entries?lastHistoryEntryId=${stringAt(arrayAt(page1, 'historyEntries')[19], 'id')}`, JSON.stringify(page1))
    await expect(fetchTransactions(session, plan, new Date('2020-01-01T00:00:00Z'))).rejects.toThrow('cursor did not advance')
  })

  it('never returns successful partial history after a page request fails', async () => {
    fetchMock.get(`${base}/history-entries`, JSON.stringify(page1))
    const error = new Error('Model interrupted mobile history')
    fetchMock.get(`${base}/history-entries?lastHistoryEntryId=${stringAt(arrayAt(page1, 'historyEntries')[19], 'id')}`, { throws: error })
    await expect(fetchTransactions(session, plan, new Date('2020-01-01T00:00:00Z'))).rejects.toBe(error)
  })
})
