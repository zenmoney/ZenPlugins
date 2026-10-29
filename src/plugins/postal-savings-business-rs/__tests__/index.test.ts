import { parseAccounts, parseHistoryPage } from '../parsers'
import { fixture } from '../testFixtures'

jest.mock('../api')
jest.mock('../../../common/network', () => ({ restoreCookies: jest.fn(), saveCookies: jest.fn() }))
const api = jest.requireMock<jest.Mocked<typeof import('../api')>>('../api')
const network = jest.requireMock<jest.Mocked<typeof import('../../../common/network')>>('../../../common/network')
const { scrape } = jest.requireActual<typeof import('../index')>('../index')

beforeEach(() => {
  jest.resetAllMocks()
  global.ZenMoney = { locale: '', isAccountSkipped: jest.fn().mockReturnValue(false) } as unknown as typeof ZenMoney
  api.authenticate.mockResolvedValue(parseAccounts(fixture('accounts.html')))
})

it('[model] skipped histories retain accounts and do not initiate their requests', async () => {
  // Models host selection using the complete real account graph.
  global.ZenMoney.isAccountSkipped = jest.fn().mockReturnValue(true)
  const result = await scrape({ preferences: { login: 'fixture-login' }, fromDate: new Date('2026-01-01T00:00:00Z'), isFirstRun: true, isInBackground: false })
  expect(result.accounts).toHaveLength(2)
  expect(result.transactions).toEqual([])
  expect(api.fetchTransactions).not.toHaveBeenCalled()
  expect(network.restoreCookies).toHaveBeenCalledTimes(1)
  expect(ZenMoney.locale).toBe('sr')
})

it('[model] inclusive date edges keep the deduplicated receipt without imposing a null upper cutoff', async () => {
  // Models interval assembly with the user-confirmed SEPA duplicate pair and the other history skipped.
  global.ZenMoney.isAccountSkipped = jest.fn(id => id === '200111111111111117')
  api.fetchTransactions.mockResolvedValue(parseHistoryPage(fixture('transactions-eur.html')).transactions)
  const args = { preferences: { login: 'fixture-login' }, fromDate: new Date('2026-10-13T22:00:00Z'), toDate: new Date('2026-10-13T22:00:00Z'), isFirstRun: false, isInBackground: true }
  const bounded = await scrape(args)
  expect(bounded.transactions).toHaveLength(1)
  const unbounded = await scrape({ ...args, toDate: undefined })
  expect(unbounded).toEqual(bounded)
  const afterBoundary = await scrape({ ...args, fromDate: new Date('2026-10-13T22:00:00.001Z'), toDate: undefined })
  expect(afterBoundary.transactions).toEqual([])
  expect(api.fetchTransactions.mock.calls[0][0]).toEqual({ index: '1' })
})

it('[model] a later history failure preserves immediately persisted authorization and propagates unchanged', async () => {
  // Models the entrypoint-owned persistence callback independently of the bank protocol.
  let persisted = false
  network.saveCookies.mockImplementation(async () => { persisted = true })
  api.authenticate.mockImplementation(async (_preferences, _background, persist) => {
    await persist()
    return parseAccounts(fixture('accounts.html'))
  })
  const error = new Error('Model history failure')
  api.fetchTransactions.mockRejectedValue(error)
  await expect(scrape({ preferences: { login: 'fixture-login' }, fromDate: new Date('2026-01-01T00:00:00Z'), isFirstRun: false, isInBackground: false })).rejects.toBe(error)
  expect(persisted).toBe(true)
  expect(network.saveCookies).toHaveBeenCalledTimes(1)
})
