import qs from 'querystring'
import * as setCookie from 'set-cookie-parser'
import { UserInteractionError } from '../../errors'
import { dateInTimezone, toISODateString } from '../../common/dateUtils'
import { fetch, fetchJson, ParseError } from '../../common/network'
import { cookieJar } from '../../common/network/cookies'
import { WebView } from '../../common/webView'
import { generateRandomString } from '../../common/utils'
import { sanitize } from '../../common/sanitize'

const OFFICIAL_BASE_URL = 'https://login.bankhapoalim.co.il'
const OFFICIAL_COOKIE_DOMAINS = [
  'bankhapoalim.co.il',
  '.bankhapoalim.co.il',
  'login.bankhapoalim.co.il',
  '.login.bankhapoalim.co.il'
]
const WEB_LOGIN_URL = `${OFFICIAL_BASE_URL}/cgi-bin/poalwwwc?reqName=getLogonPage`
const WEB_SUCCESS_PATTERNS = [
  /\/portalserver\/HomePage/i,
  /\/ng-portals-bt\/rb\/he\//i,
  /\/ng--portals\/rb\/he\//i,
  /\/ng-portals\/rb\/he\//i
]
const PORTAL_PAGE_PATHS = [
  '/portalserver/HomePage',
  '/ng-portals-bt/rb/he/homepage',
  '/ng--portals/rb/he/homepage',
  '/ng-portals/rb/he/homepage'
]
const REST_CONTEXT_URL_PATTERNS = [
  /https:\/\/login\.bankhapoalim\.co\.il\/([^/?#]+)\/current-account\//i,
  /https:\/\/login\.bankhapoalim\.co\.il\/([^/?#]+)\/credit-and-mortgage\//i,
  /https:\/\/login\.bankhapoalim\.co\.il\/([^/?#]+)\/foreign-currency\//i,
  /https:\/\/login\.bankhapoalim\.co\.il\/([^/?#]+)\/deposits-and-savings\//i
]
const REST_CONTEXT_TEXT_PATTERNS = [
  /restContext["']?\s*[:=]\s*["']\/([^/"'?]+)["']/i,
  /https:\/\/login\.bankhapoalim\.co\.il\/([^/"'?]+)\/current-account\//i,
  /https:\/\/login\.bankhapoalim\.co\.il\/([^/"'?]+)\/credit-and-mortgage\//i,
  /["'/]([^/"'?]+)\/current-account\/(?:composite|transactions)/i,
  /["'/]([^/"'?]+)\/credit-and-mortgage\//i
]
const EXCLUDED_REST_CONTEXTS = new Set([
  'AUTHENTICATE',
  'MCP',
  'ServerServices',
  'cgi-bin',
  'ng-portals',
  'ng-portals-bt',
  'ng--portals',
  'portalserver'
])
const OFFICIAL_TRANSACTION_PAGE_UUID = '/current-account/transactions'
const OFFICIAL_TRANSACTION_LIMIT = 1000
const COOKIE_STORE_POLL_INTERVAL_MS = 1000
const COOKIE_STORE_POLL_TIMEOUT_MS = 10 * 60 * 1000
const SESSION_OPERATION_TIMEOUT_MS = 15000
const sessionDeadlineErrors = new WeakSet()
const authUpdateCallbacks = new WeakMap()
const missingRestContexts = new WeakMap()
const authGateVerifiers = new WeakMap()
const OFFICIAL_AUTH_COOKIE_NAMES = new Set([
  'SMSESSION',
  'XSRF-TOKEN',
  'TS'
])

function summarizeResponse (response) {
  return response
    ? {
        status: response.status,
        url: sanitizeOfficialUrlForLog(response.url),
        contentType: getHeaderValue(response.headers, 'content-type'),
        isLoginPage: isOfficialLoginPageResponse(response),
        errCode: typeof response.body?.error?.errCode === 'string' ? response.body.error.errCode : null
      }
    : null
}

function throwResponseError (message, response, verify) {
  console.warn(message, summarizeResponse(response))
  const error = new Error(message)
  error.responseSummary = summarizeResponse(response)
  if (verify && isLikelyAuthGateError(error)) authGateVerifiers.set(error, verify)
  throw error
}

function ensure (condition, message, response, verify) {
  if (!condition) {
    throwResponseError(message, response, verify)
  }
}

export function getAuthGateVerifier (error) {
  return authGateVerifiers.get(error)
}

async function safeFetch (label, fn) {
  try {
    return await fn()
  } catch (error) {
    console.warn(`account endpoint failed: ${label}`, error?.responseSummary || summarizeResponse(error?.response) || { errorType: error?.name || 'Error' })
    throw error
  }
}

function createEmptyAuth () {
  return {
    cookieHeader: '',
    xsrfToken: null,
    restContext: null,
    acquiredAt: Date.now()
  }
}

function getHeaderValue (headers, name) {
  if (!headers) {
    return null
  }

  if (typeof headers.get === 'function') {
    return headers.get(name) || headers.get(name.toLowerCase()) || null
  }

  const lowerCaseName = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerCaseName) {
      return value
    }
  }

  return null
}

function parseCookieHeader (cookieHeader) {
  if (typeof cookieHeader !== 'string' || cookieHeader.trim() === '') {
    return {}
  }

  return cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(part => part.includes('='))
    .reduce((result, part) => {
      const separatorIndex = part.indexOf('=')
      const name = part.slice(0, separatorIndex).trim()
      const value = part.slice(separatorIndex + 1).trim()
      if (name !== '') {
        result[name] = value
      }
      return result
    }, {})
}

function mergeCookieHeaders (currentCookieHeader, nextCookieHeader) {
  const currentCookies = parseCookieHeader(currentCookieHeader)
  const nextCookies = parseCookieHeader(nextCookieHeader)
  const mergedCookies = { ...currentCookies, ...nextCookies }

  return Object.entries(mergedCookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

function mergeSetCookieHeaders (currentCookieHeader, setCookieHeader) {
  if (typeof setCookieHeader !== 'string' || setCookieHeader.trim() === '') {
    return currentCookieHeader
  }

  const mergedCookies = parseCookieHeader(currentCookieHeader)
  for (const cookie of setCookie.parse(setCookie.splitCookiesString(setCookieHeader), { decodeValues: false })) {
    if (!cookie?.name) continue
    // Max-Age overrides Expires; an explicit revocation must not revive a stale token.
    const expired = Number.isFinite(cookie.maxAge)
      ? cookie.maxAge <= 0
      : cookie.expires instanceof Date && cookie.expires.getTime() <= Date.now()
    if (cookie.value === '' || expired) delete mergedCookies[cookie.name]
    else mergedCookies[cookie.name] = cookie.value
  }
  return Object.entries(mergedCookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

function getCookieValue (cookieHeader, cookieName) {
  const cookies = parseCookieHeader(cookieHeader)
  return cookies[cookieName] || null
}

function isOfficialCookieDomain (domain) {
  if (typeof domain !== 'string' || domain === '') {
    return false
  }

  const normalizedDomain = domain.toLowerCase()
  return OFFICIAL_COOKIE_DOMAINS.includes(normalizedDomain) ||
    normalizedDomain.endsWith('.bankhapoalim.co.il')
}

function sanitizeOfficialUrlForLog (rawUrl) {
  try {
    const url = new URL(rawUrl)
    const path = url.pathname.replace(/(\/credit-and-mortgage\/(?:v3\/)?loans)\/.*/, '$1/<id>')
    const visibleQuery = new Set(['retrievalStartDate', 'retrievalEndDate', 'numItemsPerPage', 'sortCode', 'currencyCodeList', 'detailedAccountTypeCodeList', 'type', 'view'])
    for (const [key, value] of url.searchParams) {
      if (!visibleQuery.has(key)) url.searchParams.set(key, sanitize(value, true))
    }
    return `${url.origin}${path}${url.search}`
  } catch (error) {
    return null
  }
}

const FINANCIAL_LOG_FIELDS = new Set([
  'currentBalance', 'currentAccountCreditFrame', 'creditLimitAmount', 'pendingBalance', 'withdrawalBalance',
  'eventAmount', 'eventActivityTypeCode', 'transactionType', 'rejectedDataEventPertainingIndication',
  'eventDate', 'valueDate', 'formattedEventDate', 'formattedValueDate', 'formattedExecutingDate',
  'currencyCode', 'currencySwiftCode', 'currencyLongDescription', 'detailedAccountTypeCode',
  'creditCurrencyCode', 'debtAmount', 'originalLoanPrincipalAmount', 'interestRate',
  'revaluedTotalAmount', 'revaluedBalance', 'principalAmount', 'adjustedInterest',
  'subLoansCounter', 'subLoansPrincipalAmount', 'validityInterestRate',
  'formattedAgreementOpeningDate', 'formattedPaymentDate', 'formattedStartDate', 'formattedEndDate',
  'interestCreditingMethodDescription', 'interestPaymentDescription', 'depositingMethodDescription',
  'activityDescription', 'activityTypeCode', 'textCode', 'englishActionDesc',
  'depositSerialId', 'agreementOpeningDate', 'creditSerialNumber', 'unitedCreditTypeCode',
  'mortgageLoanSerialId', 'subLoansSerialId', 'formattedLoanEndDate', 'formattedCalculatedEndDate',
  'referenceNumber', 'serialNumber', 'expandedEventDate',
  'transactionResultCode', 'numItemsPerPage', 'retrievalMinDate', 'retrievalMaxDate',
  'formattedRetrievalMinDate', 'formattedRetrievalMaxDate', 'outputArrayRecordSum1', 'outputArrayRecordSum2', 'outputArrayRecordSum3', 'outputArrayRecordSum4',
  'messageCode', 'severity', 'recordSerialNumber', 'expendedExecutingDate', 'eventNumber', 'executingDate',
  'originalEventCreateDate', 'formattedOriginalEventCreateDate', 'eventSerialNumber', 'referenceCatenatedNumber', 'originalEventKey', 'originalSystemId',
  'bankNumber', 'branchNumber', 'contraBankNumber', 'contraBranchNumber', 'contraAccountTypeCode', 'internalLinkCode', 'dataGroupCode',
  'loanBalanceAmount', 'actualPrincipalBalance', 'interestAmount', 'currentInterestPercent',
  'arrearsAmount', 'arrearTotalAmount', 'arrearsLinkageAmount', 'prepaymentCommissionTotalAmount',
  'paymentWithoutArrears', 'paymentAmount', 'nextPaymentAmount',
  'principalBalanceAmount', 'principalLinkageAmount', 'amountAndLinkageOfPrincipal', 'interestLinkageAmount',
  'interestAndLinkageTotalAmount', 'deferredInterestAmount', 'deferredInterestLinkageAmount', 'amountAndLinkageOfInterestDeferred',
  'linkageBaseDescription', 'timeUnitDescription', 'differentDateIndication', 'eventId', 'recordNumber', 'tableNumber',
  'startDate', 'endDate', 'calculatedEndDate', 'validityDate', 'formattedValidityDate', 'lastEventDate', 'formattedLastEventDate',
  'savingPeriod', 'actualDepositingTotalNumber', 'depositingMethodCode', 'interestPaymentMethodCode', 'interestPaymentMethodDescription',
  'interestCalculatingMethodDescription', 'additionEnablingIndication', 'renewalCounter', 'requestedRenewalNumber',
  'shortProductName', 'shortSavingDepositName', 'creditTypeDescription', 'interestTypeDescription', 'linkageTypeDescription', 'linkageTypeCode',
  'revaluationCurrencyCode', 'displayedRevaluationCurrencyCode', 'totalRevaluatedCurrentBalance', 'revaluatedCurrentBalance', 'lastBalance',
  'errCode', 'errorCode', 'status'
])

function sanitizeFinancialBody (value, parentKey = null) {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(item => sanitizeFinancialBody(item, parentKey))
  if (!value || typeof value !== 'object') return sanitize(value, true)
  return Object.fromEntries(Object.entries(value).map(([key, field]) => {
    if (key === 'commentExistenceSwitch' && (field === 0 || field === 1)) return [key, field]
    if (key === 'code') {
      const isSelectorCode = ['currencyCode', 'detailedAccountTypeCode'].includes(parentKey) && Number.isFinite(field)
      return [key, isSelectorCode || field === 'STEPUPOTP' ? field : sanitize(field, true)]
    }
    // A whitelisted child name must never unmask an auth/personal subtree.
    const privateField = /auth|token|cookie|password|otp|credential|secret|signature|session|jwt|sms|verification|challenge|mfa|twoFactor|passport|phone|email|address|avatar|photo|customer|owner|beneficiary|comment|productLabel|accountName|(?:^|_)pin(?:$|_)/i.test(key)
    return [key, privateField
      ? sanitize(field, true)
      : FINANCIAL_LOG_FIELDS.has(key) && (field === null || ['string', 'number', 'boolean'].includes(typeof field))
        ? field
        : field && typeof field === 'object' ? sanitizeFinancialBody(field, key) : sanitize(field, true)]
  }))
}

function getCookieHeaderNames (cookieHeader) {
  return String(cookieHeader || '')
    .split(';')
    .map(cookie => cookie.split('=')[0].trim())
    .filter(Boolean)
    .sort()
}

function hasLikelyOfficialAuthCookie (cookieHeader) {
  const cookies = parseCookieHeader(cookieHeader)
  return Boolean(cookies.SMSESSION || cookies['XSRF-TOKEN'] || cookies.TS)
}

function hasOfficialSessionCookie (cookieHeader) {
  return Boolean(parseCookieHeader(cookieHeader).SMSESSION)
}

function isOfficialCookieStoreEntry (cookie) {
  if (typeof cookie?.name !== 'string' || cookie.name === '') {
    return false
  }
  if (typeof cookie?.value !== 'string' || cookie.value === '') {
    return false
  }
  if (isOfficialCookieDomain(cookie?.domain)) {
    return true
  }
  return (cookie?.domain == null || cookie.domain === '') && OFFICIAL_AUTH_COOKIE_NAMES.has(cookie.name)
}

function getCookieDomainPriority (domain) {
  if (typeof domain !== 'string' || domain === '') {
    return 0
  }
  const normalizedDomain = domain.toLowerCase()
  if (normalizedDomain === 'login.bankhapoalim.co.il') {
    return 5
  }
  if (normalizedDomain === '.login.bankhapoalim.co.il') {
    return 4
  }
  if (normalizedDomain === 'bankhapoalim.co.il') {
    return 3
  }
  if (normalizedDomain === '.bankhapoalim.co.il') {
    return 2
  }
  return normalizedDomain.endsWith('.bankhapoalim.co.il') ? 1 : 0
}

function compareCookieStoreEntries (leftCookie, rightCookie) {
  const domainPriorityDiff = getCookieDomainPriority(rightCookie?.domain) - getCookieDomainPriority(leftCookie?.domain)
  if (domainPriorityDiff !== 0) {
    return domainPriorityDiff
  }

  const leftPathLength = typeof leftCookie?.path === 'string' ? leftCookie.path.length : 0
  const rightPathLength = typeof rightCookie?.path === 'string' ? rightCookie.path.length : 0
  const pathPriorityDiff = rightPathLength - leftPathLength
  if (pathPriorityDiff !== 0) {
    return pathPriorityDiff
  }

  return String(leftCookie?.name || '').localeCompare(String(rightCookie?.name || ''))
}

function buildCookieHeaderFromCookieStore (cookies, requestUrl = null) {
  if (!Array.isArray(cookies)) {
    return ''
  }

  const selectedCookiesByName = (cookies || [])
    .filter(isOfficialCookieStoreEntry)
    .filter(cookie => {
      if (!requestUrl) {
        return true
      }
      const expiresAt = cookie.expires == null ? null : new Date(cookie.expires).getTime()
      if (expiresAt != null && (!Number.isFinite(expiresAt) || expiresAt <= Date.now())) {
        return false
      }
      const url = new URL(requestUrl)
      const domain = String(cookie.domain || '').replace(/^\./, '').toLowerCase()
      const path = typeof cookie.path === 'string' && cookie.path.startsWith('/') ? cookie.path : '/'
      return (domain === '' || url.hostname === domain || url.hostname.endsWith(`.${domain}`)) &&
        (url.pathname === path || url.pathname.startsWith(path.endsWith('/') ? path : `${path}/`))
    })
    .sort(compareCookieStoreEntries)
    .reduce((result, cookie) => {
      if (!result.has(cookie.name)) {
        result.set(cookie.name, cookie.value)
      }
      return result
    }, new Map())

  return [...selectedCookiesByName.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

function isOfficialUrl (url) {
  try {
    return new URL(url).origin === OFFICIAL_BASE_URL
  } catch (error) {
    return false
  }
}

function normalizeRestContext (value) {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.replace(/^\/+|\/+$/g, '')
  if (normalizedValue === '' || EXCLUDED_REST_CONTEXTS.has(normalizedValue)) {
    return null
  }

  return normalizedValue
}

function extractRestContextFromUrl (url) {
  if (typeof url !== 'string') {
    return null
  }

  for (const pattern of REST_CONTEXT_URL_PATTERNS) {
    const match = url.match(pattern)
    const restContext = normalizeRestContext(match?.[1])
    if (restContext) {
      return restContext
    }
  }

  return null
}

function extractRestContextFromText (text) {
  if (typeof text !== 'string' || text === '') {
    return null
  }

  for (const pattern of REST_CONTEXT_TEXT_PATTERNS) {
    const match = text.match(pattern)
    const restContext = normalizeRestContext(match?.[1])
    if (restContext) {
      return restContext
    }
  }

  return null
}

function updateAuthFromResponse (auth, response) {
  const nextAuth = { ...auth }
  const setCookieHeader = getHeaderValue(response?.headers, 'set-cookie') || getHeaderValue(response?.headers, 'Set-Cookie')
  if (setCookieHeader) {
    nextAuth.cookieHeader = mergeSetCookieHeaders(nextAuth.cookieHeader, setCookieHeader)
    const hasXsrfUpdate = setCookie.parse(setCookie.splitCookiesString(setCookieHeader), { decodeValues: false })
      .some(cookie => cookie.name === 'XSRF-TOKEN')
    nextAuth.xsrfToken = hasXsrfUpdate
      ? getCookieValue(nextAuth.cookieHeader, 'XSRF-TOKEN')
      : getCookieValue(nextAuth.cookieHeader, 'XSRF-TOKEN') || nextAuth.xsrfToken
  }

  nextAuth.restContext = nextAuth.restContext || extractRestContextFromUrl(response?.url)
  return nextAuth
}

function summarizeAuthSnapshot (auth) {
  return {
    cookieNames: getCookieHeaderNames(auth?.cookieHeader),
    hasXsrfToken: Boolean(auth?.xsrfToken),
    hasSessionCookie: hasOfficialSessionCookie(auth?.cookieHeader),
    restContext: auth?.restContext || null
  }
}

async function applyAuthUpdate (targetAuth, nextAuth) {
  const changed = targetAuth.cookieHeader !== nextAuth.cookieHeader ||
    targetAuth.xsrfToken !== nextAuth.xsrfToken || targetAuth.restContext !== nextAuth.restContext
  targetAuth.cookieHeader = nextAuth.cookieHeader
  targetAuth.xsrfToken = nextAuth.xsrfToken
  targetAuth.restContext = nextAuth.restContext
  targetAuth.acquiredAt = nextAuth.acquiredAt
  if (changed && authUpdateCallbacks.has(targetAuth)) {
    await authUpdateCallbacks.get(targetAuth)({ ...targetAuth })
  }
}

export async function withAuthUpdates (auth, onAuthUpdate, operation) {
  authUpdateCallbacks.set(auth, onAuthUpdate)
  try {
    return await operation(auth)
  } finally {
    authUpdateCallbacks.delete(auth)
  }
}

function restoreAuth (rawAuth) {
  if (!rawAuth || typeof rawAuth !== 'object') {
    return null
  }

  const auth = createEmptyAuth()
  auth.cookieHeader = typeof rawAuth.cookieHeader === 'string' ? rawAuth.cookieHeader : ''
  auth.xsrfToken = typeof rawAuth.xsrfToken === 'string' && rawAuth.xsrfToken !== ''
    ? rawAuth.xsrfToken
    : getCookieValue(auth.cookieHeader, 'XSRF-TOKEN')
  auth.restContext = normalizeRestContext(rawAuth.restContext)
  auth.acquiredAt = typeof rawAuth.acquiredAt === 'number' ? rawAuth.acquiredAt : Date.now()

  return auth.cookieHeader !== '' ? auth : null
}

export function normalizeStoredAuth (rawAuth) {
  return restoreAuth(rawAuth)
}

function isOfficialLoginUrl (rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl === '') {
    return false
  }
  try {
    const url = new URL(rawUrl, OFFICIAL_BASE_URL)
    return url.origin === OFFICIAL_BASE_URL &&
      (/^\/(?:ng-portals|ng-portals-bt|ng--portals)\/auth(?:\/|$)/i.test(url.pathname) ||
        (url.pathname === '/cgi-bin/poalwwwc' && url.searchParams.get('reqName') === 'getLogonPage'))
  } catch (error) {
    return false
  }
}

function isOfficialLoginPageResponse (response) {
  return isOfficialLoginUrl(response?.url) ||
    (response?.status >= 300 && response?.status < 400 && isOfficialLoginUrl(getHeaderValue(response.headers, 'location')))
}

export function isLikelyAuthGateError (error) {
  const response = error?.responseSummary || error?.response
  const code = response?.errCode || response?.body?.error?.errCode
  // STEPUPOTP was observed in the official Hapoalim flow; generic statuses are not proof.
  return (response?.status === 401 && code === 'STEPUPOTP') ||
    (response?.status >= 200 && response?.status < 500 &&
      (response?.isLoginPage === true || isOfficialLoginPageResponse(response)))
}

export function isSessionDeadlineError (error) {
  return sessionDeadlineErrors.has(error)
}

export async function withSessionDeadline (operation, label) {
  let timeoutId
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          const error = new Error(`Bank Hapoalim ${label} timed out`)
          sessionDeadlineErrors.add(error)
          reject(error)
        }, SESSION_OPERATION_TIMEOUT_MS)
      })
    ])
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function recoverAuthFromCookieStore (storedAuth, { onAuthUpdate = async () => {}, verify } = {}) {
  const snapshot = await withSessionDeadline(() => cookieJar.serialize(), 'cookie store read')
  ensure(Array.isArray(snapshot?.cookies), 'unexpected cookie store snapshot')
  const cookies = snapshot.cookies.map(({ key, ...cookie }) => ({ ...cookie, name: key }))
  const auth = createEmptyAuth()
  auth.cookieHeader = buildCookieHeaderFromCookieStore(cookies, `${OFFICIAL_BASE_URL}/ServerServices/general/accounts`)
  if (!hasLikelyOfficialAuthCookie(auth.cookieHeader)) {
    console.log('Bank Hapoalim silent recovery: no usable auth cookies')
    return null
  }
  auth.xsrfToken = getCookieValue(auth.cookieHeader, 'XSRF-TOKEN')

  const previousAuth = normalizeStoredAuth(storedAuth)
  if (!auth.xsrfToken && previousAuth?.xsrfToken) {
    const session = getCookieValue(auth.cookieHeader, 'SMSESSION')
    const hasJarXsrfRecord = cookies.some(cookie => cookie?.name === 'XSRF-TOKEN' &&
      (!cookie.domain || isOfficialCookieDomain(cookie.domain)))
    if (hasJarXsrfRecord || !session || session !== getCookieValue(previousAuth.cookieHeader, 'SMSESSION')) {
      console.log('Bank Hapoalim silent recovery: no safely reusable XSRF token')
      return null
    }
    // Reuse only the token from the same session, never mix identities or stale cookies.
    const xsrfCookie = parseCookieHeader(previousAuth.cookieHeader)['XSRF-TOKEN']
    if (xsrfCookie) {
      auth.cookieHeader = mergeCookieHeaders(auth.cookieHeader, `XSRF-TOKEN=${xsrfCookie}`)
    }
    auth.xsrfToken = previousAuth.xsrfToken
  }

  try {
    await withSessionDeadline(
      () => fetchOfficialAccounts(auth, { log: false }),
      'silent accounts verification'
    )
    if (verify) await withSessionDeadline(() => verify(auth), 'silent challenged request verification')
  } catch (error) {
    if (!isLikelyAuthGateError(error)) {
      throw error
    }
    console.log('Bank Hapoalim silent recovery: bank rejected stored cookies')
    return null
  }

  await onAuthUpdate({ ...auth })
  let active = true
  const contextAuth = { ...auth }
  try {
    await withSessionDeadline(() => withAuthUpdates(contextAuth, async updated => {
      if (active) await onAuthUpdate(updated)
    }, auth => ensureRestContext(auth, { isActive: () => active })), 'silent portal context discovery')
    await applyAuthUpdate(auth, contextAuth)
  } finally {
    active = false
  }
  auth.restContext = auth.restContext || normalizeRestContext(storedAuth?.restContext)
  await onAuthUpdate({ ...auth })
  console.log('Bank Hapoalim silent recovery: accounts access verified', summarizeAuthSnapshot(auth))
  return auth
}

async function fetchOfficialAccounts (auth, options) {
  try {
    const response = await fetchOfficialJson('/ServerServices/general/accounts?lang=he', auth, options)
    ensure(response.status === 200 && Array.isArray(response.body), 'unexpected accounts response', response)
    return response
  } catch (error) {
    if (error && typeof error === 'object') {
      error.isAccountsResponse = true
    }
    throw error
  }
}

function createRequestUuid () {
  const a = generateRandomString(8, '0123456789abcdef')
  const b = generateRandomString(4, '0123456789abcdef')
  const c = generateRandomString(3, '0123456789abcdef')
  const d = generateRandomString(3, '89ab')
  const e = generateRandomString(3, '0123456789abcdef')
  const f = generateRandomString(12, '0123456789abcdef')
  return `${a}-${b}-4${c}-${d}${e}-${f}`
}

function buildOfficialHeaders (auth, headers, { includeXsrf = false } = {}) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json;charset=UTF-8',
    Cookie: auth.cookieHeader,
    ...includeXsrf && auth.xsrfToken ? { 'X-XSRF-TOKEN': auth.xsrfToken } : {},
    ...headers
  }
}

async function fetchOfficialJson (path, auth, options = {}) {
  // Replay only this read request, not a full transaction import or a guessed OTP API.
  const verify = candidate => fetchOfficialJson(path, candidate, {
    ...options,
    log: false,
    headers: { ...options.headers, ...options.headers?.uuid ? { uuid: createRequestUuid() } : {} }
  })
  const {
    headers,
    includeXsrf = false,
    sanitizeRequestLog,
    sanitizeResponseLog,
    ...rest
  } = options

  let response
  try {
    response = await withSessionDeadline(() => fetchJson(OFFICIAL_BASE_URL + path, {
      method: 'GET',
      ...rest,
      headers: buildOfficialHeaders(auth, headers, { includeXsrf }),
      sanitizeRequestLog: {
        ...sanitizeRequestLog,
        url: sanitizeOfficialUrlForLog,
        headers: {
          Cookie: true,
          cookie: true,
          Authorization: true,
          'X-XSRF-TOKEN': true,
          ...sanitizeRequestLog?.headers
        }
      },
      sanitizeResponseLog: {
        ...sanitizeResponseLog,
        body: sanitizeFinancialBody,
        url: sanitizeOfficialUrlForLog,
        headers: {
          'set-cookie': true,
          Authorization: true,
          'X-XSRF-TOKEN': true,
          location: true,
          ...sanitizeResponseLog?.headers
        }
      }
    }), 'HTTP request')
  } catch (error) {
    if (error instanceof ParseError) {
      // JSON.parse messages can contain a prefix of authenticated HTML.
      throwResponseError('Bank Hapoalim returned an unexpected response instead of JSON.', error.response, verify)
    }
    throw error
  }

  ensure(response.status >= 200 && response.status < 300 && !isOfficialLoginPageResponse(response), 'unexpected HTTP response', response, verify)
  await applyAuthUpdate(auth, updateAuthFromResponse(auth, response))
  return response
}

async function fetchOfficialText (path, auth) {
  const response = await withSessionDeadline(() => fetch(OFFICIAL_BASE_URL + path, {
    method: 'GET',
    log: false,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Cookie: auth.cookieHeader
    },
    sanitizeRequestLog: {
      headers: {
        Cookie: true,
        cookie: true
      }
    },
    sanitizeResponseLog: {
      headers: {
        'set-cookie': true
      }
    }
  }), 'HTTP request')

  ensure((response.status === 404 || (response.status >= 200 && response.status < 300)) && !isOfficialLoginPageResponse(response), 'unexpected portal response', response,
    candidate => fetchOfficialText(path, candidate))
  await applyAuthUpdate(auth, updateAuthFromResponse(auth, response))
  return response
}

async function ensureRestContext (auth, { isActive = () => true } = {}) {
  if (auth.restContext) {
    return auth.restContext
  }
  if (missingRestContexts.get(auth) === auth.cookieHeader) return null

  for (const path of PORTAL_PAGE_PATHS) {
    if (!isActive()) {
      return null
    }
    const response = await fetchOfficialText(path, auth)
    if (!isActive()) {
      return null
    }
    if (response.status === 404) continue
    const restContext = extractRestContextFromText(response.body)
    if (restContext) {
      await applyAuthUpdate(auth, { ...auth, restContext })
      return restContext
    }
  }

  if (isActive()) missingRestContexts.set(auth, auth.cookieHeader)
  return null
}

function getCurrentAccountBasePath (auth) {
  return auth.restContext
    ? `/${auth.restContext}/current-account`
    : '/ServerServices/current-account'
}

function authSessionIdentity (cookieHeader) {
  return ['SMSESSION', 'XSRF-TOKEN'].map(name => getCookieValue(cookieHeader, name) || '').join('\n')
}

export async function login ({
  isInBackground = false,
  allowInteraction = true,
  skipHidden = false,
  verify,
  interactionError,
  onAuthUpdate = async () => {},
  onInteraction = () => {}
} = {}) {
  const webView = new WebView()
  const diagnostics = { stage: 'created', lastUrl: null, cookieNames: [], probeCount: 0 }
  let failure
  let failed = false
  let result
  let stoppedError
  let rejectStopped
  let deadlineId
  let listenerAttached = false
  let probeInFlight = false
  let verifiedAuth = null
  let closedError = null
  let resolveClosed
  let loggedStepUp = false
  const closed = new Promise(resolve => { resolveClosed = resolve })
  const stopped = new Promise((resolve, reject) => { rejectStopped = reject })
  stopped.catch(() => {})

  function stop (error) {
    if (!stoppedError) {
      stoppedError = error
      rejectStopped(error)
    }
  }

  function onClose () {
    if (closedError) return
    // The native event has no reason: renderer failures must retain Send log.
    closedError = new Error('Bank Hapoalim WebView closed before authentication completed')
    resolveClosed(null)
    if (!probeInFlight && !verifiedAuth) stop(closedError)
  }

  async function run (operation, label, timeout = SESSION_OPERATION_TIMEOUT_MS, allowClosed = false) {
    if (stoppedError) throw stoppedError
    let timeoutId
    try {
      return await Promise.race([
        Promise.resolve().then(() => {
          if (stoppedError) throw stoppedError
          return operation()
        }),
        stopped,
        ...allowClosed ? [closed] : [],
        new Promise((resolve, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Bank Hapoalim ' + label + ' timed out')), timeout)
        })
      ])
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async function readCookies (allowClosed = false) {
    diagnostics.stage = 'reading WebView cookies'
    const header = await run(
      () => webView.cookieJar.getCookieString(OFFICIAL_BASE_URL + '/ServerServices/general/accounts?lang=he'),
      'WebView cookie read', SESSION_OPERATION_TIMEOUT_MS, allowClosed
    )
    if (allowClosed && closedError) return null
    ensure(typeof header === 'string', 'unexpected WebView cookie header')
    diagnostics.cookieNames = getCookieHeaderNames(header)
    return header
  }

  async function probe (cookieHeader) {
    if (!hasLikelyOfficialAuthCookie(cookieHeader)) return { auth: null, retryCookies: null }
    const candidate = createEmptyAuth()
    // WebView and HTTP cookies are separate: pass this scoped native snapshot explicitly.
    candidate.cookieHeader = cookieHeader
    candidate.xsrfToken = getCookieValue(cookieHeader, 'XSRF-TOKEN')
    diagnostics.stage = 'verifying accounts'
    diagnostics.probeCount++
    try {
      probeInFlight = true
      await run(() => fetchOfficialAccounts(candidate, { log: false }), 'WebView accounts verification')
      if (verify) {
        diagnostics.stage = 'verifying challenged request'
        await run(() => verify(candidate), 'WebView challenged request verification')
      }
    } catch (error) {
      if (!isLikelyAuthGateError(error)) throw error
      if (closedError) throw closedError
      if (verify && !loggedStepUp) {
        console.log('Bank Hapoalim step-up: waiting for bank confirmation')
        loggedStepUp = true
      }
      return { auth: null, retryCookies: null }
    } finally {
      probeInFlight = false
    }
    verifiedAuth = candidate
    if (closedError) {
      return { auth: candidate, retryCookies: null }
    }
    const latestCookies = await readCookies(true)
    if (closedError) return { auth: candidate, retryCookies: null }
    if (authSessionIdentity(latestCookies) !== authSessionIdentity(cookieHeader) &&
      authSessionIdentity(latestCookies) !== authSessionIdentity(candidate.cookieHeader)) {
      console.log('Bank Hapoalim WebView session changed during accounts verification')
      verifiedAuth = null
      return { auth: null, retryCookies: latestCookies }
    }
    return { auth: candidate, retryCookies: null }
  }

  async function complete (auth) {
    diagnostics.stage = 'persisting verified auth'
    await run(() => onAuthUpdate({ ...auth }), 'verified auth persistence')
    const contextAuth = { ...auth }
    let contextActive = true
    try {
      diagnostics.stage = 'discovering portal context'
      await run(() => withAuthUpdates(contextAuth, async updated => {
        if (contextActive) await run(() => onAuthUpdate(updated), 'verified auth persistence')
      }, auth => ensureRestContext(auth, { isActive: () => contextActive })), 'WebView portal context discovery')
    } finally {
      contextActive = false
    }
    await applyAuthUpdate(auth, contextAuth)
    await run(() => onAuthUpdate({ ...auth }), 'verified auth persistence')
    return auth
  }

  async function closeOwnedView () {
    if (closedError) return
    try {
      await withSessionDeadline(() => webView.close(), 'WebView close')
    } catch (error) {
      // A new policy can race cleanup. Do not retry a still-running timed-out close.
      if (isSessionDeadlineError(error)) throw error
      await new Promise(resolve => setTimeout(resolve, 0))
      let retryStage = 'reading closed state'
      try {
        const isClosed = await withSessionDeadline(() => webView.isClosed(), 'WebView closed state')
        ensure(typeof isClosed === 'boolean', 'unexpected WebView closed state')
        if (isClosed) return
        retryStage = 'retrying close'
        await withSessionDeadline(() => webView.close(), 'WebView close')
      } catch (retryError) {
        console.warn('Bank Hapoalim WebView close retry failed', {
          stage: retryStage,
          errorType: retryError?.name || 'Error',
          timedOut: isSessionDeadlineError(retryError)
        })
        throw error
      }
    }
  }

  async function authorize () {
    webView.on('close', onClose)
    listenerAttached = true
    deadlineId = setTimeout(() => stop(new Error('Bank Hapoalim WebView login timed out')), COOKIE_STORE_POLL_TIMEOUT_MS)
    webView.navigationPolicy = WebView.createNavigationPolicy(navigation => {
      diagnostics.lastUrl = sanitizeOfficialUrlForLog(navigation.url)
      // Native policy must settle before presentation, cookie writes, navigation or closing.
      return WebView.NavigationAction.LOAD
    }, { sanitizeRequestLog: { url: sanitizeOfficialUrlForLog, headers: true } })

    const initialCookies = await readCookies()
    let hiddenCookies = initialCookies
    if (!skipHidden && hasOfficialSessionCookie(hiddenCookies)) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const recovered = await probe(hiddenCookies)
        if (recovered.auth) {
          console.log('Bank Hapoalim hidden WebView session verified')
          return await complete(recovered.auth)
        }
        if (!recovered.retryCookies) break
        hiddenCookies = recovered.retryCookies
        if (attempt === 2) throw new Error('Bank Hapoalim WebView session kept changing during verification')
      }
    }
    if (isInBackground) throw new UserInteractionError()
    if (!allowInteraction) throw interactionError || new Error('Bank Hapoalim session was rejected after interactive login')

    onInteraction()
    diagnostics.stage = 'showing bank login'
    await run(() => webView.show(), 'WebView presentation')
    diagnostics.stage = 'loading bank login'
    await run(() => webView.goto(WEB_LOGIN_URL, { waitUntil: 'commit', timeout: 30000 }), 'WebView navigation', 30000)

    let lastProbeIdentity = null
    let nextProbeAt = 0
    let retryDelay = COOKIE_STORE_POLL_INTERVAL_MS
    while (true) {
      const cookieHeader = await readCookies()
      const pageUrl = await run(() => webView.url(), 'WebView URL read')
      diagnostics.lastUrl = sanitizeOfficialUrlForLog(pageUrl)
      const isPortal = isOfficialUrl(pageUrl) && WEB_SUCCESS_PATTERNS.some(pattern => pattern.test(pageUrl))
      const sessionIdentity = authSessionIdentity(cookieHeader)
      const probeIdentity = `${pageUrl}\n${sessionIdentity}`
      const changedIdentity = probeIdentity !== lastProbeIdentity
      // OTP can change server-side permissions without changing any cookie.
      if (isPortal && (changedIdentity || Date.now() >= nextProbeAt)) {
        if (changedIdentity) retryDelay = COOKIE_STORE_POLL_INTERVAL_MS
        lastProbeIdentity = probeIdentity
        const verified = await probe(cookieHeader)
        if (verified.auth) return await complete(verified.auth)
        nextProbeAt = Date.now() + retryDelay
        retryDelay = Math.min(retryDelay * 2, 30000)
      }
      diagnostics.stage = 'waiting for bank login'
      let pollId
      try {
        await run(() => new Promise(resolve => { pollId = setTimeout(resolve, COOKIE_STORE_POLL_INTERVAL_MS) }), 'WebView login poll')
      } finally {
        clearTimeout(pollId)
      }
    }
  }

  try {
    result = await authorize()
  } catch (error) {
    failure = error
    failed = true
    console.warn('Bank Hapoalim WebView authentication failed', { ...diagnostics, errorType: error?.name || 'Error' })
  } finally {
    clearTimeout(deadlineId)
    try {
      if (listenerAttached) webView.off('close', onClose)
    } catch (error) {
      if (!failed) {
        failure = error
        failed = true
      }
    }
    // Defer cleanup until the current native navigation-policy decision has returned.
    await new Promise(resolve => setTimeout(resolve, 0))
    try {
      await closeOwnedView()
    } catch (error) {
      console.warn('Bank Hapoalim WebView cleanup failed', { errorType: error?.name || 'Error' })
      if (!failed) {
        failure = error
        failed = true
      }
    }
  }
  if (failed) throw failure
  return result
}

async function fetchMainAccountDetails (auth, mainAccount, accountId) {
  await ensureRestContext(auth)
  const currentAccountBasePath = getCurrentAccountBasePath(auth)
  const response = await fetchOfficialJson(
    `${currentAccountBasePath}/composite/balanceAndCreditLimit?${qs.stringify({ accountId, view: 'details', lang: 'he' })}`,
    auth
  )

  ensure(response.body && typeof response.body === 'object' && !Array.isArray(response.body), 'unexpected balance response', response)
  mainAccount.details = {
    ...response.body,
    currentAccountCreditFrame: response.body?.currentAccountCreditFrame ?? null
  }
  mainAccount.structType = 'checking'
  return [mainAccount]
}

async function fetchForeignCurrencyAccount (auth, accountId) {
  const response = await fetchOfficialJson(`/ServerServices/foreign-currency/transactions?${qs.stringify({
    type: 'business',
    accountId
  })}`, auth)

  const account = response.body
  if (account === null) {
    return []
  }
  ensure(Array.isArray(account?.balancesAndLimitsDataList), 'unexpected foreign currency accounts response', response)
  account.mainProductId = accountId
  account.sourceAccountId = accountId
  account.structType = 'foreignCurrencyAccount'
  return [account]
}

async function fetchDeposits (auth, url, structType, accountId) {
  const separator = url.includes('?') ? '&' : '?'
  const response = await fetchOfficialJson(`${url}${separator}${qs.stringify({ accountId })}`, auth)
  ensure(Array.isArray(response.body?.list), 'unexpected deposits response', response)
  const accounts = []
  for (const group of response.body.list) {
    ensure(Array.isArray(group?.data), 'unexpected deposit group', response)
    for (const account of group.data) {
      ensure(account && typeof account === 'object' && !Array.isArray(account), 'unexpected deposit account', response)
      accounts.push({ ...account, structType, sourceAccountId: accountId })
    }
  }
  return accounts
}

async function fetchLoans (auth, accountId) {
  const response = await fetchOfficialJson(`/ServerServices/credit-and-mortgage/v3/loans?${qs.stringify({ accountId })}`, auth)
  ensure(Array.isArray(response.body?.data), 'unexpected loans response', response)
  const accounts = []
  for (const account of response.body.data) {
    ensure(account && typeof account === 'object' && !Array.isArray(account), 'unexpected loan account', response)
    ensure(Number.isSafeInteger(account?.creditSerialNumber) && account.creditSerialNumber > 0 &&
      Number.isSafeInteger(account?.unitedCreditTypeCode) && account.unitedCreditTypeCode > 0,
    'unexpected loan identity', response)
    const query = qs.stringify({ unitedCreditTypeCode: account.unitedCreditTypeCode, accountId })
    const detailsResponse = await fetchOfficialJson(`/ServerServices/credit-and-mortgage/v3/loans/${account.creditSerialNumber}?${query}`, auth)
    ensure(detailsResponse.body && typeof detailsResponse.body === 'object' && !Array.isArray(detailsResponse.body), 'unexpected loan details', detailsResponse)

    account.details = detailsResponse.body
    account.structType = 'loan'
    account.sourceAccountId = accountId
    accounts.push(account)
  }
  return accounts
}

async function fetchMortgages (auth, accountId) {
  const response = await fetchOfficialJson(`/ServerServices/credit-and-mortgage/mortgages?${qs.stringify({ accountId })}`, auth)
  ensure(Array.isArray(response.body?.data), 'unexpected mortgages response', response)
  return response.body.data.map(account => {
    ensure(account && typeof account === 'object' && !Array.isArray(account), 'unexpected mortgage account', response)
    account.structType = 'mortgage'
    account.sourceAccountId = accountId
    return account
  })
}

export async function fetchAccounts (auth) {
  const response = await fetchOfficialAccounts(auth)
  ensure(response.body.length > 0, 'unexpected empty accounts inventory', response)

  const accounts = []
  // Requests share rotating authentication; finish each before starting the next.
  for (const mainAccount of response.body) {
    ensure(mainAccount && typeof mainAccount === 'object' && !Array.isArray(mainAccount), 'unexpected account record', { body: mainAccount })
    ensure(mainAccount.accountNumber && mainAccount.branchNumber && mainAccount.bankNumber, 'unexpected account', { body: mainAccount })
    const accountId = `${mainAccount.bankNumber}-${mainAccount.branchNumber}-${mainAccount.accountNumber}`
    const loaders = [
      async () => await fetchMainAccountDetails(auth, mainAccount, accountId),
      async () => await safeFetch('foreign currency', async () => fetchForeignCurrencyAccount(auth, accountId)),
      async () => await safeFetch('deposits', async () => fetchDeposits(auth, '/ServerServices/deposits-and-savings/deposits?view=details&lang=he', 'deposit', accountId)),
      async () => await safeFetch('savings', async () => fetchDeposits(auth, '/ServerServices/deposits-and-savings/savingsDeposits?view=details&lang=he', 'saving', accountId)),
      async () => await safeFetch('loans', async () => fetchLoans(auth, accountId)),
      async () => await safeFetch('mortgages', async () => fetchMortgages(auth, accountId))
    ]
    for (const load of loaders) accounts.push(...await load())
  }
  return accounts
}

function areSameCalendarDay (leftDate, rightDate) {
  return leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
}

function startOfDay (date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays (date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getMidpointDay (fromDate, toDate) {
  return startOfDay(new Date(Math.floor((startOfDay(fromDate).getTime() + startOfDay(toDate).getTime()) / 2)))
}

async function fetchOfficialCurrentAccountTransactionsWindow (auth, product, fromDate, toDate) {
  await ensureRestContext(auth)

  const fromDateStr = toISODateString(fromDate).replace(/-/g, '')
  const toDateStr = toISODateString(toDate).replace(/-/g, '')
  const currentAccountBasePath = getCurrentAccountBasePath(auth)
  const query = qs.stringify({
    accountId: product.id,
    numItemsPerPage: OFFICIAL_TRANSACTION_LIMIT,
    sortCode: '1',
    retrievalStartDate: fromDateStr,
    retrievalEndDate: toDateStr
  })

  const response = await fetchOfficialJson(
    `${currentAccountBasePath}/transactions?${query}`,
    auth,
    {
      method: 'POST',
      body: [],
      includeXsrf: true,
      headers: {
        pageUuid: OFFICIAL_TRANSACTION_PAGE_UUID,
        uuid: createRequestUuid()
      }
    }
  )

  const batch = response.status === 204 ? [] : response.body?.transactions
  ensure(Array.isArray(batch), 'unexpected transactions response', response)
  return batch
}

async function fetchOfficialForeignCurrencyTransactionsWindow (auth, product, fromDate, toDate) {
  const fromDateStr = toISODateString(fromDate).replace(/-/g, '')
  const toDateStr = toISODateString(toDate).replace(/-/g, '')
  const response = await fetchOfficialJson('/ServerServices/foreign-currency/transactions?type=business&view=details&' +
    `retrievalStartDate=${fromDateStr}&retrievalEndDate=${toDateStr}&` +
    `currencyCodeList=${product.currencyCode}&detailedAccountTypeCodeList=${product.detailedAccountTypeCode}&accountId=${product.id}`, auth)
  const balances = response.body?.balancesAndLimitsDataList
  ensure(Array.isArray(balances), 'unexpected foreign currency history response', response)
  const matches = balances.filter(balance => balance?.currencyCode === product.currencyCode && balance?.detailedAccountTypeCode === product.detailedAccountTypeCode)
  ensure(matches.length === 1, 'unexpected foreign currency history source', response)
  const batch = matches[0].transactions
  ensure(Array.isArray(batch), 'unexpected foreign currency transactions response', response)
  return batch
}

async function fetchOfficialTransactionsInterval (auth, product, fromDate, toDate) {
  const fetchWindow = product.type === 'foreignCurrencyAccount' ? fetchOfficialForeignCurrencyTransactionsWindow : fetchOfficialCurrentAccountTransactionsWindow
  const batch = await fetchWindow(auth, product, fromDate, toDate)

  if (batch.length < OFFICIAL_TRANSACTION_LIMIT) {
    return batch
  }
  ensure(!areSameCalendarDay(fromDate, toDate), 'Bank Hapoalim history limit reached for one day; complete history cannot be verified')
  const midpointDay = getMidpointDay(fromDate, toDate)
  ensure(midpointDay.getTime() >= startOfDay(fromDate).getTime() && midpointDay.getTime() < startOfDay(toDate).getTime(),
    'Bank Hapoalim history interval cannot be split completely')

  const leftTransactions = await fetchOfficialTransactionsInterval(auth, product, fromDate, midpointDay)
  const rightFromDate = addDays(midpointDay, 1)
  const rightTransactions = rightFromDate.getTime() <= startOfDay(toDate).getTime()
    ? await fetchOfficialTransactionsInterval(auth, product, rightFromDate, toDate)
    : []

  // Windows cover disjoint calendar days. Equal-looking rows are not proven duplicates.
  return [...leftTransactions, ...rightTransactions]
}

export async function fetchTransactions (auth, product, fromDate, toDate) {
  ensure(fromDate instanceof Date && toDate instanceof Date && Number.isFinite(fromDate.getTime()) && Number.isFinite(toDate.getTime()) && fromDate <= toDate,
    'unexpected history interval')
  // Match the legacy formatted-date +02:00 interpretation, not the machine zone.
  // Actual bank DST semantics still require bank evidence before changing dates.
  const requestFromDate = dateInTimezone(fromDate, 120)
  const requestToDate = dateInTimezone(toDate, 120)
  return await fetchOfficialTransactionsInterval(auth, product, requestFromDate, requestToDate)
}
