import get, { getOptArray, getOptNumber, getOptString } from '../../types/get'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, InvalidPreferencesError, UserInteractionError } from '../../errors'
import { generateUUID } from '../../common/utils'
import { FetchResponse } from '../../common/network'
import { bankUrl, describeLoginForms, readJson, readLoginForm, readOtpForm, request, requestJson } from './fetchApi'
import { Auth, Preferences, Session } from './models'

function confirm (session: Session): void {
  session.persist({ cookieHeader: session.cookieHeader, cookies: session.cookies, fingerprint: session.fingerprint })
}

function object (response: FetchResponse): unknown {
  const body = readJson(response)
  const result = getOptNumber(body, 'response.result')
  console.assert(result === 0, 'Unexpected bank API result', { result })
  return get(body, 'response.object')
}

async function follow (session: Auth, response: FetchResponse): Promise<FetchResponse> {
  for (let step = 0; step < 12; step++) {
    if (![301, 302, 303].includes(response.status)) return response
    const headers = response.headers as Record<string, string | undefined>
    const location = headers.location ?? headers.Location
    console.assert(location != null, 'Missing bank redirect location')
    response = await request(session, bankUrl(location ?? '', response.url))
  }
  throw new Error('Bank redirect limit exceeded')
}

export async function login (preferences: Preferences, saved: unknown, background: boolean, persist: Session['persist']): Promise<Session> {
  const fingerprint = getOptString(saved, 'fingerprint')
  const savedCookies = getOptArray(saved, 'cookies')
  const session: Session = {
    cookieHeader: fingerprint == null ? '' : getOptString(saved, 'cookieHeader') ?? '',
    cookies: fingerprint == null ? undefined : savedCookies as Session['cookies'],
    fingerprint: fingerprint ?? generateUUID(),
    persist
  }
  // A working session takes precedence over changed credential preferences.
  let response = await follow(session, await requestJson(session, 'loginInfo'))
  let body = readJson(response)
  if (getOptNumber(body, 'response.result') === 0) {
    confirm(session)
    return session
  }
  const redirect = getOptString(body, 'object.redirectUrl')
  console.assert(getOptNumber(body, 'result') === 33 && redirect != null, 'Unknown bank authorization state')
  // Opening the bank-provided SSO authorization URL is still hot auth when
  // saved cookies exist. Do not ask for credentials until a login form proves
  // that this supported silent path cannot restore the bank session.
  if (background && session.cookieHeader === '' && (session.cookies ?? []).length === 0) throw new UserInteractionError()
  response = await follow(session, await request(session, bankUrl(redirect ?? '')))
  console.assert(response.status === 200 && typeof response.body === 'string', 'Unexpected bank login page')
  const form = readLoginForm(typeof response.body === 'string' ? response.body : '', response.url)
  if (form == null) {
    const forms = typeof response.body === 'string' ? describeLoginForms(response.body) : []
    console.assert(forms.length === 0, 'Unsupported bank SSO interaction form')
    response = await follow(session, await requestJson(session, 'loginInfo', { fingerprint: session.fingerprint }))
    body = readJson(response)
    console.assert(getOptNumber(body, 'response.result') === 0 && (session.cookieHeader !== '' || (session.cookies ?? []).length > 0), 'Silent bank SSO did not confirm authorization')
    confirm(session)
    console.info('Levoberezhny saved SSO session restored without credentials')
    return session
  }
  console.info('Levoberezhny saved authorization requires bank credential form')
  const username = preferences.login.trim() === ''
    ? background ? null : await ZenMoney.readLine('Логин интернет-банка Левобережного', { inputType: 'text' })
    : preferences.login.trim()
  const password = preferences.password === ''
    ? background ? null : await ZenMoney.readLine('Пароль интернет-банка Левобережного', { inputType: 'textPassword' })
    : preferences.password
  if (username == null || username.trim() === '' || password == null || password === '') {
    if (background) throw new UserInteractionError()
    throw new InvalidPreferencesError('Укажите логин и пароль интернет-банка Левобережного')
  }
  // The bank reveals whether OTP is required only after accepting credentials.
  // A background run may submit stored preferences once, but never reads or
  // submits an OTP and never persists the intermediate challenge state.
  response = await follow(session, await request(session, form?.action ?? '', 'POST', {
    ...form?.fields,
    username: username.trim(),
    password,
    fingerprint: session.fingerprint,
    fsitecode: 'nskbl'
  }))
  console.assert(response.status === 200, 'Unexpected bank login completion status', { status: response.status })
  const forms = typeof response.body === 'string' ? describeLoginForms(response.body) : []
  if (forms.length > 0) {
    const repeatedLoginForm = typeof response.body === 'string' ? readLoginForm(response.body, response.url) : null
    if (repeatedLoginForm != null) {
      throw new InvalidLoginOrPasswordError('Неверный логин или пароль интернет-банка Левобережного.')
    }
    const otpForm = typeof response.body === 'string' ? readOtpForm(response.body, response.url) : null
    if (otpForm == null) {
      console.debug('Levoberezhny additional login form schema', forms)
      throw new Error('Additional bank login form detected; inspect sanitized form schema')
    }
    if (background) throw new UserInteractionError()
    const code = await ZenMoney.readLine('Одноразовый пароль из SMS банка Левобережный', { inputType: 'numberPassword', time: 120000 })
    console.assert(code != null && code.trim() !== '', 'Required OTP input was not provided')
    response = await follow(session, await request(session, otpForm.action, 'POST', {
      ...otpForm.fields,
      fingerprint: session.fingerprint,
      fsitecode: 'nskbl',
      otp: code?.trim() ?? ''
    }))
    console.assert(response.status === 200, 'Unexpected bank OTP completion status', { status: response.status })
    const remainingForms = typeof response.body === 'string' ? describeLoginForms(response.body) : []
    if (remainingForms.length > 0) {
      const repeatedOtpForm = typeof response.body === 'string' ? readOtpForm(response.body, response.url) : null
      if (repeatedOtpForm != null) {
        throw new InvalidOtpCodeError('Банк не принял одноразовый пароль. Проверьте код и повторите синхронизацию.')
      }
      console.debug('Levoberezhny remaining login form schema', remainingForms)
      throw new Error('Bank OTP confirmation incomplete; no automatic retry')
    }
  }
  // The SSO callback must complete before authorization can be persisted.
  response = await follow(session, await requestJson(session, 'loginInfo', { fingerprint: session.fingerprint }))
  body = readJson(response)
  console.assert(getOptNumber(body, 'response.result') === 0 && (session.cookieHeader !== '' || (session.cookies ?? []).length > 0), 'Bank login incomplete; challenge or rejection requires investigation')
  confirm(session)
  return session
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  const data = object(await requestJson(session, 'getMyFinancesPage', { bankId: '29300' }))
  confirm(session)
  const accounts = getOptArray(data, 'accounts.accounts')
  console.assert(accounts != null && accounts.length > 0, 'Missing bank accounts')
  // This plugin's declared scope is bank-issued cards and their underlying accounts.
  // Contractual loans/deposits need separate, source-backed conversion and are
  // explicitly excluded in the manifest rather than filled with guessed terms.
  console.debug('Levoberezhny excluded product families', {
    loans: (getOptArray(data, 'loanList.loans') ?? []).length,
    deposits: (getOptArray(data, 'depositList.deposits') ?? []).length
  })
  // b2pCards are saved payment cards/payees (tokens, aliases, no currency/balance),
  // not another fetched bank balance. The account graph contains bank-issued cards.
  return accounts ?? []
}

export function bankDay (date: Date): string {
  console.assert(Number.isFinite(date.getTime()), 'Invalid history boundary')
  const moscow = new Date(date.getTime() + 3 * 3600000)
  return `${String(moscow.getUTCDate()).padStart(2, '0')}.${String(moscow.getUTCMonth() + 1).padStart(2, '0')}.${moscow.getUTCFullYear()}`
}

export async function fetchTransactions (session: Session, params: { accountId: string }, fromDate: Date, toDate?: Date): Promise<unknown[]> {
  if (toDate != null && fromDate > toDate) return []
  const operations: unknown[] = []
  const seen = new Set<string>()
  let cursor: string | undefined
  for (let page = 0; page < 1000; page++) {
    const data = object(await requestJson(session, 'pfmTape', {
      bankId: '29300',
      product: `AC_${params.accountId}`,
      countForPage: '50',
      from: bankDay(fromDate),
      // The web endpoint requires a calendar end date; today covers available history.
      to: bankDay(toDate ?? new Date()),
      ...(cursor == null ? {} : { lastOperationId: cursor })
    }))
    confirm(session)
    const items = getOptArray(data, 'operations')
    console.assert(items != null, 'Missing history operations')
    let added = 0
    for (const item of items ?? []) {
      const rawId = get(item, 'id')
      console.assert(typeof rawId === 'string' || (typeof rawId === 'number' && Number.isSafeInteger(rawId)), 'Missing stable operation ID')
      const id = String(rawId)
      if (!seen.has(id)) {
        seen.add(id)
        operations.push(item)
        added++
      }
    }
    if ((items?.length ?? 0) < 50) return operations
    console.assert(added > 0, 'Bank history cursor did not advance')
    // The observed web client uses item 49 of a 50-item response as its cursor.
    // Retain every actual operation and deduplicate the overlapping next page.
    cursor = String(get(items?.[48], 'id'))
  }
  throw new Error('Bank history page limit exceeded')
}
