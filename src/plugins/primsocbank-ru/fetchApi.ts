import { fetch, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, InvalidPreferencesError, TemporaryError, TemporaryUnavailableError } from '../../errors'
import { Auth, Preferences, Product, ProductKind, Session } from './models'
import { getArray, getNumber, getOptArray, getOptNumber, getOptString } from '../../types/get'
import { generateRandomString } from '../../common/utils'

const bankBaseUrl = 'https://psl.pskb.com'
const mobileJsonUrl = `${bankBaseUrl}/mobileService/3.0/json`
const defaultHeaders = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/x-www-form-urlencoded',
  'f-client': 'web',
  'f-site-code': 'primsoc'
}
const bankId = '10832'
const pageSize = 50
// The history endpoint can include a boundary item again on the next page.
const visiblePageSize = pageSize - 1
const maxAuthRedirects = 12

export interface LoginRedirect {
  redirectUrl: string
  cookieHeader: string
}

interface LoginFlowSession {
  cookieHeader: string
}

function formBody (params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

function makeRequestId (): string {
  return 'WEB' + String(generateRandomString(5, '0123456789'))
}

function formatDate (date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return String(day) + '.' + String(month) + '.' + String(date.getFullYear())
}

function mergeCookieHeaders (currentCookieHeader: string, setCookieHeader: string | undefined): string {
  if (setCookieHeader == null || setCookieHeader === '') {
    return currentCookieHeader
  }
  const cookies: Record<string, string> = {}
  for (const cookiePair of currentCookieHeader.split(';')) {
    const separator = cookiePair.indexOf('=')
    if (separator > 0) {
      cookies[cookiePair.slice(0, separator).trim()] = cookiePair.slice(separator + 1).trim()
    }
  }
  for (const header of splitSetCookieHeader(setCookieHeader)) {
    const pair = header.split(';', 1)[0]
    const separator = pair.indexOf('=')
    if (separator > 0) {
      cookies[pair.slice(0, separator).trim()] = pair.slice(separator + 1).trim()
    }
  }
  return Object.entries(cookies).map(([name, value]) => String(name) + '=' + String(value)).join('; ')
}

function splitSetCookieHeader (header: string): string[] {
  const result: string[] = []
  let start = 0
  for (let i = 0; i < header.length; i++) {
    if (header[i] !== ',') {
      continue
    }
    let j = i + 1
    while (header[j] === ' ') {
      j++
    }
    const nextSeparator = header.indexOf('=', j)
    const nextTerminator = Math.min(
      ...[header.indexOf(';', j), header.indexOf(',', j)]
        .filter(index => index !== -1)
    )
    if (nextSeparator !== -1 && (nextTerminator === Infinity || nextSeparator < nextTerminator)) {
      result.push(header.slice(start, i).trim())
      start = j
    }
  }
  result.push(header.slice(start).trim())
  return result.filter(value => value !== '')
}

function getHeaderValue (response: FetchResponse, name: string): string | undefined {
  const lowerName = name.toLowerCase()
  const headers = response.headers as Record<string, string | undefined>
  return headers[lowerName] ?? headers[name]
}

function updateSessionCookies (session: Session, response: FetchResponse): void {
  session.auth.cookieHeader = mergeCookieHeaders(session.auth.cookieHeader, getHeaderValue(response, 'set-cookie'))
  session.auth.updatedAt = new Date().toISOString()
}

function updateLoginFlowCookies (session: LoginFlowSession, response: FetchResponse): void {
  session.cookieHeader = mergeCookieHeaders(session.cookieHeader, getHeaderValue(response, 'set-cookie'))
}

function resolveRedirectUrl (location: string, base: string): string {
  return new URL(location, base).toString()
}

function decodeHtmlEntities (value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function getTextBody (response: FetchResponse): string {
  return typeof response.body === 'string' ? response.body : ''
}

function parseJsonBody (response: FetchResponse): unknown {
  const body = getTextBody(response)
  if (body === '') {
    return undefined
  }
  try {
    return JSON.parse(body)
  } catch (e) {
    return undefined
  }
}

function extractFormAction (html: string): string | undefined {
  const formMatch = /<form\b[^>]*\baction=["']([^"']+)["'][^>]*>/i.exec(html)
  return formMatch == null ? undefined : decodeHtmlEntities(formMatch[1])
}

function extractHiddenFormFields (html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const inputRegex = /<input\b[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = inputRegex.exec(html)) != null) {
    const input = match[0]
    if (!/\btype=["']hidden["']/i.test(input)) {
      continue
    }
    const name = /\bname=["']([^"']+)["']/i.exec(input)?.[1]
    if (name == null || name === '') {
      continue
    }
    const value = /\bvalue=["']([^"']*)["']/i.exec(input)?.[1] ?? ''
    fields[decodeHtmlEntities(name)] = decodeHtmlEntities(value)
  }
  return fields
}

function findOtpFieldName (html: string): string | undefined {
  const candidates = ['otp', 'code', 'smsCode', 'sms_code', 'totp', 'token', 'verificationCode', 'verify_code']
  for (const candidate of candidates) {
    const pattern = new RegExp(`<input\\b[^>]*\\bname=["']${candidate}["'][^>]*>`, 'i')
    if (pattern.test(html)) {
      return candidate
    }
  }
  const namedInput = /<input\b[^>]*\bname=["']([^"']*(?:otp|code|sms|totp|token)[^"']*)["'][^>]*>/i.exec(html)
  return namedInput == null ? undefined : decodeHtmlEntities(namedInput[1])
}

function assertNoLoginError (html: string): void {
  if (/Неверно указан логин\/пароль|invalid username|invalid password|wrong login|wrong password/i.test(html)) {
    throw new InvalidLoginOrPasswordError('Неверный логин или пароль')
  }
}

async function fetchWithLoginCookies (url: string, session: LoginFlowSession, options: {
  method?: string
  headers?: Record<string, string>
  body?: string
  log?: boolean
} = {}): Promise<FetchResponse> {
  const response = await fetch(url, {
    method: options.method,
    redirect: 'manual',
    headers: {
      ...options.headers,
      ...(session.cookieHeader === '' ? undefined : { Cookie: session.cookieHeader })
    },
    body: options.body,
    log: options.log,
    sanitizeRequestLog: {
      headers: {
        Cookie: true,
        cookie: true
      },
      body: {
        username: true,
        password: true,
        otp: true,
        code: true,
        smsCode: true,
        token: true
      }
    },
    sanitizeResponseLog: {
      headers: {
        'set-cookie': true
      },
      body: true
    }
  })
  updateLoginFlowCookies(session, response)
  return response
}

async function fetchFollowingLoginRedirects (url: string, session: LoginFlowSession, options: {
  method?: string
  headers?: Record<string, string>
  body?: string
  log?: boolean
} = {}): Promise<FetchResponse> {
  let currentUrl = url
  let currentOptions = options
  let response = await fetchWithLoginCookies(currentUrl, session, currentOptions)
  for (let i = 0; i < maxAuthRedirects; i++) {
    if (response.status < 300 || response.status >= 400) {
      return response
    }
    const location = getHeaderValue(response, 'location')
    if (location == null || location === '') {
      return response
    }
    currentUrl = resolveRedirectUrl(location, currentUrl)
    currentOptions = { method: 'GET', log: options.log }
    response = await fetchWithLoginCookies(currentUrl, session, currentOptions)
  }
  throw new TemporaryUnavailableError()
}

async function submitLoginForm (url: string, session: LoginFlowSession, params: Record<string, string>): Promise<FetchResponse> {
  return await fetchFollowingLoginRedirects(url, session, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: bankBaseUrl,
      Referer: url,
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'
    },
    body: formBody(params)
  })
}

async function completeLoginFlow (response: FetchResponse, session: LoginFlowSession): Promise<Auth> {
  for (let i = 0; i < 4; i++) {
    const html = getTextBody(response)
    assertNoLoginError(html)
    const otpFieldName = findOtpFieldName(html)
    if (otpFieldName == null) {
      if (session.cookieHeader === '') {
        throw new TemporaryUnavailableError()
      }
      return {
        cookieHeader: session.cookieHeader,
        updatedAt: new Date().toISOString()
      }
    }
    const action = extractFormAction(html)
    if (action == null) {
      throw new TemporaryUnavailableError()
    }
    const otpCode = await ZenMoney.readLine('Введите код из SMS/Push для входа в ПСКБ', { inputType: 'number' })
    if (otpCode == null || otpCode.trim() === '') {
      throw new InvalidOtpCodeError()
    }
    response = await submitLoginForm(action, session, {
      ...extractHiddenFormFields(html),
      [otpFieldName]: otpCode.trim()
    })
  }
  throw new TemporaryUnavailableError()
}

function assertResponseSuccess (body: unknown): void {
  const result = getOptNumber(body, 'response.result')
  if (result == null) {
    throw new TemporaryUnavailableError()
  }
  if (result !== 0) {
    const message = getOptString(body, 'response.message') ?? getOptString(body, 'response.object.message') ?? 'Primsocbank API returned result ' + String(result)
    if (isAuthErrorMessage(message)) {
      throw new TemporaryUnavailableError()
    }
    throw new TemporaryError(message)
  }
}

function getResponseObject (response: FetchResponse): unknown {
  if (response.status === 401 || response.status === 403) {
    throw new TemporaryUnavailableError()
  }
  assertResponseSuccess(response.body)
  return response.body == null || typeof response.body !== 'object' ? undefined : (response.body as { response?: { object?: unknown } }).response?.object
}

function isAuthErrorMessage (message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return ['auth', 'login', 'session', 'unauthor', 'авториз', 'сесси'].some(value => lowerMessage.includes(value))
}

export async function fetchMobileJson (endpoint: string, session: Session, params: Record<string, string>): Promise<FetchResponse> {
  if (session.auth.cookieHeader === '') {
    throw new TemporaryUnavailableError()
  }
  const response = await fetch(`${mobileJsonUrl}/${endpoint}`, {
    method: 'POST',
    stringify: (body: unknown): string => String(body),
    parse: (body: string): unknown => {
      if (body === '') {
        return undefined
      }
      try {
        return JSON.parse(body)
      } catch (e) {
        return undefined
      }
    },
    headers: {
      ...defaultHeaders,
      Cookie: session.auth.cookieHeader
    },
    body: formBody(params),
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
  updateSessionCookies(session, response)
  return response
}

async function fetchPublicMobileJson (endpoint: string, params: Record<string, string>): Promise<FetchResponse> {
  const response = await fetch(`${mobileJsonUrl}/${endpoint}`, {
    method: 'POST',
    stringify: (body: unknown): string => String(body),
    parse: (body: string): unknown => body === '' ? undefined : JSON.parse(body),
    headers: defaultHeaders,
    body: formBody(params),
    sanitizeResponseLog: {
      headers: {
        'set-cookie': true
      }
    }
  })
  return response
}

export async function fetchLoginInfo (requestId: string): Promise<unknown> {
  const response = await fetchPublicMobileJson('loginInfo', {
    locale: 'ru',
    reqId: requestId
  })
  return response.body
}

export async function fetchLoginRedirect (): Promise<LoginRedirect> {
  const response = await fetchPublicMobileJson('loginInfo', {
    locale: 'ru',
    reqId: makeRequestId()
  })
  const redirectUrl = getOptString(response.body, 'object.redirectUrl')
  if (redirectUrl == null || redirectUrl === '') {
    throw new TemporaryUnavailableError()
  }
  const headers = response.headers as Record<string, string | undefined>
  return {
    redirectUrl,
    cookieHeader: mergeCookieHeaders('', headers['set-cookie'])
  }
}

function validatePreferences (preferences: Preferences): void {
  if (preferences.login == null || preferences.login.trim() === '') {
    throw new InvalidPreferencesError('Укажите логин или телефон Примсоцбанка')
  }
  if (preferences.password == null || preferences.password === '') {
    throw new InvalidPreferencesError('Укажите пароль от интернет-банка Примсоцбанка')
  }
}

export async function fetchAuthorization (preferences: Preferences): Promise<Auth> {
  validatePreferences(preferences)
  const loginFlowSession: LoginFlowSession = { cookieHeader: '' }

  const loginInfoResponse = await fetchFollowingLoginRedirects(`${mobileJsonUrl}/loginInfo`, loginFlowSession, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'X-Login-Script-Request': 'true'
    },
    body: formBody({
      locale: 'ru',
      reqId: makeRequestId()
    })
  })
  const redirectUrl = getOptString(parseJsonBody(loginInfoResponse), 'object.redirectUrl')
  if (redirectUrl == null || redirectUrl === '') {
    throw new TemporaryUnavailableError()
  }

  const loginPageResponse = await fetchFollowingLoginRedirects(redirectUrl, loginFlowSession, {
    method: 'GET'
  })
  const loginPage = getTextBody(loginPageResponse)
  const action = extractFormAction(loginPage)
  if (action == null || action === '') {
    throw new TemporaryUnavailableError()
  }

  const response = await submitLoginForm(action, loginFlowSession, {
    ...extractHiddenFormFields(loginPage),
    username: preferences.login.trim(),
    password: preferences.password,
    fsitecode: 'primsoc',
    login: 'Войти'
  })
  const auth = await completeLoginFlow(response, loginFlowSession)
  return auth
}

export async function fetchAllProducts (session: Session): Promise<unknown[]> {
  const response = await fetchMobileJson('getMyFinancesPage', session, {
    bankId,
    locale: 'en',
    reqId: makeRequestId()
  })
  const object = getResponseObject(response)
  return [
    ...getArray(object, 'accounts.accounts'),
    ...(getOptArray(object, 'accounts.b2pCards') ?? []),
    ...(getOptArray(object, 'accounts.savingAccounts') ?? []),
    ...(getOptArray(object, 'loanList.loans') ?? [])
  ]
}

export async function fetchProductTransactions (session: Session, product: Product, fromDate: Date, toDate: Date): Promise<unknown[]> {
  if (session.auth.cookieHeader === '' || product.kind === undefined || product.kind === ProductKind.unsupported) {
    throw new TemporaryUnavailableError()
  }
  if (product.kind === ProductKind.loan || fromDate.getTime() > toDate.getTime()) {
    return []
  }
  const operationHistory: unknown[] = []
  let lastOperationId: string | undefined
  const seenOperationIds = new Set<string>()

  for (let page = 0; page < 100; page++) {
    const params: Record<string, string> = {
      countForPage: pageSize.toString(),
      bankId,
      product: `AC_${product.accountId}`,
      from: formatDate(fromDate),
      to: formatDate(toDate),
      locale: 'en',
      reqId: makeRequestId()
    }
    if (lastOperationId != null) {
      params.lastOperationId = lastOperationId
    }
    const response = await fetchMobileJson('pfmTape', session, params)
    const operations = getArray(getResponseObject(response), 'operations')
    const pageOperations = operations.length >= pageSize ? operations.slice(0, visiblePageSize) : operations
    let addedOperations = 0
    for (const operation of pageOperations) {
      const id = getOptString(operation, 'id') ?? String(getNumber(operation, 'id'))
      if (!seenOperationIds.has(id)) {
        seenOperationIds.add(id)
        operationHistory.push(operation)
        addedOperations++
      }
    }
    if (operations.length < pageSize || pageOperations.length === 0 || addedOperations === 0) {
      break
    }
    lastOperationId = getOptString(pageOperations[pageOperations.length - 1], 'id') ?? String(getNumber(pageOperations[pageOperations.length - 1], 'id'))
  }
  return operationHistory
}
