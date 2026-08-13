// User-configured settings; see preferences.xml.
export interface Preferences {
  email: string
}

// Persisted between runs via ZenMoney.setData/getData.
export interface Auth {
  accessToken: string
  refreshToken: string
}

// Persisted data may be corrupted or from an older schema. Casting it straight to Auth
// would let undefined tokens reach setCookie, which deletes the cookie and silently
// breaks authentication.
export function isAuth (value: unknown): value is Auth {
  if (value == null || typeof value !== 'object') {
    return false
  }
  const auth = value as Partial<Auth>
  return typeof auth.accessToken === 'string' && auth.accessToken !== '' &&
    typeof auth.refreshToken === 'string' && auth.refreshToken !== ''
}

export const JUP_BASE = 'https://global.jup.ag'
export const JUP_HOST = 'global.jup.ag'
// Registrable domain, used to tell our cookies from a lookalike host's.
export const JUP_DOMAIN = 'jup.ag'
export const AUTH_FLOW = 'legacy'
export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export const ENDPOINTS = {
  sendCode: '/api/proxy/auth/email/send-code',
  verifyCode: '/api/proxy/auth/email/verify-code',
  refresh: '/api/auth/refresh',
  cards: '/api/proxy/cards',
  balance: '/api/proxy/cards/balance',
  transactions: '/api/proxy/transactions'
}

// Jupiter API responses. Every field is optional on purpose: these are unvalidated, and
// declaring them as required would let TypeScript hide the very bugs that arise when a
// field is absent.
export interface JupiterCard {
  id?: string | null
  cardAccountId?: string | null
  last4?: string | null
}

export interface JupiterBalance {
  currency?: string | null
  spendableBalance?: number | null
  withdrawableBalance?: number | null
}

export interface JupiterCardDetail {
  merchantName?: string | null
  merchantCategoryCode?: string | null
  // Lifecycle status. A decline (e.g. 'INSUFFICIENT_FUNDS') still carries a full amount and
  // a valid timestamp, so this is the only field that reveals no money moved. Not narrowed
  // to a union: the converter must handle an unseen status rather than have the types
  // pretend it cannot appear.
  status?: string | null
  settlementTimestamp?: string | null
}

export interface JupiterTransaction {
  id?: string | null
  cardId?: string | null
  type?: string | null
  // Not narrowed to 'DEBIT' | 'CREDIT': the converter must decide what to do with an
  // unexpected value rather than have the types pretend it cannot happen.
  direction?: string | null
  settlementCurrency?: string | null
  settlementAmount?: string | null
  transactionCurrency?: string | null
  transactionAmount?: string | null
  onchainSignature?: string | null
  transactionTimestamp?: string | null
  card?: JupiterCardDetail | null
}

export interface Paginated<T> {
  data: T[]
  meta?: { totalPages?: number | null } | null
}
