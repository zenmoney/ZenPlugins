import { flatten } from 'lodash'
import qs from 'querystring'
import * as setCookie from 'set-cookie-parser'
import { TemporaryError } from '../../errors'
import { toISODateString } from '../../common/dateUtils'
import { fetch, fetchJson, openWebViewAndInterceptRequest, ParseError } from '../../common/network'
import { generateRandomString } from '../../common/utils'

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
const WEB_LOGIN_INCOMPLETE_MESSAGE = 'Could not complete Bank Hapoalim web login. Finish the bank login in the opened page and retry sync.'
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
const WEBVIEW_AUTH_PROBE_TIMEOUT_MS = 15000
const SESSION_OPERATION_TIMEOUT_MS = 15000
const sessionDeadlineErrors = new WeakSet()
const COOKIE_STORE_RECOVERY_RETRY_COUNT = 5
const COOKIE_STORE_RECOVERY_RETRY_DELAY_MS = 250
const OFFICIAL_AUTH_COOKIE_NAMES = new Set([
  'SMSESSION',
  'XSRF-TOKEN',
  'TS'
])
const OFFICIAL_COOKIE_PROBE_URLS = [
  WEB_LOGIN_URL,
  `${OFFICIAL_BASE_URL}/ServerServices/general/accounts?lang=he`,
  ...PORTAL_PAGE_PATHS.map(path => `${OFFICIAL_BASE_URL}${path}`)
]

function summarizeResponse (response) {
  return response
    ? {
        status: response.status,
        url: sanitizeOfficialUrlForLog(response.url),
        contentType: getHeaderValue(response.headers, 'content-type'),
        isLoginPage: isOfficialLoginPageResponse(response),
        flow: response.body?.flow,
        state: response.body?.state,
        errCode: response.body?.error?.errCode,
        errDesc: response.body?.error?.errDesc
      }
    : null
}

function throwTemporary (message, response) {
  console.warn(message, summarizeResponse(response))
  const error = new TemporaryError(message)
  error.responseSummary = summarizeResponse(response)
  throw error
}

function ensure (condition, message, response) {
  if (!condition) {
    throwTemporary(message, response)
  }
}

async function safeFetch (label, fn) {
  try {
    return await fn()
  } catch (error) {
    console.warn(`optional account endpoint failed: ${label}`, error?.responseSummary || summarizeResponse(error?.response) || { errorType: error?.name || 'Error' })
    return []
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

  const nextCookies = setCookie.parse(setCookie.splitCookiesString(setCookieHeader))
    .reduce((result, cookie) => {
      if (cookie?.name) {
        result[cookie.name] = cookie.value
      }
      return result
    }, {})

  const mergedCookies = { ...parseCookieHeader(currentCookieHeader), ...nextCookies }
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
    return `${url.origin}${url.pathname}`
  } catch (error) {
    return null
  }
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

function summarizeOfficialCookieStore (cookies) {
  return (Array.isArray(cookies) ? cookies : [])
    .filter(isOfficialCookieStoreEntry)
    .map(cookie => `${cookie.domain || ''}:${cookie.name}`)
    .sort()
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
  return typeof url === 'string' && url.indexOf(OFFICIAL_BASE_URL) === 0
}

function buildWebViewCookieProbeUrls (requestUrl) {
  const probeUrls = []
  if (isOfficialUrl(requestUrl)) {
    probeUrls.push(requestUrl)
  }
  for (const probeUrl of OFFICIAL_COOKIE_PROBE_URLS) {
    if (!probeUrls.includes(probeUrl)) {
      probeUrls.push(probeUrl)
    }
  }
  return probeUrls
}

function hasWebViewCookieJar (webView) {
  return typeof webView?.cookieJar?.getCookieString === 'function'
}

async function buildCookieHeaderFromWebViewCookieJar (webView, requestUrl, { logErrors = true, isActive = () => true } = {}) {
  if (!hasWebViewCookieJar(webView)) {
    return ''
  }

  let cookieHeader = ''
  for (const probeUrl of buildWebViewCookieProbeUrls(requestUrl)) {
    if (!isActive()) {
      return ''
    }
    try {
      cookieHeader = mergeCookieHeaders(cookieHeader, await webView.cookieJar.getCookieString(probeUrl))
    } catch (error) {
      if (logErrors) {
        console.warn('failed to read Bank Hapoalim cookies from WebView cookie jar', {
          url: sanitizeOfficialUrlForLog(probeUrl),
          message: error?.message || error
        })
      }
    }
  }
  return cookieHeader
}

async function updateAuthFromWebViewCookieJar (
  auth,
  webView,
  {
    requestUrl = null,
    requireSessionCookie = false,
    logMissingAuth = true,
    logErrors = true,
    isActive
  } = {}
) {
  const cookieHeader = await buildCookieHeaderFromWebViewCookieJar(webView, requestUrl, { logErrors, isActive })
  if (!cookieHeader) {
    if (logMissingAuth) {
      console.warn('Bank Hapoalim WebView cookie jar has no official cookies')
    }
    return auth
  }

  const cookieNames = getCookieHeaderNames(cookieHeader)
  const hasLikelyAuthCookie = hasLikelyOfficialAuthCookie(cookieHeader)
  if (!hasLikelyAuthCookie) {
    if (logMissingAuth) {
      console.warn('Bank Hapoalim WebView cookie jar has no likely auth cookies', {
        cookieNames
      })
    }
    return auth
  }
  if (requireSessionCookie && !hasOfficialSessionCookie(cookieHeader)) {
    if (logMissingAuth) {
      console.warn('Bank Hapoalim WebView cookie jar has no session cookie', {
        cookieNames
      })
    }
    return auth
  }

  const nextAuth = { ...auth }
  nextAuth.cookieHeader = mergeCookieHeaders(nextAuth.cookieHeader, cookieHeader)
  nextAuth.xsrfToken = getCookieValue(nextAuth.cookieHeader, 'XSRF-TOKEN') || nextAuth.xsrfToken
  nextAuth.restContext = nextAuth.restContext || extractRestContextFromUrl(requestUrl)
  if (nextAuth.cookieHeader !== auth.cookieHeader || nextAuth.xsrfToken !== auth.xsrfToken) {
    console.log('Bank Hapoalim WebView cookie jar auth snapshot', {
      requestUrl: sanitizeOfficialUrlForLog(requestUrl),
      cookieNames,
      hasXsrfToken: Boolean(nextAuth.xsrfToken)
    })
  }
  return nextAuth
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

function updateAuthFromRequest (auth, request) {
  const nextAuth = { ...auth }
  const cookieHeader = getHeaderValue(request?.headers, 'cookie') || getHeaderValue(request?.headers, 'Cookie')
  if (cookieHeader) {
    nextAuth.cookieHeader = mergeCookieHeaders(nextAuth.cookieHeader, cookieHeader)
    nextAuth.xsrfToken = getCookieValue(nextAuth.cookieHeader, 'XSRF-TOKEN') || nextAuth.xsrfToken
  }

  nextAuth.restContext = nextAuth.restContext || extractRestContextFromUrl(request?.url)
  return nextAuth
}

function updateAuthFromResponse (auth, response) {
  const nextAuth = { ...auth }
  const setCookieHeader = getHeaderValue(response?.headers, 'set-cookie') || getHeaderValue(response?.headers, 'Set-Cookie')
  if (setCookieHeader) {
    nextAuth.cookieHeader = mergeSetCookieHeaders(nextAuth.cookieHeader, setCookieHeader)
    nextAuth.xsrfToken = getCookieValue(nextAuth.cookieHeader, 'XSRF-TOKEN') || nextAuth.xsrfToken
  }

  nextAuth.restContext = nextAuth.restContext || extractRestContextFromUrl(response?.url)
  return nextAuth
}

async function updateAuthFromCookieStore (auth, { requireSessionCookie = false, logMissingAuth = true } = {}) {
  if (!ZenMoney?.getCookies) {
    return auth
  }

  try {
    if (ZenMoney?.saveCookies) {
      try {
        await ZenMoney.saveCookies()
      } catch (error) {
        console.warn('failed to flush Bank Hapoalim cookies before reading cookie store', error?.message || error)
      }
    }

    const cookies = await ZenMoney.getCookies()
    const officialCookieStore = summarizeOfficialCookieStore(cookies)
    const cookieHeader = buildCookieHeaderFromCookieStore(cookies)
    if (!cookieHeader) {
      if (logMissingAuth) {
        console.warn('Bank Hapoalim cookie store has no official cookies')
      }
      return auth
    }

    const cookieNames = getCookieHeaderNames(cookieHeader)
    const hasLikelyAuthCookie = hasLikelyOfficialAuthCookie(cookieHeader)
    if (officialCookieStore.length > 0 && (logMissingAuth || hasLikelyAuthCookie)) {
      console.log('Bank Hapoalim cookie store contains official cookies', officialCookieStore)
    }
    if (!hasLikelyAuthCookie) {
      if (logMissingAuth) {
        console.warn('Bank Hapoalim cookie store has no likely auth cookies', {
          cookieNames
        })
      }
      return auth
    }
    if (requireSessionCookie && !hasOfficialSessionCookie(cookieHeader)) {
      if (logMissingAuth) {
        console.warn('Bank Hapoalim cookie store has no session cookie', {
          cookieNames
        })
      }
      return auth
    }

    const nextAuth = { ...auth }
    nextAuth.cookieHeader = mergeCookieHeaders(nextAuth.cookieHeader, cookieHeader)
    nextAuth.xsrfToken = getCookieValue(nextAuth.cookieHeader, 'XSRF-TOKEN') || nextAuth.xsrfToken
    console.log('Bank Hapoalim cookie store auth snapshot', {
      cookieNames,
      hasXsrfToken: Boolean(nextAuth.xsrfToken)
    })
    return nextAuth
  } catch (error) {
    console.warn('failed to read Bank Hapoalim cookies from ZenMoney cookie store', error?.message || error)
    return auth
  }
}

function waitForMs (delayMs) {
  if (!(delayMs > 0) || typeof setTimeout !== 'function') {
    return Promise.resolve()
  }
  return new Promise(resolve => setTimeout(resolve, delayMs))
}

function summarizeAuthSnapshot (auth) {
  return {
    cookieNames: getCookieHeaderNames(auth?.cookieHeader),
    hasXsrfToken: Boolean(auth?.xsrfToken),
    hasSessionCookie: hasOfficialSessionCookie(auth?.cookieHeader),
    restContext: auth?.restContext || null
  }
}

async function recoverVerifiedAuth (
  auth,
  {
    attempts = 1,
    delayMs = 0,
    source = 'current-auth',
    verifyAccountsAccess = hasAuthenticatedAccountsAccess
  } = {}
) {
  const nextAuth = auth

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (nextAuth.cookieHeader !== '' && await verifyAccountsAccess(nextAuth)) {
      if (attempt > 0) {
        console.log('Bank Hapoalim auth verification recovered after retry', {
          source,
          attempt: attempt + 1,
          ...summarizeAuthSnapshot(nextAuth)
        })
      }
      return {
        auth: nextAuth,
        verified: true
      }
    }
    if (attempt < attempts - 1) {
      await waitForMs(delayMs)
    }
  }

  if (nextAuth.cookieHeader !== '') {
    console.warn('Bank Hapoalim auth verification retries exhausted', {
      source,
      attempts,
      ...summarizeAuthSnapshot(nextAuth)
    })
  }

  return {
    auth: nextAuth,
    verified: false
  }
}

async function recoverVerifiedAuthFromCookieStore (
  auth,
  {
    attempts = 1,
    delayMs = 0,
    requireSessionCookie = false,
    logMissingAuth = true,
    verifyAccountsAccess = hasAuthenticatedAccountsAccess,
    readCookieStore = updateAuthFromCookieStore
  } = {}
) {
  let nextAuth = auth

  for (let attempt = 0; attempt < attempts; attempt++) {
    nextAuth = await readCookieStore(nextAuth, {
      requireSessionCookie,
      logMissingAuth: logMissingAuth && attempt === attempts - 1
    })
    if (nextAuth.cookieHeader !== '' && await verifyAccountsAccess(nextAuth)) {
      return {
        auth: nextAuth,
        verified: true
      }
    }
    if (attempt < attempts - 1) {
      await waitForMs(delayMs)
    }
  }

  return {
    auth: nextAuth,
    verified: false
  }
}

async function hasAuthenticatedAccountsAccess (auth) {
  try {
    const response = await fetchOfficialJson('/ServerServices/general/accounts?lang=he', auth, { log: false })
    const hasAccess = response.status === 200 && Array.isArray(response.body)
    console.log('Bank Hapoalim accounts access probe', {
      status: response.status,
      hasAccountsArray: hasAccess,
      accountCount: hasAccess ? response.body.length : null
    })
    return hasAccess
  } catch (error) {
    console.warn('Bank Hapoalim accounts access probe failed', error?.responseSummary || error?.response?.status || error?.message || error)
    return false
  }
}

function applyAuthUpdate (targetAuth, nextAuth) {
  targetAuth.cookieHeader = nextAuth.cookieHeader
  targetAuth.xsrfToken = nextAuth.xsrfToken
  targetAuth.restContext = nextAuth.restContext
  targetAuth.acquiredAt = nextAuth.acquiredAt
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

export function isLikelyAuthGateError (error, { allowAuthSuspect = false } = {}) {
  const response = error?.responseSummary || error?.response
  const contentType = String(response?.contentType || getHeaderValue(response?.headers, 'content-type') || '')

  return response?.status === 401 ||
    response?.status === 403 ||
    (response?.status >= 200 && response?.status < 400 &&
      (response?.isLoginPage === true || isOfficialLoginPageResponse(response) ||
        (allowAuthSuspect && (/text\/html/i.test(contentType) || error?.isAccountsResponse === true))))
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
          const error = new TemporaryError(`Bank Hapoalim ${label} timed out. Retry sync and send the log if it persists.`)
          error.allowRetry = false
          sessionDeadlineErrors.add(error)
          reject(error)
        }, SESSION_OPERATION_TIMEOUT_MS)
      })
    ])
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function recoverAuthFromCookieStore (storedAuth, { allowAuthSuspect = false } = {}) {
  if (typeof ZenMoney.getCookies !== 'function') {
    return null
  }

  let cookies
  try {
    cookies = await withSessionDeadline(() => ZenMoney.getCookies(), 'cookie store read')
  } catch (error) {
    if (!allowAuthSuspect) {
      throw error
    }
    console.warn('Bank Hapoalim silent cookie read failed; allowing foreground login')
    return null
  }
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
  } catch (error) {
    if (!isLikelyAuthGateError(error, { allowAuthSuspect })) {
      throw error
    }
    console.log('Bank Hapoalim silent recovery: bank rejected stored cookies')
    return null
  }

  let active = true
  const contextAuth = { ...auth }
  try {
    await withSessionDeadline(() => ensureRestContext(contextAuth, { isActive: () => active }), 'silent portal context discovery')
    applyAuthUpdate(auth, contextAuth)
  } catch (error) {
    if (!isSessionDeadlineError(error)) {
      throw error
    }
    console.warn('Bank Hapoalim silent context discovery timed out; keeping verified accounts session')
  } finally {
    active = false
  }
  auth.restContext = auth.restContext || normalizeRestContext(storedAuth?.restContext)
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
  const {
    headers,
    includeXsrf = false,
    sanitizeRequestLog,
    sanitizeResponseLog,
    ...rest
  } = options

  let response
  try {
    response = await fetchJson(OFFICIAL_BASE_URL + path, {
      method: 'GET',
      ...rest,
      headers: buildOfficialHeaders(auth, headers, { includeXsrf }),
      sanitizeRequestLog: {
        ...sanitizeRequestLog,
        headers: {
          Cookie: true,
          cookie: true,
          'X-XSRF-TOKEN': true,
          ...sanitizeRequestLog?.headers
        }
      },
      sanitizeResponseLog: {
        ...sanitizeResponseLog,
        body: value => typeof value === 'string' ? '<response text>' : value,
        url: sanitizeOfficialUrlForLog,
        headers: {
          'set-cookie': true,
          location: true,
          ...sanitizeResponseLog?.headers
        }
      }
    })
  } catch (error) {
    if (error instanceof ParseError) {
      // JSON.parse messages can contain a prefix of authenticated HTML.
      throwTemporary('Bank Hapoalim returned an unexpected response instead of JSON.', error.response)
    }
    throw error
  }

  applyAuthUpdate(auth, updateAuthFromResponse(auth, response))
  return response
}

async function fetchOfficialText (path, auth) {
  const response = await fetch(OFFICIAL_BASE_URL + path, {
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
  })

  applyAuthUpdate(auth, updateAuthFromResponse(auth, response))
  return response
}

async function ensureRestContext (auth, { isActive = () => true } = {}) {
  if (auth.restContext) {
    return auth.restContext
  }

  for (const path of PORTAL_PAGE_PATHS) {
    if (!isActive()) {
      return null
    }
    try {
      const response = await fetchOfficialText(path, auth)
      if (!isActive()) {
        return null
      }
      const restContext = extractRestContextFromText(response.body)
      if (restContext) {
        auth.restContext = restContext
        return restContext
      }
    } catch (error) {
      console.warn('failed to probe portal page for rest context', path, error?.responseSummary || error?.message || error)
    }
  }

  return null
}

function getCurrentAccountBasePath (auth) {
  return auth.restContext
    ? `/${auth.restContext}/current-account`
    : '/ServerServices/current-account'
}

function createWebViewLoginDiagnostics (flow) {
  return {
    flow,
    sawAnyInterceptedRequest: false,
    sawOfficialRequest: false,
    sawAuthenticatedPortalRequest: false,
    lastInterceptedUrl: null,
    cookieJarPollAttemptCount: 0,
    cookieJarPollWithoutCloseCount: 0,
    lastCookieJarCookieNames: [],
    lastCompletionSource: null,
    lastAccountsAccessVerified: false,
    webViewCloseRequested: false
  }
}

function summarizeWebViewLoginDiagnostics (diagnostics, auth, error) {
  return {
    ...diagnostics,
    lastInterceptedUrl: sanitizeOfficialUrlForLog(diagnostics.lastInterceptedUrl) || diagnostics.lastInterceptedUrl,
    auth: summarizeAuthSnapshot(auth),
    error: error?.message || error || null
  }
}

async function captureOfficialSessionFromConfiguredWebView () {
  if (!ZenMoney?.openWebView) {
    throw new TemporaryError('Bank Hapoalim login requires WebView support in the ZenMoney app.')
  }

  let auth = createEmptyAuth()
  const diagnostics = createWebViewLoginDiagnostics('configured-webview')
  let authCaptureInFlight = false
  let cookieJarPollingStarted = false
  let cookieJarPollingStopped = false
  let cookieJarPollingTimeoutId = null
  let cookieJarPollingStartedAt = 0
  let webViewCloseRequested = false
  let closeWebView = null
  let cookieJarCapturePromise = null
  let accountsProbePromise = null
  let requestAuthRevision = 0
  let requestCookieRevision = 0
  let pollingWebView = null
  let interactiveProbeTimeout = null
  const pendingCookieJarOperations = new Set()
  const pendingAccountsOperations = new Set()
  const cookieJarDeadlineErrors = new WeakSet()
  const pendingProbeCancellations = new Set()
  const probeDeadlineErrors = new Set()

  async function withWebViewDeadline (operation) {
    let timeoutId
    try {
      return await Promise.race([
        operation,
        new Promise((resolve, reject) => {
          timeoutId = setTimeout(() => {
            const error = new TemporaryError('Bank Hapoalim WebView login timed out. Retry sync and send the log if the bank page remains blank.')
            error.allowRetry = false
            probeDeadlineErrors.add(error)
            console.warn('Bank Hapoalim WebView login deadline reached', summarizeWebViewLoginDiagnostics(diagnostics, auth, error))
            failWebViewAuthCapture(error)
            reject(error)
          }, COOKIE_STORE_POLL_TIMEOUT_MS)
        })
      ])
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async function withProbeDeadline (operation, source, { interactive = false } = {}) {
    if (interactive) {
      // A deadline cannot cancel native work; keep single-flight until it actually settles.
      const pendingOperations = source === 'cookie jar capture' ? pendingCookieJarOperations : pendingAccountsOperations
      pendingOperations.add(operation)
      const release = () => pendingOperations.delete(operation)
      operation.then(release, release)
    }
    let timeoutId
    let cancelProbe
    try {
      return await Promise.race([
        operation,
        new Promise((resolve, reject) => {
          cancelProbe = () => reject(new Error('Bank Hapoalim WebView capture stopped'))
          pendingProbeCancellations.add(cancelProbe)
          timeoutId = setTimeout(() => {
            const error = new TemporaryError(`Bank Hapoalim WebView ${source} timed out. Retry sync and send the log if it happens again.`)
            error.allowRetry = false
            probeDeadlineErrors.add(error)
            if (interactive) {
              interactiveProbeTimeout = error
              if (source === 'cookie jar capture') {
                cookieJarDeadlineErrors.add(error)
              }
            }
            reject(error)
          }, WEBVIEW_AUTH_PROBE_TIMEOUT_MS)
        })
      ])
    } finally {
      clearTimeout(timeoutId)
      pendingProbeCancellations.delete(cancelProbe)
    }
  }

  function stopPendingProbes () {
    for (const cancelProbe of pendingProbeCancellations) {
      cancelProbe()
    }
  }

  async function verifyRecoveryAccountsAccess (candidateAuth) {
    const nextAuth = { ...candidateAuth }
    const verified = await withProbeDeadline(hasAuthenticatedAccountsAccess(nextAuth), 'recovery accounts probe')
    if (verified) {
      applyAuthUpdate(candidateAuth, nextAuth)
    }
    return verified
  }

  function readRecoveryCookieStore (candidateAuth, options) {
    return withProbeDeadline(updateAuthFromCookieStore(candidateAuth, options), 'recovery cookie store')
  }

  async function finishPendingAuthCapture () {
    const pendingCaptures = [cookieJarCapturePromise, accountsProbePromise].filter(Boolean)
    const pendingResults = await Promise.all(pendingCaptures.map(promise => promise.then(
      () => ({ status: 'fulfilled' }),
      reason => ({ status: 'rejected', reason })
    )))
    stopPendingProbes()
    if (interactiveProbeTimeout && (pendingAccountsOperations.size > 0 ||
      (pendingCookieJarOperations.size > 0 && auth.cookieHeader === ''))) {
      throw interactiveProbeTimeout
    }
    for (const result of pendingResults) {
      if (result.status === 'rejected') {
        console.warn('Bank Hapoalim WebView pending auth capture failed', summarizeWebViewLoginDiagnostics(diagnostics, auth, result.reason))
        if (probeDeadlineErrors.has(result.reason) &&
          (!cookieJarDeadlineErrors.has(result.reason) || auth.cookieHeader === '')) {
          throw result.reason
        }
      }
    }
  }

  function stopCookieJarPolling () {
    cookieJarPollingStopped = true
    if (cookieJarPollingTimeoutId != null && typeof clearTimeout === 'function') {
      clearTimeout(cookieJarPollingTimeoutId)
    }
    cookieJarPollingTimeoutId = null
  }

  function failWebViewAuthCapture (error) {
    if (cookieJarPollingStopped || webViewCloseRequested) {
      return
    }
    webViewCloseRequested = true
    diagnostics.webViewCloseRequested = true
    stopCookieJarPolling()
    stopPendingProbes()
    if (closeWebView) {
      closeWebView(error)
    }
  }

  function closeWebViewWithAuth (close, nextAuth, source) {
    if (webViewCloseRequested) {
      return
    }
    webViewCloseRequested = true
    diagnostics.webViewCloseRequested = true
    diagnostics.lastCompletionSource = source
    auth = nextAuth
    stopCookieJarPolling()
    stopPendingProbes()
    console.log('Bank Hapoalim WebView auth captured', {
      source,
      cookieNames: getCookieHeaderNames(auth.cookieHeader),
      hasXsrfToken: Boolean(auth.xsrfToken)
    })
    close(null, { auth })
  }

  async function tryCloseWithVerifiedAuth ({ close, nextAuth, verifyAccountsAccess, source }) {
    if (authCaptureInFlight || pendingAccountsOperations.size > 0 || webViewCloseRequested || cookieJarPollingStopped) {
      return false
    }

    authCaptureInFlight = true
    const revision = requestAuthRevision
    const verifiedAuth = { ...nextAuth }
    try {
      if (nextAuth.cookieHeader === '') {
        return false
      }
      if (verifyAccountsAccess) {
        accountsProbePromise = withProbeDeadline(hasAuthenticatedAccountsAccess(verifiedAuth), 'accounts probe', { interactive: true })
        diagnostics.lastAccountsAccessVerified = await accountsProbePromise
        if (!diagnostics.lastAccountsAccessVerified) {
          diagnostics.lastCompletionSource = `${source}:accounts-access-not-ready`
          return false
        }
      }
      if (!verifyAccountsAccess && !hasOfficialSessionCookie(nextAuth.cookieHeader)) {
        return false
      }
      if (revision !== requestAuthRevision || webViewCloseRequested) {
        return false
      }
      const originalCookies = parseCookieHeader(nextAuth.cookieHeader)
      const changedCookies = Object.entries(parseCookieHeader(auth.cookieHeader))
        .filter(([name, value]) => name !== 'SMSESSION' && name !== 'XSRF-TOKEN' && originalCookies[name] !== value)
        .map(([name, value]) => `${name}=${value}`).join('; ')
      verifiedAuth.cookieHeader = mergeCookieHeaders(verifiedAuth.cookieHeader, changedCookies)
      if (cookieJarPollingStopped) {
        auth = verifiedAuth
        return false
      }
      closeWebViewWithAuth(close, verifiedAuth, source)
      return true
    } catch (error) {
      if (cookieJarPollingStopped) {
        return false
      }
      console.warn('failed to complete Bank Hapoalim WebView login from verified auth', error?.message || error)
      return false
    } finally {
      authCaptureInFlight = false
      accountsProbePromise = null
    }
  }

  function tryCompleteFromWebViewCookieJar (options) {
    if (cookieJarCapturePromise) {
      return cookieJarCapturePromise
    }
    cookieJarCapturePromise = completeFromWebViewCookieJar(options)
      .finally(() => { cookieJarCapturePromise = null })
    return cookieJarCapturePromise
  }

  async function completeFromWebViewCookieJar ({
    close,
    webView,
    requestUrl,
    requireSessionCookie,
    verifyAccountsAccess,
    source
  }) {
    if (authCaptureInFlight || pendingCookieJarOperations.size > 0 || pendingAccountsOperations.size > 0 || webViewCloseRequested || cookieJarPollingStopped) {
      return false
    }

    if (source === 'webview-cookie-jar-poll') {
      diagnostics.cookieJarPollAttemptCount++
    }
    if (!close) {
      diagnostics.cookieJarPollWithoutCloseCount++
      return false
    }

    const revision = requestCookieRevision
    let captureActive = true
    let nextAuth
    try {
      nextAuth = await withProbeDeadline(updateAuthFromWebViewCookieJar(auth, webView, {
        requestUrl,
        requireSessionCookie,
        logMissingAuth: source !== 'webview-cookie-jar-poll',
        logErrors: source !== 'webview-cookie-jar-poll',
        isActive: () => captureActive && revision === requestCookieRevision && !webViewCloseRequested
      }), 'cookie jar capture', { interactive: true })
    } finally {
      captureActive = false
    }
    if (revision !== requestCookieRevision || webViewCloseRequested) {
      return false
    }
    diagnostics.lastCookieJarCookieNames = getCookieHeaderNames(nextAuth.cookieHeader)
    if (nextAuth.cookieHeader !== '') {
      auth = nextAuth
    }
    if (cookieJarPollingStopped) {
      return false
    }
    const isComplete = requireSessionCookie
      ? hasOfficialSessionCookie(nextAuth.cookieHeader)
      : nextAuth.cookieHeader !== ''
    if (!isComplete) {
      return false
    }

    return await tryCloseWithVerifiedAuth({
      close,
      nextAuth,
      verifyAccountsAccess,
      source
    })
  }

  function scheduleCookieJarPoll () {
    if (cookieJarPollingStopped || webViewCloseRequested || typeof setTimeout !== 'function' || !hasWebViewCookieJar(pollingWebView)) {
      return
    }
    if (Date.now() - cookieJarPollingStartedAt > COOKIE_STORE_POLL_TIMEOUT_MS) {
      console.warn('Bank Hapoalim WebView cookie jar polling timed out', summarizeWebViewLoginDiagnostics(diagnostics, auth))
      return
    }

    cookieJarPollingTimeoutId = setTimeout(async () => {
      try {
        cookieJarPollingTimeoutId = null
        const isComplete = await tryCompleteFromWebViewCookieJar({
          close: closeWebView,
          webView: pollingWebView,
          requireSessionCookie: false,
          verifyAccountsAccess: true,
          source: 'webview-cookie-jar-poll'
        })
        if (!isComplete) {
          scheduleCookieJarPoll()
        }
      } catch (error) {
        if (cookieJarPollingStopped) {
          return
        }
        console.warn('Bank Hapoalim WebView cookie jar polling failed', summarizeWebViewLoginDiagnostics(diagnostics, auth, error))
        if (probeDeadlineErrors.has(error)) {
          scheduleCookieJarPoll()
        } else {
          failWebViewAuthCapture(error)
        }
      }
    }, COOKIE_STORE_POLL_INTERVAL_MS)
  }

  function startCookieJarPolling (webView) {
    if (hasWebViewCookieJar(webView)) {
      pollingWebView = webView
    }
    if (cookieJarPollingStarted || !hasWebViewCookieJar(webView)) {
      return
    }
    cookieJarPollingStarted = true
    cookieJarPollingStartedAt = Date.now()
    scheduleCookieJarPoll()
  }

  async function completeFromRequest (request, webView, close, isAuthenticatedPortalRequest) {
    const canVerifyRequest = isAuthenticatedPortalRequest ||
      (isOfficialUrl(request?.url) && hasOfficialSessionCookie(auth.cookieHeader))
    if (auth.cookieHeader !== '' && canVerifyRequest && close) {
      const isComplete = await tryCloseWithVerifiedAuth({
        close,
        nextAuth: auth,
        verifyAccountsAccess: true,
        source: isAuthenticatedPortalRequest ? 'authenticated-portal-request' : 'official-session-request'
      })
      if (isComplete) {
        return
      }
    }
    if (hasWebViewCookieJar(webView)) {
      await tryCompleteFromWebViewCookieJar({
        close,
        webView,
        requestUrl: request?.url,
        requireSessionCookie: false,
        verifyAccountsAccess: true,
        source: isAuthenticatedPortalRequest
          ? 'authenticated-portal-webview-cookie-jar'
          : 'webview-cookie-jar-request'
      })
    }
  }

  try {
    const result = await withWebViewDeadline(openWebViewAndInterceptRequest({
      url: WEB_LOGIN_URL,
      log: false,
      sanitizeRequestLog: {
        headers: {
          Cookie: true,
          cookie: true,
          'X-XSRF-TOKEN': true
        }
      },
      configure: async (webView) => {
        startCookieJarPolling(webView)
      },
      intercept: function (request, webView) {
        try {
          if (cookieJarPollingStopped || webViewCloseRequested) {
            return null
          }
          diagnostics.sawAnyInterceptedRequest = true
          diagnostics.lastInterceptedUrl = request?.url || null
          const close = typeof this?.close === 'function' ? this.close.bind(this) : closeWebView
          if (close) {
            closeWebView = close
          }
          if (hasWebViewCookieJar(webView)) {
            startCookieJarPolling(webView)
          }
          if (isOfficialUrl(request?.url)) {
            diagnostics.sawOfficialRequest = true
            const nextAuth = updateAuthFromRequest(auth, request)
            if (nextAuth.cookieHeader !== auth.cookieHeader) {
              requestCookieRevision++
            }
            const previousSession = getCookieValue(auth.cookieHeader, 'SMSESSION')
            const nextSession = getCookieValue(nextAuth.cookieHeader, 'SMSESSION')
            if (previousSession !== nextSession || nextAuth.xsrfToken !== auth.xsrfToken ||
              nextAuth.restContext !== auth.restContext ||
              (!nextSession && getCookieValue(nextAuth.cookieHeader, 'TS') !== getCookieValue(auth.cookieHeader, 'TS'))) {
              requestAuthRevision++
            }
            auth = nextAuth
          }

          const isAuthenticatedPortalRequest = WEB_SUCCESS_PATTERNS.some(pattern => pattern.test(request?.url || ''))
          if (isAuthenticatedPortalRequest) {
            diagnostics.sawAuthenticatedPortalRequest = true
            console.log('Bank Hapoalim WebView reached authenticated portal request', {
              url: sanitizeOfficialUrlForLog(request?.url),
              hasRequestCookies: getCookieHeaderNames(getHeaderValue(request?.headers, 'cookie') || getHeaderValue(request?.headers, 'Cookie')).length > 0,
              authCookieNames: getCookieHeaderNames(auth.cookieHeader)
            })
          }
          // Never hold native navigation while waiting for cookie or HTTP bridges.
          completeFromRequest(request, webView, close, isAuthenticatedPortalRequest)
            .catch(error => {
              if (cookieJarPollingStopped) {
                return
              }
              console.warn('Bank Hapoalim WebView auth capture failed', summarizeWebViewLoginDiagnostics(diagnostics, auth, error))
              if (!probeDeadlineErrors.has(error)) {
                failWebViewAuthCapture(error)
              }
            })
          return null
        } catch (error) {
          console.warn('Bank Hapoalim WebView intercept handling failed', summarizeWebViewLoginDiagnostics(diagnostics, auth, error))
          throw error
        }
      }
    }))

    stopCookieJarPolling()
    const resultAuth = restoreAuth(result?.auth)
    if (!resultAuth) {
      await finishPendingAuthCapture()
    }
    webViewCloseRequested = true
    stopPendingProbes()
    auth = resultAuth || auth
    let hasVerifiedAccountsAccessFromResult = auth.cookieHeader !== '' && await verifyRecoveryAccountsAccess(auth)
    if (!hasVerifiedAccountsAccessFromResult) {
      const recoveredConfiguredResultAuth = await recoverVerifiedAuth(auth, {
        attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
        delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
        source: 'configured-webview-result-auth',
        verifyAccountsAccess: verifyRecoveryAccountsAccess
      })
      auth = recoveredConfiguredResultAuth.auth
      hasVerifiedAccountsAccessFromResult = recoveredConfiguredResultAuth.verified
    }
    if (!hasVerifiedAccountsAccessFromResult) {
      const recoveredConfiguredResultCookieStoreAuth = await recoverVerifiedAuthFromCookieStore(auth, {
        attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
        delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
        requireSessionCookie: false,
        logMissingAuth: false,
        verifyAccountsAccess: verifyRecoveryAccountsAccess,
        readCookieStore: readRecoveryCookieStore
      })
      auth = recoveredConfiguredResultCookieStoreAuth.auth
      hasVerifiedAccountsAccessFromResult = recoveredConfiguredResultCookieStoreAuth.verified
    }
    ensure(auth.cookieHeader !== '', 'web login did not produce an authenticated cookie snapshot')
    ensure(hasVerifiedAccountsAccessFromResult || await verifyRecoveryAccountsAccess(auth), 'web login did not produce authenticated API access')
    await ensureRestContext(auth)
    return auth
  } catch (error) {
    stopCookieJarPolling()
    if (probeDeadlineErrors.has(error)) {
      stopPendingProbes()
      throw error
    }
    await finishPendingAuthCapture()
    let hasVerifiedAccountsAccessAfterClose = false
    const recoveredConfiguredCloseAuth = await recoverVerifiedAuth(auth, {
      attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
      delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
      source: 'configured-webview-close-auth',
      verifyAccountsAccess: verifyRecoveryAccountsAccess
    })
    auth = recoveredConfiguredCloseAuth.auth
    hasVerifiedAccountsAccessAfterClose = recoveredConfiguredCloseAuth.verified
    if (hasVerifiedAccountsAccessAfterClose) {
      await ensureRestContext(auth)
      return auth
    }

    const recoveredConfiguredCloseCookieStoreAuth = await recoverVerifiedAuthFromCookieStore(auth, {
      attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
      delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
      requireSessionCookie: false,
      verifyAccountsAccess: verifyRecoveryAccountsAccess,
      readCookieStore: readRecoveryCookieStore
    })
    auth = recoveredConfiguredCloseCookieStoreAuth.auth
    hasVerifiedAccountsAccessAfterClose = recoveredConfiguredCloseCookieStoreAuth.verified
    if (hasVerifiedAccountsAccessAfterClose) {
      await ensureRestContext(auth)
      return auth
    }

    if (error instanceof TemporaryError) {
      throw error
    }
    console.warn('interactive web login failed', summarizeWebViewLoginDiagnostics(diagnostics, auth, error))
    throw new TemporaryError(WEB_LOGIN_INCOMPLETE_MESSAGE)
  }
}

async function captureOfficialSessionFromLegacyWebView () {
  if (!ZenMoney?.openWebView) {
    throw new TemporaryError('Bank Hapoalim login requires WebView support in the ZenMoney app.')
  }

  let auth = createEmptyAuth()
  let authCaptureInFlight = false
  let cookieStorePollingStarted = false
  let cookieStorePollingStopped = false
  let cookieStorePollingTimeoutId = null
  let cookieStorePollingStartedAt = 0
  let webViewCloseRequested = false

  function stopCookieStorePolling () {
    cookieStorePollingStopped = true
    if (cookieStorePollingTimeoutId != null && typeof clearTimeout === 'function') {
      clearTimeout(cookieStorePollingTimeoutId)
    }
    cookieStorePollingTimeoutId = null
  }

  function closeWebViewWithAuth (close, nextAuth, source) {
    if (webViewCloseRequested) {
      return
    }
    webViewCloseRequested = true
    auth = nextAuth
    stopCookieStorePolling()
    console.log('Bank Hapoalim WebView auth captured', {
      source,
      cookieNames: getCookieHeaderNames(auth.cookieHeader),
      hasXsrfToken: Boolean(auth.xsrfToken)
    })
    close(null, { auth })
  }

  async function tryCloseWithVerifiedAuth ({ close, nextAuth, verifyAccountsAccess, source }) {
    if (authCaptureInFlight || webViewCloseRequested) {
      return false
    }

    authCaptureInFlight = true
    try {
      if (nextAuth.cookieHeader === '') {
        return false
      }
      if (verifyAccountsAccess && !await hasAuthenticatedAccountsAccess(nextAuth)) {
        return false
      }
      if (!verifyAccountsAccess && !hasOfficialSessionCookie(nextAuth.cookieHeader)) {
        return false
      }
      closeWebViewWithAuth(close, nextAuth, source)
      return true
    } catch (error) {
      console.warn('failed to complete Bank Hapoalim WebView login from verified auth', error?.message || error)
      return false
    } finally {
      authCaptureInFlight = false
    }
  }

  async function tryCompleteFromCookieStore ({ close, requireSessionCookie, verifyAccountsAccess, source }) {
    if (authCaptureInFlight || webViewCloseRequested) {
      return false
    }

    const nextAuth = await updateAuthFromCookieStore(auth, {
      requireSessionCookie,
      logMissingAuth: source !== 'cookie-store-poll'
    })
    const isComplete = requireSessionCookie
      ? hasOfficialSessionCookie(nextAuth.cookieHeader)
      : nextAuth.cookieHeader !== ''
    if (!isComplete) {
      return false
    }

    return await tryCloseWithVerifiedAuth({
      close,
      nextAuth,
      verifyAccountsAccess,
      source
    })
  }

  function scheduleCookieStorePoll (close) {
    if (cookieStorePollingStopped || webViewCloseRequested || typeof setTimeout !== 'function') {
      return
    }
    if (Date.now() - cookieStorePollingStartedAt > COOKIE_STORE_POLL_TIMEOUT_MS) {
      console.warn('Bank Hapoalim cookie store polling timed out')
      return
    }

    cookieStorePollingTimeoutId = setTimeout(async () => {
      try {
        cookieStorePollingTimeoutId = null
        const isComplete = await tryCompleteFromCookieStore({
          close,
          requireSessionCookie: false,
          verifyAccountsAccess: true,
          source: 'cookie-store-poll'
        })
        if (!isComplete) {
          scheduleCookieStorePoll(close)
        }
      } catch (error) {
        console.warn('Bank Hapoalim cookie store polling failed', error?.message || error)
      }
    }, COOKIE_STORE_POLL_INTERVAL_MS)
  }

  function startCookieStorePolling (close) {
    if (cookieStorePollingStarted || !ZenMoney?.getCookies) {
      return
    }
    cookieStorePollingStarted = true
    cookieStorePollingStartedAt = Date.now()
    scheduleCookieStorePoll(close)
  }

  try {
    const result = await openWebViewAndInterceptRequest({
      url: WEB_LOGIN_URL,
      log: false,
      sanitizeRequestLog: {
        headers: {
          Cookie: true,
          cookie: true,
          'X-XSRF-TOKEN': true
        }
      },
      intercept (request) {
        const close = typeof this?.close === 'function' ? this.close.bind(this) : null
        if (close) {
          startCookieStorePolling(close)
        }
        if (isOfficialUrl(request?.url)) {
          auth = updateAuthFromRequest(auth, request)
        }

        const isAuthenticatedPortalRequest = WEB_SUCCESS_PATTERNS.some(pattern => pattern.test(request?.url || ''))
        if (isAuthenticatedPortalRequest) {
          console.log('Bank Hapoalim WebView reached authenticated portal request', {
            url: sanitizeOfficialUrlForLog(request?.url),
            hasRequestCookies: getCookieHeaderNames(getHeaderValue(request?.headers, 'cookie') || getHeaderValue(request?.headers, 'Cookie')).length > 0,
            authCookieNames: getCookieHeaderNames(auth.cookieHeader)
          })
        }
        if (hasOfficialSessionCookie(auth.cookieHeader) && isAuthenticatedPortalRequest) {
          if (!close) {
            return { auth }
          }
          tryCloseWithVerifiedAuth({
            close,
            nextAuth: auth,
            verifyAccountsAccess: true,
            source: 'authenticated-portal-request'
          })
            .catch(error => {
              console.warn('failed to complete Bank Hapoalim WebView login from request auth', error?.message || error)
            })
          return null
        }

        if (close && isAuthenticatedPortalRequest && ZenMoney?.getCookies && !authCaptureInFlight) {
          tryCompleteFromCookieStore({
            close,
            requireSessionCookie: false,
            verifyAccountsAccess: true,
            source: 'authenticated-portal-cookie-store'
          })
            .catch(error => {
              console.warn('failed to complete Bank Hapoalim WebView login from cookie store', error?.message || error)
            })
        }

        return null
      }
    })

    stopCookieStorePolling()
    auth = restoreAuth(result?.auth) || auth
    let hasVerifiedAccountsAccessFromResult = false
    const recoveredLegacyResultAuth = await recoverVerifiedAuth(auth, {
      attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
      delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
      source: 'legacy-webview-result-auth'
    })
    auth = recoveredLegacyResultAuth.auth
    hasVerifiedAccountsAccessFromResult = recoveredLegacyResultAuth.verified
    if (!hasVerifiedAccountsAccessFromResult) {
      const recoveredLegacyResultCookieStoreAuth = await recoverVerifiedAuthFromCookieStore(auth, {
        attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
        delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
        requireSessionCookie: false,
        logMissingAuth: false
      })
      auth = recoveredLegacyResultCookieStoreAuth.auth
      hasVerifiedAccountsAccessFromResult = recoveredLegacyResultCookieStoreAuth.verified
    }
    if (auth.cookieHeader === '') {
      throw new Error('web login did not produce an authenticated cookie snapshot')
    }
    if (!hasVerifiedAccountsAccessFromResult && !await hasAuthenticatedAccountsAccess(auth)) {
      throw new Error('web login did not produce authenticated API access')
    }
    await ensureRestContext(auth)
    return auth
  } catch (error) {
    stopCookieStorePolling()
    let hasVerifiedAccountsAccessAfterClose = false
    const recoveredLegacyCloseAuth = await recoverVerifiedAuth(auth, {
      attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
      delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
      source: 'legacy-webview-close-auth'
    })
    auth = recoveredLegacyCloseAuth.auth
    hasVerifiedAccountsAccessAfterClose = recoveredLegacyCloseAuth.verified
    if (hasVerifiedAccountsAccessAfterClose) {
      await ensureRestContext(auth)
      return auth
    }

    const recoveredLegacyCloseCookieStoreAuth = await recoverVerifiedAuthFromCookieStore(auth, {
      attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
      delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
      requireSessionCookie: false
    })
    auth = recoveredLegacyCloseCookieStoreAuth.auth
    hasVerifiedAccountsAccessAfterClose = recoveredLegacyCloseCookieStoreAuth.verified
    if (hasVerifiedAccountsAccessAfterClose) {
      await ensureRestContext(auth)
      return auth
    }

    if (error instanceof TemporaryError) {
      throw error
    }
    console.warn('interactive web login failed', {
      flow: 'legacy-webview',
      auth: summarizeAuthSnapshot(auth),
      error: error?.message || error
    })
    throw new TemporaryError(WEB_LOGIN_INCOMPLETE_MESSAGE)
  }
}

export async function login () {
  return await (ZenMoney?.features?.webViewConfiguration
    ? captureOfficialSessionFromConfiguredWebView()
    : captureOfficialSessionFromLegacyWebView())
}

async function fetchMainAccountDetails (auth, mainAccount, accountId) {
  await ensureRestContext(auth)
  const currentAccountBasePath = getCurrentAccountBasePath(auth)
  const response = await fetchOfficialJson(
    `${currentAccountBasePath}/composite/balanceAndCreditLimit?${qs.stringify({ accountId, view: 'details', lang: 'he' })}`,
    auth
  )

  mainAccount.details = {
    ...response.body,
    currentAccountCreditFrame: response.body?.creditLimitAmount ?? response.body?.currentAccountCreditFrame ?? 0
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
  if (!account) {
    return []
  }
  account.mainProductId = accountId
  account.structType = 'foreignCurrencyAccount'
  return [account]
}

async function fetchDeposits (auth, url, structType, accountId) {
  const separator = url.includes('?') ? '&' : '?'
  const response = await fetchOfficialJson(`${url}${separator}${qs.stringify({ accountId })}`, auth)
  return (response.body?.list || []).map(account => {
    const result = account.data?.[0]
    if (!result) {
      return null
    }
    result.structType = structType
    return result
  }).filter(Boolean)
}

async function fetchLoans (auth, accountId) {
  const response = await fetchOfficialJson(`/ServerServices/credit-and-mortgage/v3/loans?${qs.stringify({ accountId })}`, auth)
  return await Promise.all((response.body?.data || []).map(async account => {
    const query = qs.stringify({ unitedCreditTypeCode: account.unitedCreditTypeCode, accountId })
    const detailsResponse = await fetchOfficialJson(`/ServerServices/credit-and-mortgage/v3/loans/${account.creditSerialNumber}?${query}`, auth)

    account.details = detailsResponse.body
    account.structType = 'loan'
    return account
  }))
}

async function fetchMortgages (auth, accountId) {
  const response = await fetchOfficialJson(`/ServerServices/credit-and-mortgage/mortgages?${qs.stringify({ accountId })}`, auth)
  return (response.body?.data || []).map(account => {
    account.structType = 'mortgage'
    return account
  })
}

export async function fetchAccounts (auth) {
  const response = await fetchOfficialAccounts(auth)

  const accounts = []
  await Promise.all(response.body.map(async mainAccount => {
    ensure(mainAccount.accountNumber && mainAccount.branchNumber && mainAccount.bankNumber, 'unexpected account', { body: mainAccount })
    const accountId = `${mainAccount.bankNumber}-${mainAccount.branchNumber}-${mainAccount.accountNumber}`
    accounts.push(...flatten(await Promise.all([
      async () => await fetchMainAccountDetails(auth, mainAccount, accountId),
      async () => await safeFetch('foreign currency', async () => fetchForeignCurrencyAccount(auth, accountId)),
      async () => await safeFetch('deposits', async () => fetchDeposits(auth, '/ServerServices/deposits-and-savings/deposits?view=details&lang=he', 'deposit', accountId)),
      async () => await safeFetch('savings', async () => fetchDeposits(auth, '/ServerServices/deposits-and-savings/savingsDeposits?view=details&lang=he', 'saving', accountId)),
      async () => await safeFetch('loans', async () => fetchLoans(auth, accountId)),
      async () => await safeFetch('mortgages', async () => fetchMortgages(auth, accountId))
    ].map(fn => fn()))))
  }))
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

function deduplicateTransactions (transactions) {
  const seenKeys = new Set()
  return transactions.filter(transaction => {
    const key = [
      transaction.serialNumber,
      transaction.referenceNumber,
      transaction.eventDate,
      transaction.valueDate,
      transaction.eventAmount,
      transaction.activityDescription
    ].join('|')

    if (seenKeys.has(key)) {
      return false
    }

    seenKeys.add(key)
    return true
  })
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

  const batch = response.body?.transactions || (response.status === 204 ? [] : null)
  ensure(Array.isArray(batch), 'unexpected transactions response', response)
  return batch
}

async function fetchOfficialCurrentAccountTransactions (auth, product, fromDate, toDate) {
  const batch = await fetchOfficialCurrentAccountTransactionsWindow(auth, product, fromDate, toDate)

  if (batch.length < OFFICIAL_TRANSACTION_LIMIT || areSameCalendarDay(fromDate, toDate)) {
    return batch
  }

  const midpointDay = getMidpointDay(fromDate, toDate)
  if (midpointDay.getTime() <= startOfDay(fromDate).getTime() || midpointDay.getTime() >= startOfDay(toDate).getTime()) {
    return batch
  }

  const leftTransactions = await fetchOfficialCurrentAccountTransactions(auth, product, fromDate, midpointDay)
  const rightFromDate = addDays(midpointDay, 1)
  const rightTransactions = rightFromDate.getTime() <= startOfDay(toDate).getTime()
    ? await fetchOfficialCurrentAccountTransactions(auth, product, rightFromDate, toDate)
    : []

  return deduplicateTransactions([...leftTransactions, ...rightTransactions])
}

export async function fetchTransactions (auth, product, fromDate, toDate) {
  const fromDateStr = toISODateString(fromDate).replace(/-/g, '')
  const toDateStr = toISODateString(toDate).replace(/-/g, '')

  if (product.type === 'foreignCurrencyAccount') {
    const response = await fetchOfficialJson('/ServerServices/foreign-currency/transactions?type=business&view=details&' +
      `retrievalStartDate=${fromDateStr}&` +
      `retrievalEndDate=${toDateStr}&` +
      `currencyCodeList=${product.currencyCode}&` +
      `detailedAccountTypeCodeList=${product.detailedAccountTypeCode}&` +
      `accountId=${product.id}`, auth)
    return response.body.balancesAndLimitsDataList?.transactions || []
  }

  return await fetchOfficialCurrentAccountTransactions(auth, product, fromDate, toDate)
}
