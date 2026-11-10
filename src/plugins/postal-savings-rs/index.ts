import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { AccountTransaction, Preferences } from './models'
import { convertAccounts, convertTransaction } from './converters'
import { fetchAllAccounts, fetchAuthorization, fetchAuthorizationDate, fetchVerificationToken, fetchTransactions, fetchCardTransactions } from './fetchApi'

const PAGE_SIZE = 100
const MAX_PAGES = 100
// A card payment is listed on the day it was booked; the day it was made is
// read from its details page, one request per payment. Only for recent ones:
// a first sync over a year would otherwise ask for hundreds of pages, and
// for old payments a day or two matters least.
const AUTHORIZATION_DATE_DAYS = 60

export async function dateAsMade (transactions: AccountTransaction[], toDate: Date,
  fetchDate: (detailsUrl: string) => Promise<Date | null> = fetchAuthorizationDate): Promise<void> {
  const since = toDate.getTime() - AUTHORIZATION_DATE_DAYS * 24 * 3600 * 1000
  for (const transaction of transactions) {
    if (transaction.isCard !== true || transaction.detailsUrl === undefined || transaction.date.getTime() < since) {
      continue
    }
    const made = await fetchDate(transaction.detailsUrl)
    // A payment is made before it is booked, never after.
    if (made !== null && made.getTime() <= transaction.date.getTime()) {
      transaction.date = made
    }
  }
}
// The transaction list prints a day and a month but no year, so the period is
// read in windows shorter than a year and each window's end dates its rows.
const WINDOW_DAYS = 300

export function splitPeriod (fromDate: Date, toDate: Date): Array<[Date, Date]> {
  const windows: Array<[Date, Date]> = []
  let end = new Date(toDate.getTime())
  while (end.getTime() >= fromDate.getTime()) {
    const start = new Date(Math.max(fromDate.getTime(), end.getTime() - (WINDOW_DAYS - 1) * 24 * 3600 * 1000))
    windows.push([start, end])
    end = new Date(start.getTime() - 24 * 3600 * 1000)
  }
  return windows
}

async function fetchAllPages (fetchPage: (page: number) => Promise<AccountTransaction[]>): Promise<AccountTransaction[]> {
  const all: AccountTransaction[] = []
  const seen = new Set<string>()
  for (let page = 1; page < MAX_PAGES; page++) {
    const rows = await fetchPage(page)
    const fresh = rows.filter(row => !seen.has(row.id))
    fresh.forEach(row => seen.add(row.id))
    all.push(...fresh)
    if (rows.length < PAGE_SIZE || fresh.length === 0) {
      break
    }
  }
  return all
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  await fetchAuthorization(preferences)

  const apiAccounts = await fetchAllAccounts()
  const convertedAccounts: Account[] = convertAccounts(apiAccounts.filter(a => a.cardNumber === ''))
  const transactions: Transaction[] = []

  const token = await fetchVerificationToken()

  for (const account of apiAccounts) {
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }

    for (const [start, end] of splitPeriod(fromDate, toDate)) {
      if (account.cardNumber === '') {
        const apiTransactions = await fetchAllPages(async page => await fetchTransactions(account.id, token, page, start, end))
        await dateAsMade(apiTransactions, toDate)
        transactions.push(...apiTransactions.map(t => convertTransaction(t, account)).filter((tx): tx is Transaction => tx !== null))
      } else {
        const cardAccount = { ...account, id: account.accountNumber }
        const apiCardTransactions = await fetchAllPages(async page => await fetchCardTransactions(account.accountNumber, account.cardNumber, token, page, start, end))
        transactions.push(...apiCardTransactions.map(t => convertTransaction(t, cardAccount, true)).filter((tx): tx is Transaction => tx !== null))
      }
    }
  }

  return {
    accounts: convertedAccounts,
    transactions
  }
}
