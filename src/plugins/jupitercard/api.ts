import { InvalidPreferencesError, TemporaryError, UserInteractionError } from '../../errors'
import { Account, Transaction } from '../../types/zenmoney'
import { accountIdFor, convertAccounts, convertTransaction } from './converters'
import {
  SessionExpiredError,
  currentAuth,
  fetchBalance,
  fetchCards,
  fetchTransactions,
  seedCookies,
  sendCode,
  verifyCode
} from './fetchApi'
import { Auth, JupiterCard, Preferences, isAuth } from './models'

// The card launched in 2025, so nothing can predate it. This floor alone bounds the
// crawl; a "max years back" cap on top would eventually become the binding floor and
// silently truncate the user's oldest transactions.
const CARD_LAUNCH_YEAR = 2025

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ScrapeOutput {
  accounts: Account[]
  transactions: Transaction[]
  auth: Auth
}

// ZenMoney does not validate the email — `inputType` is only a keyboard hint — and an
// API that answered 200 to send-code would leave the user waiting for a code that can
// never arrive. InvalidPreferencesError is the only error that reopens the settings.
function assertLooksLikeEmail (email: string): void {
  if (!EMAIL_REGEXP.test(email)) {
    throw new InvalidPreferencesError('That is not a valid email address. Check the email in the plugin settings.')
  }
}

// A NaN date makes the year loop skip every iteration: zero transactions and no error,
// indistinguishable from an empty account.
function assertUsableFromDate (fromDate: Date): void {
  if (Number.isNaN(fromDate.getTime())) {
    throw new InvalidPreferencesError('The start date is not a valid date. Check it in the plugin settings.')
  }
}

async function login (email: string): Promise<Auth> {
  assertLooksLikeEmail(email)
  await sendCode(email)
  const code = await ZenMoney.readLine(`Enter the login code sent to ${email}`, { inputType: 'number' })
  // null means cancelled or timed out — not a wrong code.
  if (code == null || code.trim() === '') {
    throw new UserInteractionError()
  }
  const auth = await verifyCode(email, code.trim())
  // Persist at once: the user paid an OTP for this session, so a later failure in this
  // run must not discard it and demand another code next time.
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  return auth
}

// Jupiter's `year` filter may not bucket by UTC, so a transaction in the opening hours
// of a year can be filed under the previous one. Start a year early and let the
// fromDate comparison drop whatever is genuinely too old.
export function firstYearToQuery (fromDate: Date, thisYear: number): number {
  return Math.min(Math.max(fromDate.getUTCFullYear() - 1, CARD_LAUNCH_YEAR), thisYear)
}

async function loadAccounts (): Promise<{ accounts: Account[], cards: JupiterCard[] }> {
  const [cards, balance] = await Promise.all([fetchCards(), fetchBalance()])
  const accounts = convertAccounts(cards, balance)
  if (accounts.length === 0 && cards.length > 0) {
    // Keying the account off any other field would change its identity and duplicate it
    // in ZenMoney permanently. Retry rather than corrupt.
    throw new TemporaryError('Jupiter returned cards without a card account id')
  }
  return { accounts, cards }
}

function accountIdByCardId (cards: JupiterCard[]): Map<string, string> {
  const byCardId = new Map<string, string>()
  for (const card of cards) {
    const accountId = accountIdFor(card)
    if (card.id != null && card.id !== '' && accountId != null) {
      byCardId.set(card.id, accountId)
    }
  }
  return byCardId
}

async function loadTransactions (fromDate: Date, accounts: Account[], cards: JupiterCard[]): Promise<Transaction[]> {
  // Jupiter's transactions endpoint is not per-account, so a disabled account can only
  // be filtered afterwards — the fetch is skippable only when every account is disabled.
  const activeAccountIds = new Set(accounts.filter((a) => !ZenMoney.isAccountSkipped(a.id)).map((a) => a.id))
  if (activeAccountIds.size === 0) {
    return []
  }

  const routeToAccount = accountIdByCardId(cards)
  const primaryAccountId = accounts[0].id
  const transactions: Transaction[] = []
  const seenIds = new Set<string>() // year buckets overlap by design (see firstYearToQuery)
  const thisYear = new Date().getUTCFullYear()

  for (let year = firstYearToQuery(fromDate, thisYear); year <= thisYear; year++) {
    for (const tx of await fetchTransactions(year, fromDate)) {
      const id = tx.id
      if (id != null && id !== '') {
        if (seenIds.has(id)) {
          continue
        }
        seenIds.add(id)
      }
      const accountId = (tx.cardId != null ? routeToAccount.get(tx.cardId) : undefined) ?? primaryAccountId
      if (!activeAccountIds.has(accountId)) {
        continue
      }
      const transaction = convertTransaction(tx, accountId)
      if (transaction != null) {
        transactions.push(transaction)
      }
    }
  }
  return transactions
}

// `storedAuth` is whatever ZenMoney persisted last run, hence `unknown`.
export async function scrapeJupiter (preferences: Preferences, fromDate: Date, storedAuth: unknown): Promise<ScrapeOutput> {
  assertUsableFromDate(fromDate)
  const email = preferences.email

  const run = async (): Promise<{ accounts: Account[], transactions: Transaction[] }> => {
    const { accounts, cards } = await loadAccounts()
    if (accounts.length === 0) {
      return { accounts: [], transactions: [] }
    }
    return { accounts, transactions: await loadTransactions(fromDate, accounts, cards) }
  }

  // A corrupted blob would feed undefined tokens to setCookie, which deletes them.
  let auth = isAuth(storedAuth) ? storedAuth : undefined
  if (auth != null) {
    await seedCookies(auth)
  } else {
    auth = await login(email)
  }

  let result: { accounts: Account[], transactions: Transaction[] }
  try {
    result = await run()
  } catch (e) {
    // Re-login only for a genuinely dead session: it emails the user a new code, so
    // doing it on any error would spam them and hammer send-code.
    if (!(e instanceof SessionExpiredError)) {
      throw e
    }
    auth = await login(email)
    try {
      result = await run()
    } catch (retryError) {
      // SessionExpiredError is internal control flow; only ZPAPIError subclasses render.
      if (retryError instanceof SessionExpiredError) {
        throw new TemporaryError('Jupiter rejected a freshly issued session. Please try again later.')
      }
      throw retryError
    }
  }

  return { ...result, auth: (await currentAuth()) ?? auth }
}
