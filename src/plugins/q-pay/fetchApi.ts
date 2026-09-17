import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { generateRandomString } from '../../common/utils'
import {
  normalizeEmail,
  Preferences,
  QPayCard,
  QPayCardBalance,
  QPayCardTransaction,
  QPayUser,
  QPayWalletTransaction,
  QPAY_BASE_URL,
  QPAY_ENDPOINTS,
  Session
} from './models'

const COMMON_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  Origin: 'https://pay.quantera.pro',
  Referer: 'https://pay.quantera.pro/',
  locale: 'ru'
}

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEXP = /^[\w!@#$%^&*()\-_+.]{8,}$/
const PAGE_SIZE = 100

const LOG_REDACTION: Pick<FetchOptions, 'sanitizeRequestLog' | 'sanitizeResponseLog'> = {
  // Login uses a serialized multipart body, so redact it as one opaque value. The same
  // policy also protects the Bearer header on subsequent requests.
  sanitizeRequestLog: { headers: { Authorization: true }, body: true },
  // /users/self contains personal data and wallet addresses; auth responses contain two
  // tokens. Redacting every response body is the smallest policy that covers both.
  sanitizeResponseLog: { body: true }
}

/** Internal control-flow error used to trigger one credential re-login. */
export class SessionExpiredError extends Error {
  constructor () {
    super('Q-Pay session expired')
    this.name = 'SessionExpiredError'
  }
}

function multipartBody (fields: Record<string, string>): { body: string, boundary: string } {
  const boundary = `----ZenMoneyFormBoundary${generateRandomString(24)}`
  const body = Object.entries(fields)
    .map(([name, value]) =>
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${name}"\r\n\r\n` +
      `${value}\r\n`
    )
    .join('') + `--${boundary}--\r\n`
  return { body, boundary }
}

async function request (
  path: string,
  session?: Session,
  options: FetchOptions = {},
  isLogin = false
): Promise<FetchResponse> {
  const response = await fetchJson(QPAY_BASE_URL + path, {
    ...options,
    ...LOG_REDACTION,
    headers: {
      ...COMMON_HEADERS,
      ...(options.headers as Record<string, string> | undefined),
      ...(session != null ? { Authorization: `Bearer ${session.accessToken}` } : {})
    }
  })

  if (response.status === 429 || response.status >= 500) {
    throw new TemporaryError(`Q-Pay временно недоступен (HTTP ${response.status})`)
  }
  if (response.status === 401 || response.status === 403) {
    if (isLogin) {
      throw new InvalidLoginOrPasswordError('Q-Pay: неверный email или пароль')
    }
    throw new SessionExpiredError()
  }
  if (response.status >= 400) {
    if (isLogin) {
      throw new InvalidLoginOrPasswordError('Q-Pay: неверный email или пароль')
    }
    throw new TemporaryError(`Q-Pay вернул ошибку HTTP ${response.status} для ${path}`)
  }
  return response
}

/** Authenticate with the same multipart contract as pay.quantera.pro. */
export async function login (preferences: Preferences): Promise<Session> {
  const email = normalizeEmail(preferences.email)
  // Besides matching the web form, validation prevents CR/LF values from injecting a
  // second multipart part into the serialized credential request.
  if (!EMAIL_REGEXP.test(email) || !PASSWORD_REGEXP.test(preferences.password)) {
    throw new InvalidLoginOrPasswordError('Q-Pay: проверьте email и пароль в настройках')
  }
  const { body, boundary } = multipartBody({
    username: email,
    password: preferences.password,
    utm_last: '{}'
  })
  const response = await request(QPAY_ENDPOINTS.login, undefined, {
    method: 'POST',
    body,
    // fetchJson normally serializes bodies as JSON. Multipart is already serialized.
    stringify: (value: unknown) => value,
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
  }, true)
  const data = response.body as { access_token?: unknown } | null | undefined
  if (typeof data?.access_token !== 'string' || data.access_token === '') {
    throw new InvalidLoginOrPasswordError('Q-Pay не вернул токен доступа')
  }
  return { email, accessToken: data.access_token }
}

/** Fetch the current user and their actually opened wallet networks. */
export async function fetchCurrentUser (session: Session): Promise<QPayUser> {
  const response = await request(QPAY_ENDPOINTS.currentUser, session)
  const data = response.body as { wallets?: unknown } | null | undefined
  const wallets = data?.wallets
  if (!Array.isArray(wallets)) {
    throw new TemporaryError('Q-Pay вернул неожиданный список кошельков')
  }
  return { wallets: wallets as QPayUser['wallets'] }
}

/** Fetch all card records; lifecycle filtering is applied separately. */
export async function fetchCards (session: Session): Promise<QPayCard[]> {
  const response = await request(QPAY_ENDPOINTS.cards, session)
  const data = response.body as { results?: unknown } | null | undefined
  const results = data?.results
  if (!Array.isArray(results)) {
    throw new TemporaryError('Q-Pay вернул неожиданный список карт')
  }
  return results as QPayCard[]
}

/** Fetch the available balance for one active card. */
export async function fetchCardBalance (session: Session, cardId: string): Promise<QPayCardBalance> {
  const response = await request(`${QPAY_ENDPOINTS.cards}/${encodeURIComponent(cardId)}/balance`, session)
  if (response.body == null || typeof response.body !== 'object') {
    throw new TemporaryError('Q-Pay вернул неожиданный баланс карты')
  }
  return response.body as QPayCardBalance
}

function transactionDate (value: string | number | null | undefined): Date | null {
  if (typeof value === 'number') {
    const date = new Date(value * 1000)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string' && value !== '') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

async function fetchTransactionPages<T extends { created_at?: string | number | null }> (
  session: Session,
  path: string,
  fromDate: Date,
  toDate: Date
): Promise<T[]> {
  const result: T[] = []
  let offset = 0

  while (true) {
    const separator = path.includes('?') ? '&' : '?'
    const response = await request(`${path}${separator}limit=${PAGE_SIZE}&offset=${offset}`, session)
    const body = response.body as { items?: unknown, total?: unknown } | null | undefined
    const responseItems = body?.items
    if (!Array.isArray(responseItems)) {
      throw new TemporaryError('Q-Pay вернул неожиданную историю операций')
    }

    const items = responseItems as T[]
    result.push(...items.filter(item => {
      const date = transactionDate(item.created_at)
      return date != null && date >= fromDate && date <= toDate
    }))

    offset += items.length
    const responseTotal = body?.total
    const total = typeof responseTotal === 'number' && Number.isFinite(responseTotal)
      ? responseTotal
      : null
    if (items.length === 0 || (total != null ? offset >= total : items.length < PAGE_SIZE)) {
      break
    }
  }

  return result
}

/** Fetch wallet operations in the requested ZenMoney date interval. */
export async function fetchWalletTransactions (
  session: Session,
  fromDate: Date,
  toDate: Date
): Promise<QPayWalletTransaction[]> {
  return await fetchTransactionPages<QPayWalletTransaction>(
    session,
    QPAY_ENDPOINTS.transactions,
    fromDate,
    toDate
  )
}

/** Fetch operations for one active Q-Pay card in the requested date interval. */
export async function fetchCardTransactions (
  session: Session,
  cardId: string,
  fromDate: Date,
  toDate: Date
): Promise<QPayCardTransaction[]> {
  return await fetchTransactionPages<QPayCardTransaction>(
    session,
    `${QPAY_ENDPOINTS.cards}/${encodeURIComponent(cardId)}/transactions`,
    fromDate,
    toDate
  )
}
