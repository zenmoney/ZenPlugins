import fetchMock from 'fetch-mock'
import { CookieJar } from 'tough-cookie'
import type { Transaction } from '../../../types/zenmoney'
import { scrape } from '../index'

const API = 'https://webapi.papara.com'

// Reduced from the 2026-11-24 Bootloader log (papara-tr development build): balance and ledgers page 1
// keep only the fields the plugin reads; the IBAN is replaced with a public-safe value.
const balanceResponse = {
  data: {
    balances: [{
      currency: 0,
      currencyInfo: { currencyEnum: 0, code: 'TRY', number: 949, precision: 2, isCryptocurrency: false, isMetalCurrency: false },
      totalBalance: 5714.56,
      lockedBalance: 0,
      iban: 'TR000000000000000000000001',
      availableBalance: 5714.56,
      availableCashBalance: 5714.56
    }],
    savingBalancesSum: { balances: [] }
  },
  succeeded: true,
  error: null
}
const ledgersPage1 = {
  data: {
    totalPageCount: 121,
    totalItemCount: 0,
    items: [
      { id: 4459780203, externalCardAcceptorId: null, isCancellation: false, amount: 1.99, fee: 0, surcharge: 0, entryType: 15, entryTypeTitle: 'Papara Cashback', resultingBalance: 5714.56, description: 'You earned 1% cashback.', descriptionTitle: 'Surprise Cashback', mcCode: null, createdAt: '2026-11-21T16:33:32.263', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4459780189, externalCardAcceptorId: 34, isCancellation: false, amount: -199, fee: 0, surcharge: 0, entryType: 2, entryTypeTitle: 'Papara Card', resultingBalance: 5712.57, description: 'Spotify P4980D6F5F', descriptionTitle: 'Spotify', mcCode: null, createdAt: '2026-11-21T16:33:30.017', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4459645743, externalCardAcceptorId: null, isCancellation: false, amount: 5000, fee: 0, surcharge: 0, entryType: 36, entryTypeTitle: 'FAST Money Transfer', resultingBalance: 5911.57, description: null, descriptionTitle: 'Denizbank', mcCode: null, createdAt: '2026-11-21T08:47:22.277', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4459211739, externalCardAcceptorId: null, isCancellation: false, amount: 9.1, fee: 0, surcharge: 0, entryType: 15, entryTypeTitle: 'Papara Cashback', resultingBalance: 911.57, description: 'You earned 1% cashback.', descriptionTitle: 'Surprise Cashback', mcCode: null, createdAt: '2026-11-19T23:50:50.373', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4459211731, externalCardAcceptorId: null, isCancellation: false, amount: -910, fee: 0, surcharge: 0, entryType: 2, entryTypeTitle: 'Papara Card', resultingBalance: 902.47, description: 'OTOBUS', descriptionTitle: 'Transportation', mcCode: null, createdAt: '2026-11-19T23:50:48.720', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4459095943, externalCardAcceptorId: null, isCancellation: false, amount: 0.54, fee: 0, surcharge: 0, entryType: 15, entryTypeTitle: 'Papara Cashback', resultingBalance: 1812.47, description: 'You earned 1% cashback.', descriptionTitle: 'Surprise Cashback', mcCode: null, createdAt: '2026-11-19T18:26:58.887', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4459095937, externalCardAcceptorId: 6266, isCancellation: false, amount: -54, fee: 0, surcharge: 0, entryType: 2, entryTypeTitle: 'Papara Card', resultingBalance: 1811.93, description: 'TOPLU TASIMA UCRETI', descriptionTitle: 'Mersin Büyükşehir Belediyesi', mcCode: null, createdAt: '2026-11-19T18:26:58.003', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4459079162, externalCardAcceptorId: null, isCancellation: false, amount: 0.54, fee: 0, surcharge: 0, entryType: 15, entryTypeTitle: 'Papara Cashback', resultingBalance: 1865.93, description: 'You earned 1% cashback.', descriptionTitle: 'Surprise Cashback', mcCode: null, createdAt: '2026-11-19T17:50:14.340', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4459079143, externalCardAcceptorId: 6266, isCancellation: false, amount: -54, fee: 0, surcharge: 0, entryType: 2, entryTypeTitle: 'Papara Card', resultingBalance: 1865.39, description: 'TOPLU TASIMA UCRETI', descriptionTitle: 'Mersin Büyükşehir Belediyesi', mcCode: null, createdAt: '2026-11-19T17:50:12.707', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } },
      { id: 4458984027, externalCardAcceptorId: null, isCancellation: false, amount: 7.92, fee: 0, surcharge: 0, entryType: 15, entryTypeTitle: 'Papara Cashback', resultingBalance: 1919.39, description: 'You earned 1% cashback.', descriptionTitle: 'Surprise Cashback', mcCode: null, createdAt: '2026-11-19T13:57:45.007', currencyInfo: { code: 'TRY', isCryptocurrency: false, isMetalCurrency: false } }
    ]
  },
  succeeded: true,
  error: null
}

type Call = [string, RequestInit | undefined]
function calledUrls (): string[] {
  return (fetchMock.calls() as unknown as { matched: Call[] }).matched.map(([url]) => url)
}

function setup (skipped: string[] = []): { setData: jest.Mock } {
  const setData = jest.fn()
  global.ZenMoney = {
    getData: jest.fn(() => ({ token: 'saved-token', expiresAt: '2026-11-23T22:55:52.000Z', deviceIdentifier: '0123456789abcdef0123456789abcdef' })),
    setData,
    saveData: jest.fn(),
    isAccountSkipped: (id: string) => skipped.includes(id)
  } as unknown as typeof ZenMoney
  fetchMock.get(`${API}/balance`, balanceResponse)
  fetchMock.post(`${API}/user/ledgers`, ledgersPage1)
  // The shared cookie jar lives on the fetch polyfill; attach one to the fetch-mock handler.
  Object.defineProperty(global.fetch, 'cookieJar', { value: new CookieJar(), configurable: true })
  return { setData }
}

const round = (value: number): number => Math.round(value * 100) / 100
const sumOf = (transaction: Transaction): number => transaction.movements[0].sum as number
const preferences = { phone: '+905000000000', password: 'secret' }

describe('scrape', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance', 'setTimeout', 'clearTimeout'] })
    jest.setSystemTime(new Date('2026-11-23T22:30:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
    fetchMock.restore()
  })

  it('returns every ledger record in the interval so that resultingBalance reconciles with the account balance', async () => {
    const { setData } = setup()
    const result = await scrape({ preferences, fromDate: new Date('2026-11-19T14:00:00+03:00'), toDate: undefined, isInBackground: true, isFirstRun: false })
    expect(ZenMoney.locale).toBe('tr')
    expect(result.accounts).toEqual([{
      id: 'TR000000000000000000000001',
      type: 'checking',
      title: 'Papara TRY',
      instrument: 'TRY',
      syncIds: ['TR000000000000000000000001'],
      savings: false,
      balance: 5714.56
    }])
    const items = ledgersPage1.data.items
    // Nine records are newer than fromDate; the tenth (13:57:45 Turkey time) supplies the opening resultingBalance.
    expect(result.transactions.map(transaction => transaction.movements[0].id)).toEqual(items.slice(0, 9).map(item => String(item.id)))
    result.transactions.forEach((transaction, index) => {
      expect(round(items[index + 1].resultingBalance + sumOf(transaction))).toBe(items[index].resultingBalance)
    })
    expect(round(items[9].resultingBalance + result.transactions.reduce((total, transaction) => total + sumOf(transaction), 0))).toBe(result.accounts[0].balance)
    expect(calledUrls()).toEqual([`${API}/balance`, `${API}/user/ledgers`])
    expect(setData).not.toHaveBeenCalled()
  })

  it('includes operations exactly at fromDate and toDate', async () => {
    setup()
    const result = await scrape({
      preferences,
      fromDate: new Date('2026-11-19T17:50:12.707+03:00'),
      toDate: new Date('2026-11-21T16:33:30.017+03:00'),
      isInBackground: true,
      isFirstRun: false
    })
    expect(result.transactions.map(transaction => transaction.movements[0].id)).toEqual([
      '4459780189', '4459645743', '4459211739', '4459211731', '4459095943', '4459095937', '4459079162', '4459079143'
    ])
  })

  it('keeps a skipped account without loading its history', async () => {
    setup(['TR000000000000000000000001'])
    const result = await scrape({ preferences, fromDate: new Date('2026-11-01T00:00:00+03:00'), toDate: undefined, isInBackground: true, isFirstRun: false })
    expect(result.accounts.map(account => account.id)).toEqual(['TR000000000000000000000001'])
    expect(result.transactions).toEqual([])
    expect(calledUrls()).toEqual([`${API}/balance`])
  })
})
