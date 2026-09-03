import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryUnavailableError, UserInteractionError } from '../../errors'
import { parsePdf } from '../../common/pdfUtils'
import { convertCard, convertCardTransaction, convertCredit, convertDeposit, convertPaymentHistoryTransaction } from './converters'
import { fetchApi, type ApiResponse } from './fetchApi'
import { asNonEmptyString, getLastCardDigits, toNumber } from './helpers'
import { APP_VERSION, AUTH_DATA_KEY, DEVICE_UID_DATA_KEY, type AuthState, type PreferenceInput, type ProductAccount } from './models'
import { parseStatementTransactions } from './statement'
import type { AccountsResponse, BankAccount, Card, CardTransactionsResponse, CardsResponse, Credit, CreditsResponse, ErrorInfo, ErrorResponse, LoginPreparationResponse, LoginRequest, LoginResponse, PaymentHistoryItem, PaymentHistoryResponse } from './types/fetch'

const PAGE_SIZE = 100
const PAYMENT_HISTORY_PAGE_SIZE = 300
const MAX_TRANSACTION_PAGES = 100
const MAX_TRANSACTION_PERIOD_DAYS = 15
const MAX_TRANSACTION_LOOKBACK_MONTHS = 6
const DAY_MS = 24 * 60 * 60 * 1000
const MINSK_TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000
const formatApiDate = (date: Date): string => new Date(date.getTime() + MINSK_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)

const normalizeProductIdentifier = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/\s/g, '').toUpperCase()
  return normalized.length > 0 ? normalized : null
}

/** Returns whether a card belongs to a current account returned by Belarusbank. */
export const isCardLinkedToAccount = (card: Card, account: BankAccount): boolean => {
  const accountContractNumber = normalizeProductIdentifier(account.contractNumber)
  const accountIban = normalizeProductIdentifier(account.ibanNum)
  const cardContractNumbers = [card.cardAccountNumber, card.contractNumber]
    .map(normalizeProductIdentifier)
    .filter((value): value is string => value != null)
  const cardIban = normalizeProductIdentifier(card.ibanNum)

  if (accountContractNumber != null && cardContractNumbers.length > 0) {
    return cardContractNumbers.includes(accountContractNumber)
  }

  return accountIban != null && cardIban === accountIban
}

const findLinkedAccount = (
  card: Card,
  accounts: BankAccount[],
  authoritativeLinks: Map<string, BankAccount[]>
): BankAccount | undefined => {
  const authoritativeMatches = authoritativeLinks.get(String(card.productId))
  if (authoritativeMatches != null) return authoritativeMatches.length === 1 ? authoritativeMatches[0] : undefined

  const matches = accounts.filter((account) => isCardLinkedToAccount(card, account))
  return matches.length === 1 ? matches[0] : undefined
}

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
      console.warn(`[BELARUSBANK:CARD_ACCOUNT_LINK] HTTP ${response.status}`)
      return
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
  if (response.status >= 500) throw new TemporaryUnavailableError()
  if (context === 'CARD_TRANSACTIONS' && String(getErrorInfo(response.body)?.code ?? '') === '1094') {
    throw new CardTransactionsUnavailableError(getErrorMessage(response.body, 'Операции по карте временно недоступны'))
  }

  throw new BankMessageError(getErrorMessage(response.body, `Ошибка Беларусбанка (HTTP ${response.status})`))
}

const makeDeviceUid = (): string => {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.map((value) => `0${value.toString(16)}`.slice(-2)).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const getDeviceUid = (): string => {
  const stored = ZenMoney.getData(DEVICE_UID_DATA_KEY, null)
  if (typeof stored === 'string' && stored.length > 0) return stored

  const deviceUid = makeDeviceUid()
  ZenMoney.setData(DEVICE_UID_DATA_KEY, deviceUid)
  ZenMoney.saveData()
  return deviceUid
}

const normalizePhone = (login: string): string | null => {
  const phone = login.replace(/[\s()-]/g, '')
  return /^\+?375\d{9}$/.test(phone) ? (phone.startsWith('+') ? phone : `+${phone}`) : null
}

const makeLoginRequest = (preferences: PreferenceInput): LoginRequest => {
  const login = preferences.login.trim()
  const phone = normalizePhone(login)

  return {
    appVersion: APP_VERSION,
    deviceModel: 'ZenMoney',
    deviceUid: getDeviceUid(),
    ...(phone == null ? { login } : { mobilePhone: phone }),
    osType: 'Android',
    osVersion: '16',
    password: preferences.password,
    token: ''
  }
}

const saveAuth = (login: string, response: LoginResponse, previous?: AuthState): AuthState => {
  const sessionToken = response.sessionToken ?? response.token ?? previous?.sessionToken
  const refreshToken = response.refreshToken ?? previous?.refreshToken
  const tokenType = response.tokenType ?? previous?.tokenType ?? 'Bearer'

  if (sessionToken == null || refreshToken == null) {
    throw new Error('Belarusbank auth response does not contain required tokens')
  }

  const auth: AuthState = { login, sessionToken, refreshToken, tokenType }
  ZenMoney.setData(AUTH_DATA_KEY, auth)
  ZenMoney.saveData()
  return auth
}

const loadAuth = (): AuthState | null => {
  const value = ZenMoney.getData(AUTH_DATA_KEY, null) as Partial<AuthState> | null
  if (
    value == null ||
    typeof value.login !== 'string' ||
    typeof value.sessionToken !== 'string' ||
    typeof value.refreshToken !== 'string' ||
    typeof value.tokenType !== 'string'
  ) return null

  return value as AuthState
}

const tryRefresh = async (login: string, auth: AuthState): Promise<AuthState | null> => {
  const response = await fetchApi<LoginResponse>('users/auth/refresh-token', {
    method: 'POST',
    body: auth.refreshToken,
    rawStringBody: true,
    retry: false
  })

  if (response.status >= 200 && response.status < 300) return saveAuth(login, response.body, auth)
  if ([400, 401, 403].includes(response.status)) return null
  if (response.status >= 500) throw new TemporaryUnavailableError()

  throw new BankMessageError(getErrorMessage(response.body, `Ошибка обновления сессии Беларусбанка (HTTP ${response.status})`))
}

const tryDirectLogin = async (preferences: PreferenceInput): Promise<AuthState | null> => {
  const response = await fetchApi<LoginResponse>('users/auth/login', {
    method: 'POST',
    body: makeLoginRequest(preferences),
    retry: false
  })

  if (response.status >= 200 && response.status < 300) return saveAuth(preferences.login.trim(), response.body)
  if ([400, 401, 403].includes(response.status)) return null
  if (response.status >= 500) throw new TemporaryUnavailableError()

  throw new BankMessageError(getErrorMessage(response.body, `Ошибка доверенного входа Беларусбанка (HTTP ${response.status})`))
}

const tryTrustedLogin = async (preferences: PreferenceInput): Promise<AuthState | null> => {
  const preparation = await fetchApi<LoginPreparationResponse>('users/auth/login/preparation', {
    method: 'POST',
    query: { loginMode: 'PIN' },
    body: makeLoginRequest(preferences),
    retry: false
  })

  if (!(preparation.status >= 200 && preparation.status < 300)) {
    if ([400, 401, 403].includes(preparation.status)) return null
    if (preparation.status >= 500) throw new TemporaryUnavailableError()
    throw new BankMessageError(getErrorMessage(preparation.body, `Ошибка доверенного входа Беларусбанка (HTTP ${preparation.status})`))
  }

  if (typeof preparation.body.requestId !== 'string' || preparation.body.requestId.length === 0) return null

  const confirmation = await fetchApi<LoginResponse>(`users/auth/login/${encodeURIComponent(preparation.body.requestId)}`, {
    method: 'POST',
    body: { requestId: preparation.body.requestId },
    retry: false
  })

  if (confirmation.status >= 200 && confirmation.status < 300) return saveAuth(preferences.login.trim(), confirmation.body)
  if ([400, 401, 403].includes(confirmation.status)) return null
  if (confirmation.status >= 500) throw new TemporaryUnavailableError()

  throw new BankMessageError(getErrorMessage(confirmation.body, `Ошибка подтверждения доверенного входа Беларусбанка (HTTP ${confirmation.status})`))
}

const loginWithSms = async (preferences: PreferenceInput, isInBackground: boolean): Promise<AuthState> => {
  if (isInBackground) throw new UserInteractionError()

  const preparation = await fetchApi<LoginPreparationResponse>('users/auth/login/preparation', {
    method: 'POST',
    body: makeLoginRequest(preferences),
    retry: false
  })

  if (!(preparation.status >= 200 && preparation.status < 300)) {
    const errorInfo = getErrorInfo(preparation.body)
    const code = String(errorInfo?.code ?? '')
    const message = getErrorMessage(preparation.body, 'Не удалось войти в Беларусбанк')

    if (code === '1011' || /логин|парол|зарегистр|login|password/i.test(message)) {
      throw new InvalidLoginOrPasswordError(message)
    }

    if (preparation.status >= 500) throw new TemporaryUnavailableError()
    throw new BankMessageError(message)
  }

  if (typeof preparation.body.requestId !== 'string' || preparation.body.requestId.length === 0) {
    throw new Error('Belarusbank login preparation response does not contain requestId')
  }

  let codeWord: string | undefined
  if (preparation.body.needCodeWord === true) {
    const answer = await ZenMoney.readLine('Введите кодовое слово для входа в Беларусбанк', {
      inputType: 'text',
      time: 120000
    })
    codeWord = answer?.trim()
    if (codeWord == null || codeWord.length === 0) throw new InvalidOtpCodeError('Кодовое слово не введено')
  }

  const code = await ZenMoney.readLine('Введите 6-значный код из SMS от Беларусбанка', {
    inputType: 'number',
    time: 120000
  })
  const normalizedCode = code?.trim()
  if (normalizedCode == null || normalizedCode.length === 0) throw new InvalidOtpCodeError('Код из SMS не введён')

  const confirmationPayload = {
    requestId: preparation.body.requestId,
    code: normalizedCode,
    ...(codeWord == null ? {} : { codeWord })
  }
  const confirmation = await fetchApi<LoginResponse>(`users/auth/login/${encodeURIComponent(preparation.body.requestId)}`, {
    method: 'POST',
    query: {
      code: normalizedCode,
      codeWord
    },
    body: confirmationPayload,
    retry: false
  })

  if (!(confirmation.status >= 200 && confirmation.status < 300)) {
    const message = getErrorMessage(confirmation.body, 'Неверный код подтверждения Беларусбанка')
    if (confirmation.status === 400 || confirmation.status === 401) throw new InvalidOtpCodeError(message)
    if (confirmation.status >= 500) throw new TemporaryUnavailableError()
    throw new BankMessageError(message)
  }

  return saveAuth(preferences.login.trim(), confirmation.body)
}

export const authenticate = async (preferences: PreferenceInput, isInBackground: boolean): Promise<AuthState> => {
  const normalizedLogin = preferences.login.trim()
  const stored = loadAuth()

  if (stored?.login === normalizedLogin) {
    const refreshed = await tryRefresh(normalizedLogin, stored)
    if (refreshed != null) return refreshed
  }

  const direct = await tryDirectLogin(preferences)
  if (direct != null) return direct

  const trusted = await tryTrustedLogin(preferences)
  if (trusted != null) return trusted

  return await loginWithSms(preferences, isInBackground)
}

interface SessionInput {
  sessionToken: string
  tokenType: string
}

const authOptions = (auth: AuthState): SessionInput => ({
  sessionToken: auth.sessionToken,
  tokenType: auth.tokenType
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

  return [
    ...cards.map((card) => convertCard(card, findLinkedAccount(card, accounts, authoritativeLinks))),
    ...deposits.map(convertDeposit),
    ...credits.map(convertCredit)
  ]
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
    console.error(`[BELARUSBANK:STATEMENT] HTTP ${response.status}`)
    if (response.status >= 500) throw new TemporaryUnavailableError()
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
