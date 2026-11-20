// [model] History paging of fetchHistoryV2.
// No recorded TBC history pages are available, so the pages below are synthetic and keep only
// the fields fetchHistoryV2 reads: the day timestamp and the paging cursor fields of each record.
// Invariants:
// 1. A day split between two pages must not end paging: every page down to fromDate is loaded.
// 2. Paging still ends when the bank cursor does not advance, so the same page is not requested forever.

import { fetchHistoryV2 } from '../../fetchApi'
import { FetchHistoryV2Data, SessionV2, TransactionsByDateV2 } from '../../models'

const HISTORY_URL = 'https://rmbgw.tbconline.ge/pfm/api/v1/transactions/history'
const DAY = 24 * 60 * 60 * 1000
const day = (n: number): number => Date.UTC(2026, 9, n)

const session = { cookies: ['fixture=cookie'], auth: {} } as unknown as SessionV2
const data = { account: {}, currency: 'GEL', iban: 'GE00TB0000000000000000', id: '1' } as unknown as FetchHistoryV2Data

function page (...days: Array<[number, number[]]>): TransactionsByDateV2[] {
  return days.map(([date, ids]) => ({
    date,
    transactions: ids.map(transactionId => ({ transactionId, blockedMovementDate: null }))
  })) as unknown as TransactionsByDateV2[]
}

const originalFetch = global.fetch
let requests: Array<Record<string, unknown>> = []

function mockPages (pages: TransactionsByDateV2[][]): void {
  global.fetch = async (url, init?) => {
    expect(String(url)).toBe(HISTORY_URL)
    requests.push(JSON.parse(String(init?.body)))
    const body = pages[Math.min(requests.length - 1, pages.length - 1)]
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
  }
}

beforeEach(() => {
  requests = []
  ;(global as { ZenMoney?: unknown }).ZenMoney = { features: {} }
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'debug').mockImplementation(() => {})
})

afterEach(() => {
  global.fetch = originalFetch
  ;(global as { ZenMoney?: unknown }).ZenMoney = undefined
  jest.restoreAllMocks()
})

it('[model] keeps paging when a day is split between pages', async () => {
  const fromDate = new Date(day(10) - DAY / 2)
  mockPages([
    page([day(14), [600, 590]], [day(13), [580]]),
    // Oct 13 continues on the next page: the previous version stopped here
    page([day(13), [570]], [day(12), [560]]),
    page([day(11), [550]], [day(10), [540]]),
    page([day(9), [530]])
  ])

  const result = await fetchHistoryV2(session, fromDate, data)

  const loadedIds = result.flatMap(byDate => byDate.transactions.map(t => t.transactionId))
  expect(loadedIds).toEqual([600, 590, 580, 570, 560, 550, 540, 530])
  expect(requests.map(r => r.lastSortColKey)).toEqual([undefined, 580, 560, 540])
})

it('[model] stops when the bank returns a page without moving the cursor', async () => {
  const fromDate = new Date(day(1))
  const samePage = page([day(14), [600]])
  mockPages([samePage, samePage])

  const result = await fetchHistoryV2(session, fromDate, data)

  expect(requests).toHaveLength(2)
  expect(result.flatMap(byDate => byDate.transactions.map(t => t.transactionId))).toEqual([600, 600])
})
