import { flatten } from 'lodash'
import qs from 'querystring'
import * as setCookie from 'set-cookie-parser'
import { TemporaryError } from '../../errors'
import { toISODateString } from '../../common/dateUtils'
import { fetch, fetchJson, ParseError, openWebViewAndInterceptRequest } from '../../common/network'
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
const COOKIE_STORE_RECOVERY_RETRY_COUNT = 5
const COOKIE_STORE_RECOVERY_RETRY_DELAY_MS = 250
const OFFICIAL_AUTH_COOKIE_NAMES = new Set([
  'SMSESSION',
  'XSRF-TOKEN',
  'TS'
])

function summarizeResponse (response) {
  return response
    ? {
        status: response.status,
        url: response.url,
        contentType: response.headers?.['content-type'],
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
    console.warn(`optional account endpoint failed: ${label}`, error?.responseSummary || error?.response || error?.message || error)
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

function buildCookieHeaderFromCookieStore (cookies) {
  if (!Array.isArray(cookies)) {
    return ''
  }

  const selectedCookiesByName = (cookies || [])
    .filter(isOfficialCookieStoreEntry)
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

async function recoverVerifiedAuthFromCookieStore (
  auth,
  {
    attempts = 1,
    delayMs = 0,
    requireSessionCookie = false,
    logMissingAuth = true
  } = {}
) {
  let nextAuth = auth

  for (let attempt = 0; attempt < attempts; attempt++) {
    nextAuth = await updateAuthFromCookieStore(nextAuth, {
      requireSessionCookie,
      logMissingAuth: logMissingAuth && attempt === attempts - 1
    })
    if (nextAuth.cookieHeader !== '' && await hasAuthenticatedAccountsAccess(nextAuth)) {
      return nextAuth
    }
    if (attempt < attempts - 1) {
      await waitForMs(delayMs)
    }
  }

  return nextAuth
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

export function isLikelyAuthGateError (error) {
  const response = error?.responseSummary || error?.response
  const contentType = String(response?.contentType || response?.headers?.['content-type'] || '')

  return error instanceof ParseError ||
    response?.status === 401 ||
    response?.status === 403 ||
    /text\/html/i.test(contentType)
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

  const response = await fetchJson(OFFICIAL_BASE_URL + path, {
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
      headers: {
        'set-cookie': true,
        ...sanitizeResponseLog?.headers
      }
    }
  })

  applyAuthUpdate(auth, updateAuthFromResponse(auth, response))
  return response
}

async function fetchOfficialText (path, auth) {
  const response = await fetch(OFFICIAL_BASE_URL + path, {
    method: 'GET',
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

async function ensureRestContext (auth) {
  if (auth.restContext) {
    return auth.restContext
  }

  for (const path of PORTAL_PAGE_PATHS) {
    try {
      const response = await fetchOfficialText(path, auth)
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

async function captureOfficialSessionFromWebView () {
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
        if (typeof request?.url === 'string' && request.url.indexOf(OFFICIAL_BASE_URL) === 0) {
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
    auth = await recoverVerifiedAuthFromCookieStore(auth, {
      attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
      delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
      requireSessionCookie: false,
      logMissingAuth: false
    })
    if (auth.cookieHeader === '') {
      throw new Error('web login did not produce an authenticated cookie snapshot')
    }
    if (!await hasAuthenticatedAccountsAccess(auth)) {
      throw new Error('web login did not produce authenticated API access')
    }
    await ensureRestContext(auth)
    return auth
  } catch (error) {
    stopCookieStorePolling()
    auth = await recoverVerifiedAuthFromCookieStore(auth, {
      attempts: COOKIE_STORE_RECOVERY_RETRY_COUNT,
      delayMs: COOKIE_STORE_RECOVERY_RETRY_DELAY_MS,
      requireSessionCookie: false
    })
    if (auth.cookieHeader !== '' && await hasAuthenticatedAccountsAccess(auth)) {
      await ensureRestContext(auth)
      return auth
    }

    if (error instanceof TemporaryError) {
      throw error
    }
    console.warn('interactive web login failed', error?.message || error)
    throw new TemporaryError(WEB_LOGIN_INCOMPLETE_MESSAGE)
  }
}

export async function login () {
  return await captureOfficialSessionFromWebView()
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
  const response = await fetchOfficialJson('/ServerServices/general/accounts?lang=he', auth)
  ensure(Array.isArray(response.body), 'unexpected accounts response', response)

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
