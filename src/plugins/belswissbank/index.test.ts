import { Api } from './api'
import { scrape } from './index'
import { recordedCards, recordedPayments } from './__fixtures__/recordedPayments'

const fromDate = new Date('2026-10-09T00:00:00Z')
const toDate = new Date('2026-10-13T09:00:00Z')
const params = { preferences: { username: 'model-user', password: 'model-password' }, fromDate, toDate, isInBackground: true, isFirstRun: false }

beforeEach(() => {
  global.ZenMoney = {
    getData: jest.fn(() => ({})), isAccountSkipped: jest.fn(id => id === '100001')
  } as unknown as typeof ZenMoney
  jest.spyOn(Api.prototype, 'login').mockResolvedValue(undefined)
  jest.spyOn(Api.prototype, 'fetchCards').mockResolvedValue(recordedCards)
  jest.spyOn(Api.prototype, 'fetchAccounts').mockResolvedValue([])
})
afterEach(() => jest.restoreAllMocks())

it('[model] keeps skipped account metadata and only loads enabled histories from the recorded product graph', async () => {
  const fetchTransactions = jest.spyOn(Api.prototype, 'fetchTransactions').mockImplementation(async id => recordedPayments.filter(payment => payment.cardId === id))
  await expect(scrape(params)).resolves.toEqual({
    accounts: [{ id: '100001', type: 'ccard', title: 'Visa Digital', instrument: 'BYN', balance: 2018.52, syncIds: ['100001', 'BY24UNBS30140000000000001001', '1001'] },
      { id: '100002', type: 'ccard', title: 'Visa Classic', instrument: 'EUR', balance: 0, syncIds: ['100002', 'BY24UNBS30140000000000001002', '1002'] },
      { id: '100003', type: 'ccard', title: 'Visa Classic для самозанятых, USD', instrument: 'USD', balance: 5000, syncIds: ['100003', 'BY24UNBS30140000000000001003', '1003'] }],
    transactions: [{
      hold: false,
      date: new Date('2026-10-12T16:00:53Z'),
      movements: [{ id: '163829629', account: { id: '100003' }, sum: -664.4, fee: 0, invoice: { sum: -1993.53, instrument: 'BYN' } }],
      merchant: null,
      comment: null
    },
    {
      hold: false,
      date: new Date('2026-10-12T13:38:46Z'),
      movements: [{ id: '163798412', account: { id: '100003' }, sum: 3696, fee: 0, invoice: null }],
      merchant: { fullTitle: 'CON/easystaff', mcc: null, location: null },
      comment: null
    },
    {
      hold: false,
      date: new Date('2026-10-12T11:41:51Z'),
      movements: [{ id: '163774758', account: { id: '100003' }, sum: -31.6, fee: 0, invoice: { sum: -95, instrument: 'BYN' } }],
      merchant: null,
      comment: null
    }]
  })
  expect(fetchTransactions.mock.calls).toEqual([[100002, fromDate, toDate], [100003, fromDate, toDate]])
})

it('[model] propagates a history failure without returning partial success', async () => {
  const failure = new Error('history transport failure')
  jest.spyOn(Api.prototype, 'fetchTransactions').mockRejectedValue(failure)
  await expect(scrape(params)).rejects.toBe(failure)
})
