import cheerio from 'cheerio'
import { stringify } from 'querystring'
import { fetch, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../errors'
import { Auth, CardAccountRow, CardTransactionRow, ParsedAccountRow, Preferences, Session } from './models'

const BASE_URL = 'https://www.bankonline.ge'
const LOGIN_PAGE_PATH = '/Login.aspx'
const BALANCE_PAGE_PATH = '/Balance.aspx'
const CARD_PAGE_PATH = '/Products/Cards/Default.aspx'
const LOGIN_EVENT_TARGET = 'ctl00$ContentPlaceHolder1$LoginLBTN'
const LOGIN_FIELD = 'ctl00$ContentPlaceHolder1$UTXT'
const PASSWORD_FIELD = 'ctl00$ContentPlaceHolder1$PTXT'
const OTP_FIELD = 'ctl00$ContentPlaceHolder1$OptCodeTxt'
const TRUST_FIRST_CONFIRM_FIELD = 'ctl00$Content$ctl03'
const TRUST_OTP_FIELD = 'ctl00$Content$TrustedDeviceOTP$TxtOtpCode'
const TRUST_SECOND_CONFIRM_FIELD = 'ctl00$Content$ctl06'
const DEFAULT_PAGE_SIZE_GUESS = 20
const MAX_TRANSACTION_PAGES = 120
const OTP_TIMEOUT_MS = 180000
const AUTH_EXPIRY_SKEW_MS = 5 * 60 * 1000

const balancePageCache = new WeakMap<Session, string>()

type AuthFailureKind =
  | 'balance-login-form'
  | 'cardmodule-status'
  | 'cardmodule-login-form'
  | 'dead-session'

interface CookieShape {
  name?: unknown
  expires?: unknown
  expiry?: unknown
  expirationDate?: unknown
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  path: string
  form?: Record<string, string>
  headers?: Record<string, string>
  refererPath?: string
  accept?: string
  redirect?: 'follow' | 'manual'
  sanitizeBodyKeys?: string[]
}

interface UserTransactionsResponse {
  booked: CardTransactionRow[]
  pending: CardTransactionRow[]
}

class BasisbankAuthError extends TemporaryError {
  readonly kind: AuthFailureKind

  constructor (kind: AuthFailureKind, message: string) {
    super(message)
    this.kind = kind
  }
}

function parseBooleanPreference (value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false
    }
  }
  return fallback
}

function isNonEmptyString (value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function normalizeStoredDeviceId (value: unknown): string | undefined {
  if (!isNonEmptyString(value)) {
    return undefined
  }
  return value.trim()
}

function generateDeviceId (): string {
  const alphabet = '0123456789abcdef'
  let hex = ''
  for (let i = 0; i < 32; i++) {
    hex += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function isBasisbankAuthError (error: unknown): error is BasisbankAuthError {
  return error instanceof BasisbankAuthError
}

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseCookieExpiryMs (value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Browser cookies may store seconds since epoch.
    return value > 1e12 ? value : value * 1000
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function getCookieExpiryMs (cookie: unknown): number | undefined {
  if (!isRecord(cookie)) {
    return undefined
  }
  const typed = cookie as CookieShape
  return parseCookieExpiryMs(typed.expires) ??
    parseCookieExpiryMs(typed.expiry) ??
    parseCookieExpiryMs(typed.expirationDate)
}

function collectAuthExpiryMetadata (cookies: unknown[]): { trustedDeviceExpiresAt?: number, sessionExpiresAt?: number } {
  const now = Date.now()
  const authExpiryCandidates: number[] = []
  let trustedDeviceExpiresAt: number | undefined

  for (const cookie of cookies) {
    if (!isRecord(cookie)) {
      continue
    }
    const name = isNonEmptyString(cookie.name) ? cookie.name.trim() : ''
    const expiresAt = getCookieExpiryMs(cookie)
    if (expiresAt == null || expiresAt <= now) {
      continue
    }

    if (/^TrustedDeviceToken$/i.test(name)) {
      trustedDeviceExpiresAt = expiresAt
    }

    if (/(session|auth|token)/i.test(name)) {
      authExpiryCandidates.push(expiresAt)
    }
  }

  return {
    trustedDeviceExpiresAt,
    sessionExpiresAt: authExpiryCandidates.length > 0 ? Math.min(...authExpiryCandidates) : undefined
  }
}

function getKnownAuthExpiryMs (auth: Auth): number | undefined {
  const candidates = [auth.sessionExpiresAt, auth.trustedDeviceExpiresAt]
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (candidates.length === 0) {
    return undefined
  }
  return Math.min(...candidates)
}

function isAuthExpiryReached (auth: Auth): boolean {
  const expiresAt = getKnownAuthExpiryMs(auth)
  return expiresAt != null && Date.now() >= expiresAt - AUTH_EXPIRY_SKEW_MS
}

function getStringProp (source: unknown, key: string): string | undefined {
  if (!isRecord(source)) {
    return undefined
  }
  const value = source[key]
  return typeof value === 'string' ? value : undefined
}

function normalizeWhitespace (value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeUrlPath (path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function getHeader (response: FetchResponse, name: string): string | undefined {
  const headers = response.headers
  if (headers == null) {
    return undefined
  }

  const normalizedName = name.toLowerCase()
  if (isRecord(headers)) {
    const direct = headers[name] ?? headers[normalizedName]
    if (typeof direct === 'string') {
      return direct
    }
  }

  const withGet = headers as { get?: (headerName: string) => string | null }
  if (typeof withGet.get === 'function') {
    const value = withGet.get(name) ?? withGet.get(normalizedName)
    if (value != null && value !== '') {
      return value
    }
  }

  return undefined
}

function asStringBody (response: FetchResponse): string {
  if (typeof response.body === 'string') {
    return response.body
  }
  if (response.body == null) {
    return ''
  }
  return String(response.body)
}

function parseJsonBody (response: FetchResponse, context: string): unknown {
  if (isRecord(response.body) || Array.isArray(response.body)) {
    return response.body
  }

  const bodyText = asStringBody(response).trim()
  if (bodyText === '') {
    return null
  }

  try {
    return JSON.parse(bodyText)
  } catch (error) {
    if (bodyText.startsWith('<')) {
      throw new TemporaryError(`${context}: expected JSON response, received HTML`)
    }
    return bodyText
  }
}

function parseNumber (value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const compact = value
      .replace(/\u00a0/g, '')
      .replace(/\s/g, '')
      .replace(/[^\d,().+-]/g, '')

    if (compact === '') {
      return null
    }

    let normalized = compact
    const wrappedInBrackets = normalized.startsWith('(') && normalized.endsWith(')')
    if (wrappedInBrackets) {
      normalized = `-${normalized.slice(1, -1)}`
    }

    const commaIndex = normalized.lastIndexOf(',')
    const dotIndex = normalized.lastIndexOf('.')
    normalized = commaIndex > dotIndex
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '')

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function formatCardDate (date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function getMaskedBodyKeys (baseKeys: string[], form: Record<string, string> | undefined): string[] {
  const masked = [...baseKeys]
  if (form != null) {
    for (const key of Object.keys(form)) {
      if (/password|ptxt|otpcodetxt|otp|session|cookie|login|utxt/i.test(key)) {
        masked.push(key)
      }
    }
  }
  return [...new Set(masked)]
}

async function request (options: RequestOptions): Promise<FetchResponse> {
  const url = normalizeUrlPath(options.path)
  const headers: Record<string, string> = {
    Accept: options.accept ?? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...options.headers
  }

  if (options.refererPath != null) {
    headers.Referer = normalizeUrlPath(options.refererPath)
  }

  const fetchOptions: FetchOptions = {
    method: options.method ?? 'GET',
    headers,
    redirect: options.redirect,
    sanitizeRequestLog: {
      headers: { Cookie: true },
      ...options.form != null
        ? { body: Object.fromEntries(getMaskedBodyKeys(options.sanitizeBodyKeys ?? [], options.form).map(key => [key, true])) }
        : {}
    },
    sanitizeResponseLog: {
      headers: {
        'set-cookie': true
      }
    }
  }

  if (options.form != null) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
    fetchOptions.body = options.form
    fetchOptions.stringify = (body: unknown): string => stringify(body as Record<string, string>)
  }

  return await fetch(url, fetchOptions)
}

function extractFormFields (html: string): Record<string, string> {
  const $ = cheerio.load(html)
  const fields: Record<string, string> = {}

  $('input[name]').each((_, element) => {
    const input = $(element)
    const name = input.attr('name')
    if (name == null || name === '') {
      return
    }

    const type = (input.attr('type') ?? 'text').toLowerCase()
    if ((type === 'checkbox' || type === 'radio') && input.attr('checked') == null) {
      return
    }

    fields[name] = input.attr('value') ?? ''
  })

  $('select[name]').each((_, element) => {
    const select = $(element)
    const name = select.attr('name')
    if (name == null || name === '') {
      return
    }

    const selected = select.find('option[selected]').first().attr('value')
    const fallback = select.find('option').first().attr('value')
    fields[name] = selected ?? fallback ?? ''
  })

  $('textarea[name]').each((_, element) => {
    const textarea = $(element)
    const name = textarea.attr('name')
    if (name == null || name === '') {
      return
    }
    fields[name] = textarea.text() ?? ''
  })

  return fields
}

function fillDeviceInfoFields (session: Session, fields: Record<string, string>): void {
  const browserType = 'Chrome'
  const browserVersion = ZenMoney.application?.version != null && ZenMoney.application.version !== ''
    ? ZenMoney.application.version
    : '1.0'
  const platformType = ZenMoney.device?.os?.name != null && ZenMoney.device.os.name !== ''
    ? ZenMoney.device.os.name
    : 'Unknown'
  const platformVersion = ZenMoney.device?.os?.version != null && ZenMoney.device.os.version !== ''
    ? ZenMoney.device.os.version
    : '0'
  const threadCount = '8'
  const gpuInfo = `${ZenMoney.device?.manufacturer ?? 'ZenMoney'} ${ZenMoney.device?.model ?? 'Device'}`
  const stableDeviceId = session.deviceId

  for (const key of Object.keys(fields)) {
    if (/deviceInfoBrowserType$/i.test(key) && fields[key] === '') {
      fields[key] = browserType
    }
    if (/deviceInfoBrowserVersion$/i.test(key) && fields[key] === '') {
      fields[key] = browserVersion
    }
    if (/deviceInfoPlatformType$/i.test(key) && fields[key] === '') {
      fields[key] = platformType
    }
    if (/deviceInfoPlatformVersion$/i.test(key) && fields[key] === '') {
      fields[key] = platformVersion
    }
    if (/deviceInfoThreadCount$/i.test(key) && fields[key] === '') {
      fields[key] = threadCount
    }
    if (/deviceInfoGPUInfo$/i.test(key) && fields[key] === '') {
      fields[key] = gpuInfo
    }
    // BankOnline can bind trust/auth checks to client fingerprint fields.
    if (/(device.*(id|uuid|guid|fingerprint)|fingerprint.*device)/i.test(key) && fields[key] === '') {
      fields[key] = stableDeviceId
    }
  }
}

function containsLoginForm (html: string): boolean {
  return html.includes('id="UTXT"') && html.includes('id="PTXT"')
}

function isOtpRequiredPage (html: string): boolean {
  const $ = cheerio.load(html)
  const otpPanel = $('#ContentPlaceHolder1_OTPP')
  if (otpPanel.length === 0) {
    return false
  }

  const classes = otpPanel.attr('class') ?? ''
  if (!classes.split(/\s+/).includes('hidden')) {
    return true
  }

  const otpBoxFieldClasses = $('#ContentPlaceHolder1_OTPBoXFieldP').attr('class') ?? ''
  if (/\blast\b/i.test(otpBoxFieldClasses) || /\bfilled\b/i.test(otpBoxFieldClasses)) {
    return true
  }

  const safetyHeading = normalizeWhitespace($('#ContentPlaceHolder1_SafetyHeading').text()).toLowerCase()
  if (safetyHeading.includes('additional security') || safetyHeading.includes('დამატებითი უსაფრთხოება')) {
    return true
  }

  return false
}

function extractLoginError (html: string): string | undefined {
  const $ = cheerio.load(html)
  const candidates = [
    normalizeWhitespace($('#errorfield').text()),
    normalizeWhitespace($('#ContentPlaceHolder1_errorfield').text()),
    normalizeWhitespace($('.errorfield').text()),
    normalizeWhitespace($('.validation-summary-errors').text())
  ].filter(text => text !== '')

  return candidates[0]
}

async function callToolkitSessionId (type: 'Login' | 'DeviceBinding'): Promise<void> {
  const response = await request({
    method: 'POST',
    path: `/Handlers/BToolkit.ashx?Action=GetSessionId&Type=${type}`,
    headers: {
      'Content-Type': 'text/plain'
    },
    accept: 'application/json, text/plain, */*',
    refererPath: type === 'Login' ? LOGIN_PAGE_PATH : BALANCE_PAGE_PATH
  })

  if (response.status < 200 || response.status >= 300) {
    console.warn(`[basisbank] BToolkit session init (${type}) returned ${response.status}`)
  }
}

async function requestSmsCode (refererPath: string): Promise<void> {
  const response = await request({
    method: 'POST',
    path: '/Handlers/SendSms.ashx?Module=BankOnlineTransfer',
    headers: {
      'Content-Type': 'text/plain'
    },
    accept: 'application/json, text/plain, */*',
    refererPath
  })

  if (response.status < 200 || response.status >= 300) {
    throw new TemporaryError(`Could not request BasisBank SMS code (${response.status})`)
  }
}

async function readOtpCode (prompt: string): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const code = await Promise.race<string | null>([
    ZenMoney.readLine(prompt, {
      inputType: 'number',
      time: OTP_TIMEOUT_MS
    }),
    new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), OTP_TIMEOUT_MS)
    })
  ])
  if (timeoutId != null) {
    clearTimeout(timeoutId)
  }

  if (code == null || code.trim() === '') {
    throw new InvalidOtpCodeError('BasisBank OTP code was not provided in time')
  }

  return code.trim()
}

async function fetchLoginRedirectPage (location: string): Promise<string> {
  const redirected = await request({
    method: 'GET',
    path: location,
    refererPath: LOGIN_PAGE_PATH,
    redirect: 'manual'
  })

  const redirectedLocation = getHeader(redirected, 'Location')
  if (redirected.status === 302 && redirectedLocation != null) {
    const secondRedirected = await request({
      method: 'GET',
      path: redirectedLocation,
      refererPath: LOGIN_PAGE_PATH
    })
    return asStringBody(secondRedirected)
  }

  return asStringBody(redirected)
}

function buildLoginForm (formFields: Record<string, string>, login: string, password: string, otpCode?: string): Record<string, string> {
  const payload = { ...formFields }
  payload.__EVENTTARGET = LOGIN_EVENT_TARGET
  payload.__EVENTARGUMENT = ''
  payload[LOGIN_FIELD] = login
  payload[PASSWORD_FIELD] = password
  payload[OTP_FIELD] = otpCode ?? ''
  return payload
}

async function submitLoginForm (
  formFields: Record<string, string>,
  login: string,
  password: string,
  otpCode?: string
): Promise<{ response: FetchResponse, html: string, location?: string }> {
  const payload = buildLoginForm(formFields, login, password, otpCode)
  const response = await request({
    method: 'POST',
    path: LOGIN_PAGE_PATH,
    form: payload,
    redirect: 'manual',
    refererPath: LOGIN_PAGE_PATH,
    sanitizeBodyKeys: [LOGIN_FIELD, PASSWORD_FIELD, OTP_FIELD]
  })

  return {
    response,
    html: asStringBody(response),
    location: getHeader(response, 'Location')
  }
}

async function fetchBalancePage (): Promise<string> {
  const response = await request({
    method: 'GET',
    path: BALANCE_PAGE_PATH,
    refererPath: LOGIN_PAGE_PATH,
    redirect: 'manual'
  })

  const location = getHeader(response, 'Location')
  if (response.status === 302 && location != null) {
    if (/\/Login\.aspx/i.test(location)) {
      throw new BasisbankAuthError('balance-login-form', 'BasisBank web session is not authorized')
    }
    const redirected = await request({
      method: 'GET',
      path: location,
      refererPath: BALANCE_PAGE_PATH
    })
    const html = asStringBody(redirected)
    if (containsLoginForm(html)) {
      throw new BasisbankAuthError('balance-login-form', 'BasisBank web session is not authorized')
    }
    return html
  }

  if ([401, 403, 440].includes(response.status)) {
    throw new BasisbankAuthError('balance-login-form', `Could not authorize BasisBank balance page (${response.status})`)
  }

  if (response.status < 200 || response.status >= 300) {
    throw new TemporaryError(`Could not open BasisBank balance page (${response.status})`)
  }

  const html = asStringBody(response)
  if (containsLoginForm(html)) {
    throw new BasisbankAuthError('balance-login-form', 'BasisBank web session is not authorized')
  }

  return html
}

async function ensureTrustedDevice (session: Session, balanceHtml: string): Promise<string> {
  if (!session.trustDevice) {
    return balanceHtml
  }

  if (!balanceHtml.includes('TrustedDevice') && !balanceHtml.includes(TRUST_FIRST_CONFIRM_FIELD)) {
    return balanceHtml
  }

  const firstFields = extractFormFields(balanceHtml)
  fillDeviceInfoFields(session, firstFields)

  if (!(TRUST_FIRST_CONFIRM_FIELD in firstFields)) {
    return balanceHtml
  }

  try {
    await callToolkitSessionId('DeviceBinding')
  } catch (error) {
    console.warn('[basisbank] trusted-device toolkit call failed', error)
  }

  firstFields[TRUST_FIRST_CONFIRM_FIELD] = 'Yes'

  const firstResponse = await request({
    method: 'POST',
    path: BALANCE_PAGE_PATH,
    form: firstFields,
    refererPath: BALANCE_PAGE_PATH,
    sanitizeBodyKeys: [TRUST_FIRST_CONFIRM_FIELD]
  })

  if (firstResponse.status < 200 || firstResponse.status >= 300) {
    throw new TemporaryError(`BasisBank trusted-device step 1 failed (${firstResponse.status})`)
  }

  const secondHtml = asStringBody(firstResponse)
  const secondFields = extractFormFields(secondHtml)
  fillDeviceInfoFields(session, secondFields)

  const otpFieldName = Object.keys(secondFields).find(key => /TrustedDeviceOTP\$TxtOtpCode$/i.test(key)) ?? TRUST_OTP_FIELD
  const confirmFieldName = Object.keys(secondFields).find(key => /\$ctl06$/i.test(key)) ?? TRUST_SECOND_CONFIRM_FIELD

  if (!(otpFieldName in secondFields) || !(confirmFieldName in secondFields)) {
    return secondHtml
  }

  if (session.requestSmsCode) {
    await requestSmsCode(BALANCE_PAGE_PATH)
  }

  const otp = await readOtpCode('Enter BasisBank trusted-device confirmation code')
  secondFields[otpFieldName] = otp
  secondFields[confirmFieldName] = 'Yes'

  const finalResponse = await request({
    method: 'POST',
    path: BALANCE_PAGE_PATH,
    form: secondFields,
    refererPath: BALANCE_PAGE_PATH,
    sanitizeBodyKeys: [otpFieldName]
  })

  if (finalResponse.status < 200 || finalResponse.status >= 300) {
    throw new TemporaryError(`BasisBank trusted-device step 2 failed (${finalResponse.status})`)
  }

  return asStringBody(finalResponse)
}

async function loginWithOtpFlow (session: Session): Promise<string> {
  const loginPage = await request({ method: 'GET', path: LOGIN_PAGE_PATH, refererPath: LOGIN_PAGE_PATH })
  if (loginPage.status < 200 || loginPage.status >= 300) {
    throw new TemporaryError(`Could not open BasisBank login page (${loginPage.status})`)
  }

  const initialHtml = asStringBody(loginPage)
  const initialFields = extractFormFields(initialHtml)
  fillDeviceInfoFields(session, initialFields)

  try {
    await callToolkitSessionId('Login')
  } catch (error) {
    console.warn('[basisbank] login toolkit call failed', error)
  }

  const firstAttempt = await submitLoginForm(initialFields, session.login, session.password)
  const firstLocation = firstAttempt.location ?? ''
  let firstAttemptHtml = firstAttempt.html

  if (firstAttempt.response.status === 302 && /\/Balance\.aspx/i.test(firstLocation)) {
    let balanceHtml = await fetchBalancePage()
    balanceHtml = await ensureTrustedDevice(session, balanceHtml)
    await ZenMoney.saveCookies()
    return balanceHtml
  }

  if (firstAttempt.response.status === 302 && /\/Login\.aspx/i.test(firstLocation)) {
    firstAttemptHtml = await fetchLoginRedirectPage(firstLocation)
  }

  if (!isOtpRequiredPage(firstAttemptHtml)) {
    const explicitError = extractLoginError(firstAttemptHtml)
    const fallback = explicitError ?? 'BasisBank login failed. Verify login/password and OTP requirements.'
    throw new InvalidLoginOrPasswordError(fallback)
  }

  if (session.requestSmsCode) {
    await requestSmsCode(LOGIN_PAGE_PATH)
  }

  const otpCode = await readOtpCode('Enter BasisBank one-time code')
  const otpFields = extractFormFields(firstAttemptHtml)
  fillDeviceInfoFields(session, otpFields)

  const secondAttempt = await submitLoginForm(otpFields, session.login, session.password, otpCode)
  const secondLocation = secondAttempt.location ?? ''

  if (secondAttempt.response.status !== 302 || !/\/(Balance|Info)\.aspx/i.test(secondLocation)) {
    throw new InvalidOtpCodeError('BasisBank did not accept OTP code')
  }

  if (/\/Info\.aspx/i.test(secondLocation)) {
    throw new InvalidOtpCodeError('BasisBank rejected OTP code or requires repeated confirmation')
  }

  let balanceHtml = await fetchBalancePage()
  balanceHtml = await ensureTrustedDevice(session, balanceHtml)
  await ZenMoney.saveCookies()
  return balanceHtml
}

async function clearCookieState (): Promise<void> {
  try {
    await ZenMoney.clearCookies()
  } catch (error) {
    console.warn('[basisbank] could not clear cookie storage', error)
  }
}

async function refreshAuthExpiryMetadata (session: Session): Promise<void> {
  try {
    const cookies = await ZenMoney.getCookies()
    if (!Array.isArray(cookies)) {
      return
    }
    const metadata = collectAuthExpiryMetadata(cookies)
    session.auth.sessionExpiresAt = metadata.sessionExpiresAt
    session.auth.trustedDeviceExpiresAt = metadata.trustedDeviceExpiresAt
  } catch (error) {
    console.warn('[basisbank] could not read cookie expiry metadata', error)
  }
}

async function markSessionAuthorized (session: Session, balanceHtml: string): Promise<string> {
  balancePageCache.set(session, balanceHtml)
  session.auth.login = session.login
  session.auth.deviceId = session.deviceId
  session.auth.lastSuccessfulLoginAt = Date.now()
  await refreshAuthExpiryMetadata(session)
  return balanceHtml
}

async function resetSessionState (session: Session): Promise<void> {
  await clearCookieState()
  balancePageCache.delete(session)
  session.auth.lastSuccessfulLoginAt = undefined
  session.auth.sessionExpiresAt = undefined
  session.auth.trustedDeviceExpiresAt = undefined
}

function parsePossibleJsonContainer (value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }
  const text = value.trim()
  if (text === '' || !(text.startsWith('{') || text.startsWith('['))) {
    return value
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    return value
  }
}

function extractArrayPayloadWithShape (payload: unknown): { rows: unknown[], recognized: boolean } {
  payload = parsePossibleJsonContainer(payload)
  if (Array.isArray(payload)) {
    return { rows: payload, recognized: true }
  }

  if (!isRecord(payload)) {
    return { rows: [], recognized: false }
  }

  for (const key of ['d', 'data', 'Data', 'result', 'Result', 'items', 'Items', 'List']) {
    if (!(key in payload)) {
      continue
    }
    const value = parsePossibleJsonContainer(payload[key])
    if (Array.isArray(value)) {
      return { rows: value, recognized: true }
    }
    if (isRecord(value)) {
      for (const nestedKey of ['items', 'Items', 'rows', 'Rows', 'transactions', 'Transactions']) {
        if (!(nestedKey in value)) {
          continue
        }
        const nested = parsePossibleJsonContainer(value[nestedKey])
        if (Array.isArray(nested)) {
          return { rows: nested, recognized: true }
        }
      }
    }
  }

  return { rows: [], recognized: false }
}

function extractArrayPayload (payload: unknown): unknown[] {
  return extractArrayPayloadWithShape(payload).rows
}

function isDeadSessionPayload (payload: unknown): boolean {
  if (typeof payload === 'string') {
    return /DeadSession/i.test(payload)
  }

  if (!isRecord(payload)) {
    return false
  }

  const status = getStringProp(payload, 'Status') ?? getStringProp(payload, 'status')
  if (status != null && /DeadSession/i.test(status)) {
    return true
  }

  const nested = payload.d
  return typeof nested === 'string' && /DeadSession/i.test(nested)
}

async function callCardModule (funq: string, form: Record<string, string>): Promise<unknown> {
  const response = await request({
    method: 'POST',
    path: `/Handlers/CardModule.ashx?funq=${encodeURIComponent(funq)}`,
    form,
    accept: 'application/json, text/javascript, */*; q=0.01',
    refererPath: CARD_PAGE_PATH,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  })

  if ([401, 403, 440].includes(response.status)) {
    throw new BasisbankAuthError('cardmodule-status', `CardModule auth required (${funq}, ${response.status})`)
  }

  if (response.status < 200 || response.status >= 300) {
    throw new TemporaryError(`CardModule request failed (${funq}, ${response.status})`)
  }

  const bodyText = asStringBody(response).trim()
  if (bodyText.startsWith('<') && containsLoginForm(bodyText)) {
    throw new BasisbankAuthError('cardmodule-login-form', `CardModule session is not authorized (${funq})`)
  }

  return parseJsonBody(response, `CardModule:${funq}`)
}

async function callCardModuleWithSessionRetry (
  session: Session,
  funq: string,
  form: Record<string, string>,
  context: string
): Promise<unknown> {
  let shouldRetry = false
  let retryReason = 'dead-session'

  try {
    const payload = await callCardModule(funq, form)
    if (!isDeadSessionPayload(payload)) {
      return payload
    }
    shouldRetry = true
  } catch (error) {
    if (!isBasisbankAuthError(error)) {
      throw error
    }
    shouldRetry = true
    retryReason = error.kind
  }

  if (!shouldRetry) {
    throw new TemporaryError(`BasisBank web session expired while ${context}`)
  }

  console.warn(`[basisbank] auth recovery triggered while ${context} (${retryReason}); retrying after re-auth`)
  await authorizeIfNeeded(session, { forceReauth: true })

  try {
    const retriedPayload = await callCardModule(funq, form)
    if (isDeadSessionPayload(retriedPayload)) {
      throw new BasisbankAuthError('dead-session', `CardModule session expired (${funq})`)
    }
    return retriedPayload
  } catch (error) {
    if (isBasisbankAuthError(error)) {
      throw new TemporaryError(`BasisBank web session expired while ${context} (after re-auth)`)
    }
    throw error
  }
}

async function checkCardSessionAlive (): Promise<boolean> {
  try {
    const payload = await callCardModule('checksession', {})
    return !isDeadSessionPayload(payload)
  } catch (error) {
    return false
  }
}

function parseCurrencyFromText (text: string): string | undefined {
  const matches = text.match(/\b[A-Z]{3}\b/g)
  if (matches == null) {
    return undefined
  }

  const knownCurrencies = ['GEL', 'USD', 'EUR', 'GBP', 'RUB', 'TRY']
  for (const candidate of matches) {
    if (knownCurrencies.includes(candidate)) {
      return candidate
    }
  }

  return matches[0]
}

function parseRowAmounts (rowTextParts: string[]): number[] {
  const amounts: number[] = []
  const regex = /-?\d[\d\s]*(?:[.,]\d+)?/g

  for (const part of rowTextParts) {
    const matches = part.match(regex)
    if (matches == null) {
      continue
    }

    for (const match of matches) {
      const parsed = parseNumber(match)
      if (parsed != null) {
        amounts.push(parsed)
      }
    }
  }

  return amounts
}

function uniqueStrings (values: Array<string | undefined>): string[] {
  const out: string[] = []
  for (const value of values) {
    if (value == null) {
      continue
    }

    const normalized = value.trim()
    if (normalized === '' || out.includes(normalized)) {
      continue
    }

    out.push(normalized)
  }
  return out
}

function mapCardAccount (row: CardAccountRow): ParsedAccountRow | null {
  const iban = row.AccountIban != null && row.AccountIban.trim() !== '' ? row.AccountIban.trim() : undefined
  const encrypted = row.AccountIbanEncrypted != null && row.AccountIbanEncrypted.trim() !== ''
    ? row.AccountIbanEncrypted.trim()
    : undefined
  const mainAccountId = row.MainAccountID != null ? String(row.MainAccountID) : undefined

  const id = iban ?? encrypted ?? (mainAccountId != null ? `bb-card-${mainAccountId}` : undefined)
  if (id == null) {
    return null
  }

  const currency = row.MainCCy ?? (Array.isArray(row.CcyArray) ? row.CcyArray.find(item => item != null && item.trim() !== '') : undefined) ?? 'GEL'
  const title = row.AccountName ?? row.ProductName ?? row.AccountDescription ?? iban ?? id
  const amount = parseNumber(row.Amount)

  return {
    id,
    title,
    iban,
    instrument: currency,
    balance: amount,
    available: amount,
    isCard: true,
    syncIds: uniqueStrings([id, iban, encrypted, mainAccountId])
  }
}

function parseBalanceAccountsFromHtml (balanceHtml: string): ParsedAccountRow[] {
  const $ = cheerio.load(balanceHtml)
  const parsed: ParsedAccountRow[] = []

  $('a[href*="/Accounts/Statement/Statement.aspx?ID="]').each((_, element) => {
    const link = $(element)
    const href = link.attr('href') ?? ''
    const idMatch = href.match(/[?&]ID=(\d+)/i)
    if (idMatch == null) {
      return
    }

    const accountId = idMatch[1]
    const row = link.closest('tr')
    const rowTextParts: string[] = row
      .find('td')
      .map((__, td) => normalizeWhitespace($(td).text()))
      .get()
      .filter(text => text !== '')
    const rowText = normalizeWhitespace(row.text())
    const linkText = normalizeWhitespace(link.text())

    const textForIban = linkText !== '' ? linkText : rowText
    const ibanMatch = textForIban.match(/[A-Z]{2}\d{2}[A-Z0-9]{8,}/)
    const iban = ibanMatch?.[0]

    const rawTitle = rowTextParts.find(part => {
      return part !== linkText && !/[A-Z]{2}\d{2}[A-Z0-9]{8,}/.test(part) && parseCurrencyFromText(part) == null && parseNumber(part) == null
    })

    const title = rawTitle ?? (linkText !== '' ? linkText : `BasisBank account ${accountId}`)
    const amounts = parseRowAmounts(rowTextParts)
    const currency = parseCurrencyFromText(`${rowText} ${linkText}`) ?? 'GEL'
    const balance = amounts.length > 0 ? amounts[amounts.length - 1] : null
    const available = amounts.length > 1 ? amounts[amounts.length - 2] : balance
    const isCard = /card|mastercard|visa/i.test(`${title} ${rowText}`)

    parsed.push({
      id: iban ?? `bb-account-${accountId}`,
      title,
      iban,
      instrument: currency,
      balance,
      available,
      isCard,
      syncIds: uniqueStrings([iban, accountId, `bb-account-${accountId}`])
    })
  })

  if (parsed.length === 0) {
    const fallbackIds = new Set<string>()
    const regex = /Accounts\/Statement\/Statement\.aspx\?ID=(\d+)/gi
    let match = regex.exec(balanceHtml)
    while (match != null) {
      fallbackIds.add(match[1])
      match = regex.exec(balanceHtml)
    }

    for (const accountId of fallbackIds) {
      parsed.push({
        id: `bb-account-${accountId}`,
        title: `BasisBank account ${accountId}`,
        instrument: 'GEL',
        balance: null,
        available: null,
        isCard: false,
        syncIds: [`bb-account-${accountId}`, accountId]
      })
    }
  }

  const dedupe = new Map<string, ParsedAccountRow>()
  for (const account of parsed) {
    dedupe.set(account.id, account)
  }

  return [...dedupe.values()]
}

function mergeAccounts (balanceAccounts: ParsedAccountRow[], cardRows: CardAccountRow[]): ParsedAccountRow[] {
  const merged: ParsedAccountRow[] = [...balanceAccounts]

  for (const row of cardRows) {
    const mapped = mapCardAccount(row)
    if (mapped == null) {
      continue
    }

    const existing = merged.find(account => {
      if (account.id === mapped.id) {
        return true
      }
      return mapped.syncIds.some(syncId => account.syncIds.includes(syncId))
    })

    if (existing == null) {
      merged.push(mapped)
      continue
    }

    existing.syncIds = uniqueStrings([...existing.syncIds, ...mapped.syncIds])
    if (existing.iban == null && mapped.iban != null) {
      existing.iban = mapped.iban
    }
    if (existing.title === '' || /^BasisBank account\s+\d+$/i.test(existing.title)) {
      existing.title = mapped.title
    }
    if (existing.balance == null && mapped.balance != null) {
      existing.balance = mapped.balance
    }
    if (existing.available == null && mapped.available != null) {
      existing.available = mapped.available
    }
    if (existing.instrument === '' || existing.instrument === 'GEL') {
      existing.instrument = mapped.instrument
    }
    existing.isCard = existing.isCard || mapped.isCard
  }

  return merged
}

function parseCardRowsPayload (payload: unknown): CardAccountRow[] {
  return extractArrayPayload(payload).filter(isRecord) as CardAccountRow[]
}

async function fetchPagedTransactions (
  session: Session,
  fromDate: Date,
  toDate: Date,
  blockedOnly: boolean
): Promise<CardTransactionRow[]> {
  const rows: CardTransactionRow[] = []
  const signatures = new Set<string>()

  for (let page = 1; page <= MAX_TRANSACTION_PAGES; page++) {
    const payload = await callCardModuleWithSessionRetry(session, 'getlasttransactionlist', {
      StartDate: formatCardDate(fromDate),
      EndDate: formatCardDate(toDate),
      SearchWord: '',
      PageNumber: String(page),
      JustBlocked: blockedOnly ? '1' : '0',
      AccountIban: ''
    }, `loading ${blockedOnly ? 'pending' : 'booked'} transactions page ${page}`)

    const payloadShape = extractArrayPayloadWithShape(payload)
    const pageRows = payloadShape.rows.filter(isRecord) as CardTransactionRow[]
    if (pageRows.length === 0) {
      if (page === 1 && payload != null && !isDeadSessionPayload(payload) && !payloadShape.recognized) {
        const payloadPreview = typeof payload === 'string'
          ? payload.slice(0, 140)
          : JSON.stringify(payload).slice(0, 140)
        throw new TemporaryError(`BasisBank transactions payload format is unexpected (${blockedOnly ? 'pending' : 'booked'}). Preview: ${payloadPreview}`)
      }
      break
    }

    const signature = `${pageRows.length}|${String(pageRows[0]?.TransactionID ?? '')}|${String(pageRows[pageRows.length - 1]?.TransactionID ?? '')}`
    if (signatures.has(signature)) {
      break
    }
    signatures.add(signature)

    rows.push(...pageRows)

    if (pageRows.length < DEFAULT_PAGE_SIZE_GUESS) {
      break
    }
  }

  return rows
}

function normalizeAccountId (account: ParsedAccountRow): string {
  if (account.iban != null && account.iban !== '') {
    return account.iban
  }
  return account.id
}

function ensureAccountsForTransactions (accounts: ParsedAccountRow[], transactions: CardTransactionRow[]): ParsedAccountRow[] {
  const bySyncId = new Map<string, ParsedAccountRow>()
  for (const account of accounts) {
    bySyncId.set(account.id, account)
    for (const syncId of account.syncIds) {
      bySyncId.set(syncId, account)
    }
  }

  for (const transaction of transactions) {
    const accountIban = transaction.AccountIban != null ? transaction.AccountIban.trim() : ''
    if (accountIban === '') {
      continue
    }
    if (bySyncId.has(accountIban)) {
      continue
    }

    const instrument = transaction.Ccy != null && transaction.Ccy.trim() !== '' ? transaction.Ccy.trim() : 'GEL'
    const synthetic: ParsedAccountRow = {
      id: accountIban,
      title: `BasisBank ${accountIban}`,
      iban: accountIban,
      instrument,
      balance: null,
      available: null,
      isCard: (transaction.CardPan ?? '').includes('****'),
      syncIds: [accountIban]
    }

    accounts.push(synthetic)
    bySyncId.set(synthetic.id, synthetic)
    bySyncId.set(accountIban, synthetic)
  }

  return accounts
}

async function authorizeIfNeeded (session: Session, { forceReauth = false }: { forceReauth?: boolean } = {}): Promise<string> {
  if (session.auth.login != null && session.auth.login !== session.login) {
    forceReauth = true
  }
  if (isAuthExpiryReached(session.auth)) {
    console.log('[basisbank] stored auth metadata is expired/near-expired; forcing re-auth')
    forceReauth = true
  }

  if (forceReauth) {
    await resetSessionState(session)
  } else {
    try {
      await ZenMoney.restoreCookies()
    } catch (error) {
      console.warn('[basisbank] restoreCookies failed', error)
    }
  }

  if (!forceReauth) {
    const alive = await checkCardSessionAlive()
    if (alive) {
      try {
        const cached = await fetchBalancePage()
        return await markSessionAuthorized(session, cached)
      } catch (error) {
        if (!isBasisbankAuthError(error)) {
          throw error
        }
        console.warn('[basisbank] balance page requires re-auth despite alive session check')
      }
    }
  }

  const balanceHtml = await loginWithOtpFlow(session)
  return await markSessionAuthorized(session, balanceHtml)
}

export function initializeSession (preferences: Preferences, storedAuth?: Auth): Session {
  const login = typeof preferences.login === 'string' ? preferences.login.trim() : ''
  const password = typeof preferences.password === 'string' ? preferences.password : ''

  if (login === '' || password === '') {
    throw new InvalidPreferencesError('Enter BasisBank login and password in plugin preferences')
  }

  const deviceId = normalizeStoredDeviceId(storedAuth?.deviceId) ?? generateDeviceId()

  return {
    auth: {
      login: storedAuth?.login,
      lastSuccessfulLoginAt: storedAuth?.lastSuccessfulLoginAt,
      deviceId,
      sessionExpiresAt: typeof storedAuth?.sessionExpiresAt === 'number' ? storedAuth.sessionExpiresAt : undefined,
      trustedDeviceExpiresAt: typeof storedAuth?.trustedDeviceExpiresAt === 'number' ? storedAuth.trustedDeviceExpiresAt : undefined
    },
    deviceId,
    login,
    password,
    requestSmsCode: parseBooleanPreference(preferences.requestSmsCode, true),
    trustDevice: parseBooleanPreference(preferences.trustDevice, true)
  }
}

export async function ensureSessionReady (session: Session): Promise<void> {
  await authorizeIfNeeded(session)
}

export async function fetchUserAccounts (session: Session): Promise<ParsedAccountRow[]> {
  let balanceHtml = balancePageCache.get(session)
  if (balanceHtml == null) {
    try {
      balanceHtml = await fetchBalancePage()
      await markSessionAuthorized(session, balanceHtml)
    } catch (error) {
      if (!isBasisbankAuthError(error)) {
        throw error
      }
      balanceHtml = await authorizeIfNeeded(session, { forceReauth: true })
    }
  }
  const balanceAccounts = parseBalanceAccountsFromHtml(balanceHtml)

  let cardRows: CardAccountRow[] = []
  try {
    const cardPayload = await callCardModuleWithSessionRetry(session, 'getcardlist', {}, 'loading card accounts')
    cardRows = parseCardRowsPayload(cardPayload)
  } catch (error) {
    console.warn('[basisbank] could not load card account list', error)
  }

  return mergeAccounts(balanceAccounts, cardRows)
}

export async function fetchUserTransactions (
  session: Session,
  fromDate: Date,
  toDate: Date,
  accounts: ParsedAccountRow[]
): Promise<UserTransactionsResponse> {
  const booked = await fetchPagedTransactions(session, fromDate, toDate, false)
  const pending = await fetchPagedTransactions(session, fromDate, toDate, true)

  ensureAccountsForTransactions(accounts, [...booked, ...pending])

  const hasMeaningfulAccountIds = accounts.some(account => normalizeAccountId(account) !== '')
  if (!hasMeaningfulAccountIds) {
    throw new TemporaryError('BasisBank account list is empty after authorization')
  }

  return { booked, pending }
}
