/** User-configured Q-Pay credentials. */
export interface Preferences {
  email: string
  password: string
  // Required by the shared ZenPlugins date adapter and exposed in preferences.xml.
  startDate?: string
}

/** Bearer session persisted between synchronizations. */
export interface Session {
  email: string
  accessToken: string
}

/** Return a normalized email for authentication and persisted-session matching. */
export function normalizeEmail (email: string): string {
  return email.trim()
}

/** Validate untrusted session data loaded from ZenMoney storage. */
export function isSessionFor (value: unknown, email: string): value is Session {
  if (value == null || typeof value !== 'object') {
    return false
  }
  const session = value as Partial<Session>
  return typeof session.email === 'string' &&
    normalizeEmail(session.email).toLowerCase() === normalizeEmail(email).toLowerCase() &&
    typeof session.accessToken === 'string' &&
    session.accessToken !== ''
}

export interface QPayWalletBalance {
  asset?: string | null
  value?: string | number | null
}

export interface QPayWallet {
  address?: string | null
  network?: string | null
  balances?: QPayWalletBalance[] | null
}

export interface QPayUser {
  wallets: QPayWallet[]
}

export interface QPayCard {
  id?: string | null
  status?: string | null
  is_revoked?: boolean | null
}

export interface QPayCardBalance {
  available_balance?: string | number | null
  card_currency?: string | null
}

export interface QPayCardWithBalance {
  card: QPayCard
  balance: QPayCardBalance
}

export interface QPayWalletTransaction {
  id?: string | null
  amount?: string | number | null
  full_amount?: string | number | null
  system_fee?: string | number | null
  asset?: string | null
  network?: string | null
  status?: string | null
  type?: string | null
  created_at?: string | number | null
  completed_at?: string | number | null
  in_wallet_address?: string | null
  out_wallet_address?: string | null
  transaction_hash?: string | null
}

export interface QPayCardMerchant {
  name?: string | null
  mcc?: string | number | null
  city?: string | null
  country?: string | null
}

export interface QPayCardTransaction {
  id?: string | null
  x_id?: string | null
  amount?: string | number | null
  fee?: string | number | null
  currency?: string | null
  original_amount?: string | number | null
  original_currency?: string | null
  status?: string | null
  type?: string | null
  lifecycle_stage?: string | null
  created_at?: string | number | null
  description?: string | null
  merchant?: QPayCardMerchant | null
}

export interface QPayCardTransactions {
  cardId: string
  transactions: QPayCardTransaction[]
}

export const QPAY_BASE_URL = 'https://pay.quantera.pro/api'

export const QPAY_ENDPOINTS = {
  login: '/v1/web/auth/login',
  currentUser: '/v1/web/users/self',
  cards: '/v1/miniapp/cards',
  transactions: '/v1/miniapp/transactions'
}
