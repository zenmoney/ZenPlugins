import { BankMessageError } from '../../errors'
import Base64 from 'crypto-js/enc-base64'
import Utf8 from 'crypto-js/enc-utf8'
import { getOptNumber, getOptString } from '../../types/get'
import { authorizeInWebView } from './sso'
import { parsePdf } from '../../common/pdfUtils'
import { convertAccounts, convertCardTransaction, convertPaymentHistoryTransaction } from './converters'
import { fetchApi, type ApiResponse } from './fetchApi'
import { asNonEmptyString, getLastCardDigits, normalizeProductIdentifier, toNumber } from './helpers'
import type { AuthState, LoginRequest, ProductAccount } from './models'
import { parseStatementTransactions } from './statement'
import type { AccountsResponse, BankAccount, CardTransactionsResponse, CardsResponse, Credit, CreditsResponse, ErrorInfo, ErrorResponse, PaymentHistoryItem, PaymentHistoryResponse } from './types/fetch'

const PAGE_SIZE = 100
const PAYMENT_HISTORY_PAGE_SIZE = 300
const MAX_TRANSACTION_PAGES = 100
const MAX_TRANSACTION_PERIOD_DAYS = 15
const MAX_TRANSACTION_LOOKBACK_MONTHS = 6
const DAY_MS = 24 * 60 * 60 * 1000
const MINSK_TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000
const TOKEN_REFRESH_SAFE_GAP_MS = 10000
const formatApiDate = (date: Date): string => new Date(date.getTime() + MINSK_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)

const loadAuthoritativeCardAccountLinks = async (
  auth: AuthState,
  accounts: BankAccount[]
): Promise<Map<string, BankAccount[]>> => {
  const result = new Map<string, BankAccount[]>()

  await Promise.all(accounts.map(async (account) => {
    if (normalizeProductIdentifier(account.contractNumber) == null) return

    const response = await fetchApi<CardsResponse>('cards', {
      query: { contractNumber: account.contractNumber as string },
      ...authOptions(auth)
    })
    if (!(response.status >= 200 && response.status < 300)) {
      console.assert(false, 'Card/account linking request failed', { status: response.status, errorCode: getErrorInfo(response.body)?.code })
    }

    for (const card of response.body.cards ?? []) {
      const productId = String(card.productId)
      const candidates = result.get(productId) ?? []
      if (!candidates.some((candidate) => String(candidate.productId) === String(account.productId))) {
        candidates.push(account)
        result.set(productId, candidates)
      }
    }
  }))

  return result
}

export const getCardTransactionStartDate = (): Date => {
  const minskDate = new Date(Date.now() + MINSK_TIMEZONE_OFFSET_MS)
  const dayOfMonth = minskDate.getUTCDate()
  minskDate.setUTCDate(1)
  minskDate.setUTCMonth(minskDate.getUTCMonth() - MAX_TRANSACTION_LOOKBACK_MONTHS)
  const lastDayOfTargetMonth = new Date(Date.UTC(
    minskDate.getUTCFullYear(),
    minskDate.getUTCMonth() + 1,
    0
  )).getUTCDate()
  minskDate.setUTCDate(Math.min(dayOfMonth, lastDayOfTargetMonth))
  minskDate.setUTCHours(0, 0, 0, 0)
  return new Date(minskDate.getTime() - MINSK_TIMEZONE_OFFSET_MS)
}

const getPaymentHistoryStartDate = (): Date => getCardTransactionStartDate()

const getTransactionPeriods = (fromDate: Date, toDate: Date): Array<{ fromDate: Date, toDate: Date }> => {
  const periods: Array<{ fromDate: Date, toDate: Date }> = []
  const today = new Date(Date.now())
  const earliestSupportedDate = getCardTransactionStartDate()
  const supportedToDate = new Date(Math.min(toDate.getTime(), today.getTime()))
  let periodStart = new Date(Math.max(fromDate.getTime(), earliestSupportedDate.getTime()))

  while (periodStart.getTime() <= supportedToDate.getTime()) {
    const periodEnd = new Date(Math.min(
      periodStart.getTime() + (MAX_TRANSACTION_PERIOD_DAYS - 1) * DAY_MS,
      supportedToDate.getTime()
    ))
    periods.push({ fromDate: periodStart, toDate: periodEnd })
    periodStart = new Date(periodEnd.getTime() + DAY_MS)
  }

  return periods
}

const getErrorInfo = (body: ErrorResponse | null | undefined): ErrorInfo | null =>
  body?.errorInfo ?? body?.error?.errorInfo ?? null

const getErrorMessage = (body: ErrorResponse | null | undefined, fallback: string): string => {
  const errorInfo = getErrorInfo(body)
  return errorInfo?.errorDescription ?? errorInfo?.errorText ?? fallback
}

export class CardTransactionsUnavailableError extends BankMessageError {}

const assertSuccess = <T extends ErrorResponse>(response: ApiResponse<T>, context: string): T => {
  if (response.status >= 200 && response.status < 300) return response.body

  console.error(`[BELARUSBANK:${context}] HTTP ${response.status}`, getErrorInfo(response.body))
  if (context === 'CARD_TRANSACTIONS' && String(getErrorInfo(response.body)?.code ?? '') === '1094') {
    throw new CardTransactionsUnavailableError(getErrorMessage(response.body, 'Операции по карте временно недоступны'))
  }

  throw new BankMessageError(getErrorMessage(response.body, `Ошибка Беларусбанка (HTTP ${response.status})`))
}

const parseLoginRequest = (value: unknown): LoginRequest | undefined => {
  const deviceUid = getOptString(value, 'deviceUid')
  const login = getOptString(value, 'login')
  const mobilePhone = getOptString(value, 'mobilePhone')
  const password = getOptString(value, 'password')
  if (deviceUid == null || deviceUid.length === 0 || password == null || password.length === 0 ||
      ((login == null || login.length === 0) && (mobilePhone == null || mobilePhone.length === 0))) return undefined

  const appVersion = getOptString(value, 'appVersion')
  const deviceModel = getOptString(value, 'deviceModel')
  const osType = getOptString(value, 'osType')
  const osVersion = getOptString(value, 'osVersion')
  const token = getOptString(value, 'token')
  if (appVersion == null || deviceModel == null || osType == null || osVersion == null) return undefined

  return {
    appVersion,
    deviceModel,
    deviceUid,
    ...(login != null ? { login } : {}),
    ...(mobilePhone != null ? { mobilePhone } : {}),
    osType,
    osVersion,
    password,
    ...(token != null ? { token } : {})
  }
}

const parseAuth = (value: unknown, stage: 'hot' | 'cold', previous?: Pick<AuthState, 'loginRequest' | 'platformType'>): AuthState => {
  const sessionToken = getOptString(value, 'sessionToken') ?? getOptString(value, 'token')
  const refreshToken = getOptString(value, 'refreshToken')
  const tokenType = getOptString(value, 'tokenType')
  console.assert(
    sessionToken != null && sessionToken.length > 0 && refreshToken != null && refreshToken.length > 0 && tokenType != null && tokenType.length > 0,
    `[auth/${stage}] Missing required authorization tokens`,
    { hasSessionToken: Boolean(sessionToken), hasRefreshToken: Boolean(refreshToken), hasTokenType: Boolean(tokenType) }
  )
  const accessClaims = getTokenClaims(sessionToken as string)
  const refreshClaims = getTokenClaims(refreshToken as string)
  const lifetime = (claims: unknown): number | null => {
    const exp = getOptNumber(claims, 'exp')
    const iat = getOptNumber(claims, 'iat')
    return exp != null && iat != null && Number.isFinite(exp - iat) ? exp - iat : null
  }
  console.log(`[auth/${stage}] Token lifetime in seconds`, {
    access: lifetime(accessClaims), refresh: lifetime(refreshClaims)
  })
  return {
    sessionToken: sessionToken as string,
    refreshToken: refreshToken as string,
    tokenType: tokenType as string,
    ...previous
  }
}

const getTokenClaims = (token: string): unknown => {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(Utf8.stringify(Base64.parse(parts[1].replace(/-/g, '+').replace(/_/g, '/')))) as unknown
  } catch {
    return null
  }
}

const getTokenExpiry = (token: string): number | null => {
  const exp = getOptNumber(getTokenClaims(token), 'exp')
  return exp != null && Number.isFinite(exp * 1000) ? exp * 1000 : null
}

const getAuthErrorCode = (body: unknown): string | undefined => {
  const code = getOptNumber(body, 'errorInfo.code') ?? getOptString(body, 'errorInfo.code')
  return code != null ? String(code) : undefined
}

// Android 2026.7.0 loginConfirmation: PIN is checked locally, then saved credentials
// and the same deviceUid are used for preparation/confirmation without an OTP.
const authenticateSavedDevice = async (auth: AuthState, loginRequest: LoginRequest): Promise<AuthState | null> => {
  const preparation = await fetchApi<unknown>('users/auth/login/preparation', {
    method: 'POST', query: { loginMode: 'PIN' }, body: loginRequest, ...authOptions(auth), platformType: 'mobile', retry: false
  })
  const confirmedRejection = (response: ApiResponse<unknown>): boolean => {
    if (response.status >= 200 && response.status < 300) return false
    // The official application resets saved credentials only for these AUTH_ERRORS.
    return ['1011', '1042'].includes(getAuthErrorCode(response.body) ?? '')
  }
  if (confirmedRejection(preparation)) return null
  console.assert(preparation.status >= 200 && preparation.status < 300, '[auth/hot] Saved-device preparation failed', {
    status: preparation.status, errorCode: getAuthErrorCode(preparation.body)
  })
  const requestId = getOptString(preparation.body, 'requestId')
  console.assert(requestId != null && requestId.length > 0, '[auth/hot] Missing saved-device request ID')
  const confirmation = await fetchApi<unknown>(`users/auth/login/${encodeURIComponent(requestId as string)}`, {
    method: 'POST', body: { requestId }, ...authOptions(auth), platformType: 'mobile', retry: false
  })
  if (confirmedRejection(confirmation)) return null
  console.assert(confirmation.status >= 200 && confirmation.status < 300, '[auth/hot] Saved-device confirmation failed', {
    status: confirmation.status, errorCode: getAuthErrorCode(confirmation.body)
  })
  return parseAuth(confirmation.body, 'hot', { loginRequest })
}

export const authenticate = async (
  storedAuth: unknown,
  isInBackground: boolean,
  onAuthUpdate?: (auth: AuthState) => void
): Promise<AuthState> => {
  const sessionToken = getOptString(storedAuth, 'sessionToken')
  const refreshToken = getOptString(storedAuth, 'refreshToken')
  const tokenType = getOptString(storedAuth, 'tokenType')
  const platformType = getOptString(storedAuth, 'platformType') === 'pwa' ? 'pwa' as const : undefined
  const savedLoginRequest = storedAuth != null && typeof storedAuth === 'object'
    ? parseLoginRequest((storedAuth as Record<string, unknown>).loginRequest)
    : undefined
  if (sessionToken != null && sessionToken.length > 0 && refreshToken != null && refreshToken.length > 0 && tokenType != null && tokenType.length > 0) {
    const savedDevice = {
      ...(savedLoginRequest != null ? { loginRequest: savedLoginRequest } : {}),
      ...(platformType != null ? { platformType } : {})
    }
    const auth = { sessionToken, refreshToken, tokenType, ...savedDevice }
    const accessExpiry = getTokenExpiry(sessionToken)
    if (accessExpiry != null && accessExpiry >= Date.now() + TOKEN_REFRESH_SAFE_GAP_MS) return auth
    const refreshExpiry = getTokenExpiry(refreshToken)
    if (refreshExpiry == null || refreshExpiry > Date.now()) {
      const response = await fetchApi<unknown>('users/auth/refresh-token', {
        method: 'POST', body: refreshToken, rawStringBody: true, ...authOptions(auth), retry: false
      })
      console.assert(response.status >= 200 && response.status < 300, '[auth/hot] Refresh request failed', {
        status: response.status, errorCode: getOptNumber(response.body, 'errorInfo.code') ?? getOptString(response.body, 'errorInfo.code')
      })
      return parseAuth(response.body, 'hot', savedDevice)
    }
    if (savedLoginRequest != null) {
      const renewed = await authenticateSavedDevice(auth, savedLoginRequest)
      if (renewed != null) return renewed
      // Avoid spending another password attempt on the next sync if cold auth is canceled.
      onAuthUpdate?.({ sessionToken, refreshToken, tokenType, ...(platformType != null ? { platformType } : {}) })
      console.log('[auth/hot] Saved-device credentials rejected; starting cold authentication')
    } else {
      console.log('[auth/hot] Saved refresh token expired and saved-device credentials are unavailable; starting cold authentication')
    }
  }
  let confirmedAuth: AuthState | undefined
  const acceptColdAuth = (result: unknown): AuthState => {
    const loginRequest = result != null && typeof result === 'object'
      ? parseLoginRequest((result as Record<string, unknown>).loginRequest)
      : undefined
    const auth = parseAuth(result, 'cold', {
      ...(loginRequest != null ? { loginRequest } : {}),
      ...(getOptString(result, 'platformType') === 'pwa' ? { platformType: 'pwa' as const } : {})
    })
    onAuthUpdate?.(auth)
    confirmedAuth = auth
    return auth
  }
  const result = await authorizeInWebView(isInBackground, acceptColdAuth)
  return confirmedAuth ?? acceptColdAuth(result)
}

interface SessionInput {
  sessionToken: string
  tokenType: string
  platformType?: 'pwa'
}

const authOptions = (auth: AuthState): SessionInput => ({
  sessionToken: auth.sessionToken,
  tokenType: auth.tokenType,
  ...(auth.platformType != null ? { platformType: auth.platformType } : {})
})

const enrichDeposit = async (auth: AuthState, deposit: BankAccount): Promise<BankAccount> => {
  if (
    deposit.contractOpenDate != null &&
    (deposit.contractEndDate != null || deposit.contractCloseDate != null || deposit.returnDate != null) &&
    deposit.percRate != null
  ) return deposit

  const response = await fetchApi<BankAccount>(`deposits/${encodeURIComponent(String(deposit.productId))}`, authOptions(auth))
  return { ...deposit, ...assertSuccess(response, 'DEPOSIT_DETAILS') }
}

const enrichCredit = async (auth: AuthState, credit: Credit): Promise<Credit> => {
  if (credit.contractOpenDate != null && credit.returnDate != null && credit.restCredit != null) return credit

  const response = await fetchApi<Credit>(`credits/${encodeURIComponent(String(credit.productId))}`, authOptions(auth))
  return { ...credit, ...assertSuccess(response, 'CREDIT_DETAILS') }
}

export const getProducts = async (auth: AuthState): Promise<ProductAccount[]> => {
  const session = authOptions(auth)
  const [cardsResponse, accountsResponse, depositsResponse, creditsResponse] = await Promise.all([
    fetchApi<CardsResponse>('cards', { query: { ibState: 'VISIBLE', refresh: true }, ...session }),
    fetchApi<AccountsResponse>('accounts', { query: { ibState: 'VISIBLE', refresh: true }, ...session }),
    fetchApi<AccountsResponse>('deposits', { query: { ibState: 'VISIBLE', refresh: true }, ...session }),
    fetchApi<CreditsResponse>('credits', { query: { ibState: 'VISIBLE', refresh: true }, ...session })
  ])

  const cards = assertSuccess(cardsResponse, 'CARDS').cards ?? []
  const accounts = assertSuccess(accountsResponse, 'ACCOUNTS').accounts ?? []
  const authoritativeLinks = await loadAuthoritativeCardAccountLinks(auth, accounts)
  const deposits = await Promise.all((assertSuccess(depositsResponse, 'DEPOSITS').accounts ?? []).map(async (deposit) => await enrichDeposit(auth, deposit)))
  const credits = await Promise.all((assertSuccess(creditsResponse, 'CREDITS').credits ?? []).map(async (credit) => await enrichCredit(auth, credit)))

  return convertAccounts({ cards, accounts, authoritativeLinks, deposits, credits })
}

/** Loads and parses the official posted-operation statement for a linked card account. */
export const getStatementTransactions = async (
  auth: AuthState,
  account: ProductAccount,
  fromDate: Date,
  toDate: Date
): Promise<ReturnType<typeof parseStatementTransactions>> => {
  if (account._meta.statementProductId == null || account._meta.productKind !== 'card' || account._meta.cardStatementAllowed === false) return []
  if (fromDate.getTime() > toDate.getTime()) return []

  const response = await fetchApi<ArrayBuffer>(`cards/documents/${encodeURIComponent(account._meta.statementProductId)}/statement`, {
    query: {
      startDate: formatApiDate(fromDate),
      endDate: formatApiDate(toDate)
    },
    binaryResponse: true,
    accept: 'application/pdf, application/octet-stream, */*',
    ...authOptions(auth)
  })
  if (!(response.status >= 200 && response.status < 300)) {
    throw new BankMessageError(`Не удалось получить выписку Беларусбанка (HTTP ${response.status})`)
  }
  if (!(response.body instanceof ArrayBuffer)) throw new Error('Belarusbank statement response is not binary')

  const { text } = await parsePdf({ arrayBuffer: async () => response.body })
  return parseStatementTransactions(text, account)
}

type ConvertedCardTransaction = ReturnType<typeof convertCardTransaction>

interface AvailableCardTransactionPeriod {
  transactions: ConvertedCardTransaction[]
  fullyUnavailable: boolean
}

const loadCardTransactionPeriod = async (
  auth: AuthState,
  account: ProductAccount,
  fromDate: Date,
  toDate: Date
): Promise<ConvertedCardTransaction[]> => {
  const transactions: ConvertedCardTransaction[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while ((page - 1) * PAGE_SIZE < total && page <= MAX_TRANSACTION_PAGES) {
    const response = await fetchApi<CardTransactionsResponse>(`cards/transactions/${encodeURIComponent(account._meta.transactionCardId ?? '')}`, {
      method: 'POST',
      query: { page, size: PAGE_SIZE },
      body: {
        dateStart: formatApiDate(fromDate),
        dateEnd: formatApiDate(toDate)
      },
      ...authOptions(auth)
    })
    const body = assertSuccess(response, 'CARD_TRANSACTIONS')
    const pageTransactions = body.dataTable ?? []
    total = body.total ?? pageTransactions.length
    transactions.push(...pageTransactions.map((transaction) => convertCardTransaction(transaction, account)))

    if (pageTransactions.length === 0 || pageTransactions.length < PAGE_SIZE) break
    page += 1
  }

  return transactions
}

const loadAvailableCardTransactionPeriod = async (
  auth: AuthState,
  account: ProductAccount,
  fromDate: Date,
  toDate: Date,
  initialRequestFailed = false
): Promise<AvailableCardTransactionPeriod> => {
  const transactions: ConvertedCardTransaction[] = []
  let segmentStartDate = fromDate
  let skipInitialRequest = initialRequestFailed

  while (segmentStartDate.getTime() <= toDate.getTime()) {
    if (!skipInitialRequest) {
      try {
        transactions.push(...await loadCardTransactionPeriod(auth, account, segmentStartDate, toDate))
        return { transactions, fullyUnavailable: false }
      } catch (error) {
        if (!(error instanceof CardTransactionsUnavailableError)) throw error
      }
    }
    skipInitialRequest = false

    let loadedPrefixEndDate: Date | null = null
    for (let fallbackEndDate = new Date(toDate.getTime() - DAY_MS); fallbackEndDate.getTime() >= segmentStartDate.getTime(); fallbackEndDate = new Date(fallbackEndDate.getTime() - DAY_MS)) {
      try {
        transactions.push(...await loadCardTransactionPeriod(auth, account, segmentStartDate, fallbackEndDate))
        loadedPrefixEndDate = fallbackEndDate
        break
      } catch (fallbackError) {
        if (!(fallbackError instanceof CardTransactionsUnavailableError)) throw fallbackError
      }
    }

    if (loadedPrefixEndDate == null) {
      console.warn(`[BELARUSBANK:CARD_TRANSACTIONS] Period starting ${formatApiDate(segmentStartDate)} is unavailable; later periods will be retried`)
      return { transactions, fullyUnavailable: true }
    }

    const unavailableDate = new Date(loadedPrefixEndDate.getTime() + DAY_MS)
    console.warn(`[BELARUSBANK:CARD_TRANSACTIONS] Date ${formatApiDate(unavailableDate)} is unavailable; it will be retried`)
    segmentStartDate = new Date(unavailableDate.getTime() + DAY_MS)
  }

  return { transactions, fullyUnavailable: false }
}

export const getCardTransactions = async (
  auth: AuthState,
  account: ProductAccount,
  fromDate: Date,
  toDate: Date
): Promise<Array<ReturnType<typeof convertCardTransaction>>> => {
  if (account._meta.transactionCardId == null || account._meta.cardTransactionsAllowed === false) return []

  const transactions: ConvertedCardTransaction[] = []
  const periods = getTransactionPeriods(fromDate, toDate)
  if (periods.length === 0) return []

  const supportedFromDate = periods[0].fromDate
  const supportedToDate = periods[periods.length - 1].toDate

  try {
    transactions.push(...await loadCardTransactionPeriod(auth, account, supportedFromDate, supportedToDate))
  } catch (error) {
    if (!(error instanceof CardTransactionsUnavailableError)) throw error

    if (periods.length === 1) {
      const fallback = await loadAvailableCardTransactionPeriod(auth, account, supportedFromDate, supportedToDate, true)
      transactions.push(...fallback.transactions)
    } else {
      const shortenedToDate = new Date(supportedToDate.getTime() - DAY_MS)
      try {
        transactions.push(...await loadCardTransactionPeriod(auth, account, supportedFromDate, shortenedToDate))
        console.warn(`[BELARUSBANK:CARD_TRANSACTIONS] Loaded through ${formatApiDate(shortenedToDate)}; newer dates will be retried`)
        const tail = await loadAvailableCardTransactionPeriod(auth, account, supportedToDate, supportedToDate)
        transactions.push(...tail.transactions)
      } catch (shortenedError) {
        if (!(shortenedError instanceof CardTransactionsUnavailableError)) throw shortenedError

        console.warn(`[BELARUSBANK:CARD_TRANSACTIONS] Full range is unavailable; retrying in ${MAX_TRANSACTION_PERIOD_DAYS}-day periods`)
        for (const period of periods) {
          const fallback = await loadAvailableCardTransactionPeriod(auth, account, period.fromDate, period.toDate)
          transactions.push(...fallback.transactions)
          if (fallback.fullyUnavailable) break
        }
      }
    }
  }

  const unique = new Map<string, ReturnType<typeof convertCardTransaction>>()
  for (const transaction of transactions) {
    const id = transaction.movements[0].id
    if (id != null) unique.set(id, transaction)
  }

  return Array.from(unique.values())
}

export const getPaymentHistory = async (
  auth: AuthState,
  account: ProductAccount,
  fromDate: Date,
  toDate: Date
): Promise<Array<NonNullable<ReturnType<typeof convertPaymentHistoryTransaction>>>> => {
  const productType = account._meta.productKind === 'card'
    ? 'CARD'
    : account._meta.productKind === 'account'
      ? 'ACCOUNT'
      : null
  if (productType == null) return []

  const payments = mergePaymentHistoryItemsByRrn(
    await loadPaymentHistoryItems(auth, fromDate, toDate, {
      productId: account._meta.productId,
      productType
    }),
    () => account.id
  )

  const transactions: Array<NonNullable<ReturnType<typeof convertPaymentHistoryTransaction>>> = []
  for (const payment of payments) {
    const transaction = convertPaymentHistoryTransaction(payment, account)
    if (transaction != null) transactions.push(transaction)
  }

  return uniquePaymentHistoryTransactions(transactions)
}

interface PaymentHistoryFilter {
  productId?: string
  productType: 'CARD' | 'ACCOUNT'
}

const loadPaymentHistoryItems = async (
  auth: AuthState,
  fromDate: Date,
  toDate: Date,
  filter: PaymentHistoryFilter
): Promise<PaymentHistoryItem[]> => {
  const supportedFromDate = new Date(Math.max(fromDate.getTime(), getPaymentHistoryStartDate().getTime()))
  const supportedToDate = new Date(Math.min(toDate.getTime(), Date.now()))
  if (supportedFromDate.getTime() > supportedToDate.getTime()) return []

  const payments: PaymentHistoryItem[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while ((page - 1) * PAYMENT_HISTORY_PAGE_SIZE < total && page <= MAX_TRANSACTION_PAGES) {
    const loadPage = async (refresh: boolean): Promise<PaymentHistoryResponse> => assertSuccess(
      await fetchApi<PaymentHistoryResponse>('payments/history', {
        method: 'POST',
        query: { page, size: PAYMENT_HISTORY_PAGE_SIZE },
        body: {
          dateRangeStartDt: formatApiDate(supportedFromDate),
          dateRangeEndDt: formatApiDate(supportedToDate),
          ...filter,
          refresh
        },
        ...authOptions(auth)
      }),
      'PAYMENT_HISTORY'
    )

    let body = await loadPage(page === 1)
    let pagePayments = body.dataTable ?? []
    if (page === 1 && pagePayments.length === 0 && (body.total ?? 0) === 0) {
      body = await loadPage(false)
      pagePayments = body.dataTable ?? []
    }
    total = body.total ?? pagePayments.length
    payments.push(...pagePayments)

    if (pagePayments.length === 0 || page * PAYMENT_HISTORY_PAGE_SIZE >= total) break
    page += 1
  }

  return payments
}

const uniquePaymentHistoryTransactions = (
  transactions: Array<NonNullable<ReturnType<typeof convertPaymentHistoryTransaction>>>
): Array<NonNullable<ReturnType<typeof convertPaymentHistoryTransaction>>> => {
  const unique = new Map<string, NonNullable<ReturnType<typeof convertPaymentHistoryTransaction>>>()
  for (const transaction of transactions) {
    const id = transaction.movements[0].id
    if (id != null) unique.set(id, transaction)
  }
  return Array.from(unique.values())
}

const mergePaymentHistoryItemsByRrn = (
  payments: PaymentHistoryItem[],
  getAccountId: (payment: PaymentHistoryItem) => string | null
): PaymentHistoryItem[] => {
  const uniqueRows = Array.from(new Map(payments.map((payment) => [String(payment.id), payment])).values())
  const groups = new Map<string, { firstIndex: number, rows: PaymentHistoryItem[] }>()
  const output: Array<{ index: number, payment: PaymentHistoryItem }> = []

  uniqueRows.forEach((payment, index) => {
    const rrn = asNonEmptyString(payment.rrn)
    const approvalId = asNonEmptyString(payment.approvalId)
    const eventTime = asNonEmptyString(payment.timeBpc) ?? asNonEmptyString(payment.time)
    const channelTypeId = asNonEmptyString(payment.channelTypeId)
    const paymentId = asNonEmptyString(payment.paymentId)
    const paymentIdLeaf = asNonEmptyString(payment.paymentIdLeaf)
    const statusType = asNonEmptyString(payment.statusType)?.toLowerCase() ?? null
    const accountId = getAccountId(payment)
    if (
      rrn == null ||
      approvalId == null ||
      eventTime == null ||
      channelTypeId == null ||
      paymentId == null ||
      paymentIdLeaf == null ||
      statusType !== 'success' ||
      accountId == null
    ) {
      output.push({ index, payment })
      return
    }

    const key = JSON.stringify({
      accountId,
      rrn,
      currency: asNonEmptyString(payment.currency),
      approvalId,
      eventTime,
      channelTypeId,
      paymentId,
      paymentIdLeaf,
      statusType
    })
    const group = groups.get(key) ?? { firstIndex: index, rows: [] }
    group.rows.push(payment)
    groups.set(key, group)
  })

  for (const [key, group] of groups) {
    const first = group.rows[0]
    const amount = Math.round(group.rows.reduce((sum, payment) => sum + Math.abs(toNumber(payment.amount, 0)), 0) * 100) / 100
    const feeAmount = Math.round(group.rows.reduce((sum, payment) => sum + Math.abs(toNumber(payment.feeAmount, 0)), 0) * 100) / 100
    output.push({
      index: group.firstIndex,
      payment: {
        ...first,
        id: `rrn:${key}`,
        amount,
        feeAmount
      }
    })
  }

  return output
    .sort((left, right) => left.index - right.index)
    .map(({ payment }) => payment)
}

const findPaymentHistoryAccount = (payment: PaymentHistoryItem, accounts: ProductAccount[]): ProductAccount | null => {
  const lastDigits = getLastCardDigits(payment.cardNumber)
  const cardAccount = normalizeProductIdentifier(payment.cardAccount)
  const matches = accounts.filter((account) =>
    (lastDigits != null && account.syncIds.includes(lastDigits)) ||
    (cardAccount != null && account.syncIds.some((syncId) => normalizeProductIdentifier(syncId) === cardAccount))
  )
  return matches.length === 1 ? matches[0] : null
}

/** Loads the app-wide card payment history once and maps every row to its card. */
export const getGeneralPaymentHistory = async (
  auth: AuthState,
  accounts: ProductAccount[],
  fromDate: Date,
  toDate: Date
): Promise<Array<NonNullable<ReturnType<typeof convertPaymentHistoryTransaction>>>> => {
  if (accounts.length === 0) return []

  const payments = mergePaymentHistoryItemsByRrn(
    await loadPaymentHistoryItems(auth, fromDate, toDate, { productType: 'CARD' }),
    (payment) => findPaymentHistoryAccount(payment, accounts)?.id ?? null
  )
  const transactions: Array<NonNullable<ReturnType<typeof convertPaymentHistoryTransaction>>> = []
  for (const payment of payments) {
    const account = findPaymentHistoryAccount(payment, accounts)
    if (account == null) continue
    const transaction = convertPaymentHistoryTransaction(payment, account)
    if (transaction != null) transactions.push(transaction)
  }
  return uniquePaymentHistoryTransactions(transactions)
}
