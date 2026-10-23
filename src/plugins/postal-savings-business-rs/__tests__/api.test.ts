import { UserInteractionError, ZPAPIError } from '../../../errors'
import { parseAccounts } from '../parsers'
import { fixture } from '../testFixtures'

jest.mock('../fetchApi')
jest.mock('../parsers', () => ({ ...jest.requireActual('../parsers'), parseHistoryPage: jest.fn() }))
const realParseHistoryPage = jest.requireActual<typeof import('../parsers')>('../parsers').parseHistoryPage
const { parseHistoryPage } = jest.requireMock<jest.Mocked<typeof import('../parsers')>>('../parsers')
const parseHistory = parseHistoryPage
const mocked = jest.requireMock<jest.Mocked<typeof import('../fetchApi')>>('../fetchApi')
const { authenticate, fetchTransactions } = jest.requireActual<typeof import('../api')>('../api')

beforeEach(() => {
  jest.resetAllMocks()
  // Models complete transport pages from selected real records; fixture pagers retain source metadata.
  parseHistory.mockImplementation(body => {
    const page = realParseHistoryPage(body)
    return { ...page, current: 1, pages: page.transactions.length === 0 ? 0 : 1, elements: page.transactions.length }
  })
})

it('[model] accepts the native adapter null upper date as an unbounded interval', async () => {
  // Reproduces Bootloader session 480b10b5: the native adapter supplied toDate=null.
  // Its complete period response is preserved; selected bank records come from the existing HAR.
  mocked.fetchHistoryPage.mockResolvedValue(fixture('transactions-rsd.html'))
  mocked.selectPeriod.mockResolvedValue(JSON.parse(fixture('period-native-null.json')) as unknown)
  await expect(fetchTransactions({ index: '0' }, new Date('2025-12-31T23:00:00Z'), null))
    .resolves.toEqual(parseHistoryPage(fixture('transactions-rsd.html')).transactions)
  expect(mocked.fetchNextHistoryPage).not.toHaveBeenCalled()
})

it.each(['changed-login', ''])('[model] a valid hot session is preserved with login preference %p', async login => {
  const readLine = jest.fn()
  global.ZenMoney = { readLine } as unknown as typeof ZenMoney
  // Models session preference independence using a complete real account response.
  mocked.fetchAccountsPage.mockResolvedValue(fixture('accounts.html'))
  const persist = jest.fn().mockResolvedValue(undefined)
  await expect(authenticate({ login }, true, persist)).resolves.toEqual(parseAccounts(fixture('accounts.html')))
  expect(mocked.submitLogin).not.toHaveBeenCalled()
  expect(readLine).not.toHaveBeenCalled()
  expect(persist).toHaveBeenCalledTimes(1)
})

it('[model] background stops before initiating mobile approval', async () => {
  const readLine = jest.fn()
  global.ZenMoney = { readLine } as unknown as typeof ZenMoney
  // Models the UI boundary; the recognized login form is a real public-page capture.
  mocked.fetchAccountsPage.mockResolvedValue(fixture('login-initial.html'))
  await expect(authenticate({ login: '' }, true, jest.fn())).rejects.toBeInstanceOf(UserInteractionError)
  expect(readLine).not.toHaveBeenCalled()
  expect(mocked.submitLogin).not.toHaveBeenCalled()
  expect(mocked.fetchLoginPage).not.toHaveBeenCalled()
})

it('[model] foreground completes the recorded successful approval sequence and persists it', async () => {
  // Models host interaction timing; form and status sequence come from the HAR.
  global.ZenMoney = { alert: jest.fn().mockResolvedValue(undefined) } as unknown as typeof ZenMoney
  mocked.fetchAccountsPage.mockResolvedValueOnce(fixture('login-initial.html')).mockResolvedValueOnce(fixture('accounts.html'))
  mocked.fetchLoginPage.mockResolvedValue(fixture('login-initial.html'))
  mocked.submitLogin.mockResolvedValueOnce(fixture('login-challenge.html')).mockResolvedValueOnce(fixture('authenticated-landing.html'))
  mocked.fetchPushStatus.mockResolvedValue('OK')
  const persist = jest.fn().mockResolvedValue(undefined)
  await expect(authenticate({ login: 'fixture-login' }, false, persist)).resolves.toEqual(parseAccounts(fixture('accounts.html')))
  expect(mocked.submitLogin).toHaveBeenCalledTimes(2)
  expect(persist).toHaveBeenCalledTimes(1)
  expect(mocked.submitLogin.mock.calls[0][0]).toContainEqual(['j_username', 'fixture-login'])
})

it('[model] missing login is requested before initiating mobile approval', async () => {
  // Models required user input using the recorded successful bank sequence.
  const readLine = jest.fn().mockResolvedValue('  model-entered-login  ')
  const alert = jest.fn().mockResolvedValue(undefined)
  global.ZenMoney = { readLine, alert } as unknown as typeof ZenMoney
  mocked.fetchAccountsPage.mockResolvedValueOnce(fixture('login-initial.html')).mockResolvedValueOnce(fixture('accounts.html'))
  mocked.fetchLoginPage.mockResolvedValue(fixture('login-initial.html'))
  mocked.submitLogin.mockResolvedValueOnce(fixture('login-challenge.html')).mockResolvedValueOnce(fixture('authenticated-landing.html'))
  mocked.fetchPushStatus.mockResolvedValue('OK')
  const persist = jest.fn().mockResolvedValue(undefined)
  await expect(authenticate({ login: '' }, false, persist)).resolves.toEqual(parseAccounts(fixture('accounts.html')))
  expect(readLine).toHaveBeenCalledWith('Unesite korisničko ime za poslovno elektronsko bankarstvo.', { inputType: 'text' })
  expect(mocked.submitLogin.mock.calls[0][0]).toContainEqual(['j_username', 'model-entered-login'])
  expect(readLine.mock.invocationCallOrder[0]).toBeLessThan(mocked.submitLogin.mock.invocationCallOrder[0])
  expect(alert).toHaveBeenCalledWith('Potvrdite prijavu u mobilnoj aplikaciji banke.\nKod za poređenje: 1234')
  expect(persist).toHaveBeenCalledTimes(1)
})

it.each([null, '', '   '])('[model] absent required login (%p) stops before a bank challenge', async input => {
  // The host does not distinguish cancellation from timeout; neither permits an empty credential.
  const readLine = jest.fn().mockResolvedValue(input)
  global.ZenMoney = { readLine } as unknown as typeof ZenMoney
  mocked.fetchAccountsPage.mockResolvedValue(fixture('login-initial.html'))
  const persist = jest.fn()
  const error: unknown = await authenticate({ login: '' }, false, persist).catch(error => error)
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
  expect(readLine).toHaveBeenCalledTimes(1)
  expect(mocked.fetchLoginPage).not.toHaveBeenCalled()
  expect(mocked.submitLogin).not.toHaveBeenCalled()
  expect(persist).not.toHaveBeenCalled()
})

it('[model] unknown transport failures propagate without cold fallback or persistence', async () => {
  // No invented bank error code is used to classify a transport failure.
  const error = new Error('Transport failure')
  mocked.fetchAccountsPage.mockRejectedValue(error)
  const persist = jest.fn()
  await expect(authenticate({ login: 'fixture-login' }, false, persist)).rejects.toBe(error)
  expect(mocked.submitLogin).not.toHaveBeenCalled()
  expect(persist).not.toHaveBeenCalled()
})

it('[model] requested interval uses the server period conversion and checks completeness', async () => {
  // Models period orchestration using selected complete bank records.
  mocked.fetchHistoryPage.mockResolvedValue(fixture('transactions-rsd.html'))
  mocked.selectPeriod.mockResolvedValue({ dateFromNumeric: String(Date.parse('2026-09-21T22:00:00Z')), dateToNumeric: String(Date.parse('2026-10-24T21:59:59.999Z')) })
  const result = await fetchTransactions({ index: '0' }, new Date('2026-09-22T00:00:00Z'), new Date('2026-10-24T00:00:00Z'))
  expect(result).toEqual(realParseHistoryPage(fixture('transactions-rsd.html')).transactions)
  expect(mocked.fetchNextHistoryPage).not.toHaveBeenCalled()
  expect(mocked.selectPeriod.mock.calls[0][0]).toContainEqual(['dateFieldName', 'dueDate'])
})

it('[model] loads every page and validates the complete set of distinct records', async () => {
  // Pagination is modeled with three complete selected records, without retaining an annual history.
  const body = fixture('transactions-rsd.html')
  const initial = parseHistoryPage(body)
  const records = initial.transactions
  parseHistory.mockReturnValueOnce(initial)
    .mockReturnValueOnce({ ...initial, transactions: records.slice(0, 2), pages: 2, elements: 3 })
    .mockReturnValueOnce({ ...initial, transactions: records.slice(2), current: 2, pages: 2, elements: 3 })
  mocked.fetchHistoryPage.mockResolvedValue(body)
  mocked.selectPeriod.mockResolvedValue(JSON.parse(fixture('period-year.json')) as unknown)
  mocked.fetchNextHistoryPage.mockResolvedValue(body)
  const result = await fetchTransactions({ index: '0' }, new Date('2025-12-31T23:00:00Z'))
  expect(result).toEqual(records)
  expect(mocked.fetchNextHistoryPage.mock.calls).toEqual([['0', 2]])
  expect(mocked.fetchHistoryPage.mock.calls[1][1]).toContainEqual(['applyFilter', 'true'])
})

it('accepts the observed zero-page empty history as a complete empty result', async () => {
  parseHistory.mockImplementation(realParseHistoryPage)
  mocked.fetchHistoryPage.mockResolvedValue(fixture('history-empty.html'))
  mocked.selectPeriod.mockResolvedValue(JSON.parse(fixture('period-empty.json')) as unknown)
  await expect(fetchTransactions({ index: '1' }, new Date('2026-01-02T23:00:00Z'), new Date('2026-01-03T22:59:59.999Z'))).resolves.toEqual([])
  expect(mocked.fetchNextHistoryPage).not.toHaveBeenCalled()
})

it('[model] a later page failure stops the whole history', async () => {
  // Models a later page failure using selected bank records and domain pagination metadata.
  const body = fixture('transactions-rsd.html')
  const initial = parseHistoryPage(body)
  parseHistory.mockReturnValueOnce(initial).mockReturnValueOnce({ ...initial, pages: 2 })
  mocked.fetchHistoryPage.mockResolvedValue(body)
  mocked.selectPeriod.mockResolvedValue(JSON.parse(fixture('period-year.json')) as unknown)
  const error = new Error('Model page failure')
  mocked.fetchNextHistoryPage.mockRejectedValue(error)
  await expect(fetchTransactions({ index: '0' }, new Date('2025-12-31T23:00:00Z'))).rejects.toBe(error)
})

it('[model] confirmed cold authorization is persisted before an account loading failure', async () => {
  // Models persistence timing using the recorded authenticated landing page.
  global.ZenMoney = { alert: jest.fn().mockResolvedValue(undefined) } as unknown as typeof ZenMoney
  const error = new Error('Model account loading failure')
  mocked.fetchAccountsPage.mockResolvedValueOnce(fixture('login-initial.html')).mockRejectedValueOnce(error)
  mocked.fetchLoginPage.mockResolvedValue(fixture('login-initial.html'))
  mocked.submitLogin.mockResolvedValueOnce(fixture('login-challenge.html')).mockResolvedValueOnce(fixture('authenticated-landing.html'))
  mocked.fetchPushStatus.mockResolvedValue('OK')
  const persist = jest.fn().mockResolvedValue(undefined)
  await expect(authenticate({ login: 'fixture-login' }, false, persist)).rejects.toBe(error)
  expect(persist).toHaveBeenCalledTimes(1)
  expect(persist.mock.invocationCallOrder[0]).toBeLessThan(mocked.fetchAccountsPage.mock.invocationCallOrder[1])
})
