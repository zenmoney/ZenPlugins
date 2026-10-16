import { Debug } from '../../common/debug'
import { InvalidLoginOrPasswordError, InvalidPreferencesError, TemporaryError, UserInteractionError } from '../../errors'
import { delay } from '../../common/utils'
import { v4 as uuid } from 'uuid'
import { authorizationCode, deviceCddc, loginPage, pageTemplate, pushPage, tokenNonce } from './authPage'
import get, { getBoolean, getNumber, getString } from '../../types/get'
import * as transport from './fetchApi'
import { AccountGraph, Auth, ExchangeDetails, HistoryPlan, PersistAuth, Preferences, RefreshCredentials } from './models'
import { array, text } from './parse'

/** Refresh compatible saved authorization before considering an interactive credential login. */
export async function authenticate (preferences: Preferences, stored: unknown, persist: PersistAuth, isInBackground = false): Promise<Auth> {
  const refreshToken = get(stored, 'refreshToken')
  const clientAuth = get(stored, 'clientAuth')
  const clientId = get(stored, 'clientId')
  if (typeof refreshToken === 'string' && refreshToken.length > 0 && typeof clientAuth === 'string' && clientAuth.length > 0) {
    const credentials: RefreshCredentials = { refreshToken, clientAuth, clientId: typeof clientId === 'string' ? clientId : '' }
    const refreshed = await transport.refreshToken(credentials)
    if (refreshed.kind === 'token') return await confirmedAuth(refreshed.token, credentials, persist)
    console.debug('MyAmeria refresh grant rejected, starting credential login')
  }
  return await coldAuth(preferences, persist, isInBackground)
}

/** Initiate the captured credential-and-push flow only when user interaction is available. */
async function coldAuth (preferences: Preferences, persist: PersistAuth, isInBackground: boolean): Promise<Auth> {
  if (typeof preferences.login !== 'string' || preferences.login.trim().length === 0 || typeof preferences.password !== 'string' || preferences.password.length === 0) {
    throw new InvalidPreferencesError('Укажите логин и пароль MyAmeria')
  }
  if (isInBackground) throw new UserInteractionError()
  const clientAuth = await transport.fetchClientAuthorization()
  const state = uuid()
  const nonce = uuid()
  const initial = loginPage(await transport.fetchAuthorizationPage(state, nonce))
  console.assert(initial.error === '', 'MyAmeria authorization page contains an unexpected error', { code: initial.error })
  const cddc = deviceCddc()
  const html = await transport.submitCredentials(initial.action, preferences, cddc)
  if (pageTemplate(html) === 'login') {
    const rejected = loginPage(html)
    if (rejected.error === 'login.errors.wrongPassword') throw new InvalidLoginOrPasswordError('Неверный логин или пароль MyAmeria')
    console.assert(false, 'Unexpected MyAmeria login rejection', { code: rejected.error })
  }
  const page = pushPage(html)
  await ZenMoney.alert('Подтвердите вход в приложении MyAmeria, затем вернитесь в Дзен-мани и нажмите ОК')
  await awaitPush(page.sessionId)
  const code = authorizationCode(await transport.confirmLogin(page, cddc), state)
  const token = await transport.exchangeToken(code, clientAuth)
  const idToken = authString(token, 'id_token')
  console.assert(tokenNonce(idToken) === nonce, 'MyAmeria token nonce mismatch')
  return await confirmedAuth(token, { clientAuth, clientId: '', refreshToken: '' }, persist)
}

/** Poll at the official client's interval while preserving unknown errors and states. */
async function awaitPush (sessionId: string): Promise<void> {
  const deadline = Date.now() + 120000
  for (let attempt = 0; attempt < 40 && Date.now() < deadline; attempt++) {
    const response = await transport.fetchPushStatus(sessionId)
    console.assert(get(response, 'status') === 'success', 'MyAmeria confirmation envelope is unsuccessful')
    const status = getString({ value: get(response, 'data.sessionStatus') }, 'value')
    if (status === 'accepted') return
    if (status === 'refused') throw new TemporaryError('Вход отклонён в приложении MyAmeria, повторите синхронизацию и подтвердите вход')
    console.assert(status === 'pending', 'Unexpected MyAmeria confirmation status', { status })
    await delay(3000)
  }
  throw new Error('MyAmeria confirmation polling deadline exceeded')
}

/** Persist valid rotated tokens before discovering the bank client or loading any financial data. */
async function confirmedAuth (token: unknown, credentials: RefreshCredentials, persist: PersistAuth): Promise<Auth> {
  const accessToken = authString(token, 'access_token')
  const refreshToken = authString(token, 'refresh_token')
  const expiresIn = get(token, 'expires_in')
  console.assert(accessToken.length > 0 && refreshToken.length > 0 && typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0, 'Invalid MyAmeria token response')
  const auth: Auth = { ...credentials, accessToken, refreshToken, expiresAt: Date.now() + (expiresIn as number) * 1000 }
  await persist(auth)
  if (auth.clientId.length > 0) return auth
  const resolved: Auth = { ...auth, clientId: await transport.fetchClientId(accessToken) }
  await persist(resolved)
  return resolved
}

/** Narrow secret token fields without including their values in assertion diagnostics. */
function authString (token: unknown, key: string): string {
  const value = get(token, key)
  console.assert(typeof value === 'string' && value.length > 0, 'Invalid MyAmeria token field', { key })
  return value as string
}

/** Load product details in the order of the complete account graph. */
export async function fetchProducts (auth: Auth, graph: unknown): Promise<readonly unknown[]> {
  const result: unknown[] = []
  const savingsAccounts = array(graph, 'savings')
    .filter(item => get(item, 'accountNumber') !== undefined)
    .map(item => ({ productType: 'ACCOUNT', id: text(item, 'id') }))
  const items = [...array(graph, 'accountsAndCards'), ...savingsAccounts]
  for (const item of items) {
    result.push(await transport.fetchProduct(auth, text(item, 'productType'), text(item, 'id')))
  }
  return result
}

/** Load each exchange document once to verify settled counterpart amounts. */
export async function fetchExchangeDetails (auth: Auth, records: readonly unknown[]): Promise<ExchangeDetails> {
  const result: Record<string, unknown> = {}
  for (const record of records) {
    if (text(record, 'transactionType') !== 'exchange') continue
    const id = text(record, 'transactionId')
    if (result[id] === undefined) result[id] = await transport.fetchTransactionDetail(auth, id)
  }
  return result
}

/** Load accounts, cards and savings with a sanitized checkpoint. */
export async function fetchAccountGraph (auth: Auth): Promise<unknown> {
  const listed = await transport.fetchAccounts(auth.accessToken, auth.clientId)
  const savings = await transport.fetchSavings(auth)
  const graph: AccountGraph = { accountsAndCards: array(listed, 'accountsAndCards'), savings: array(savings, 'savings') }
  await Debug.checkpoint('myameria-accounts', transport.maskLog(graph))
  return graph
}

/** Load every zero-based page of shared account history. */
export async function fetchTransactions (auth: Auth, fetchParams: Pick<HistoryPlan, 'source'>, fromDate: Date, toDate: Date): Promise<readonly unknown[]> {
  console.assert(fetchParams.source === 'history', 'Unsupported MyAmeria history source')
  const records: unknown[] = []
  for (let page = 0; page < 1000; page++) {
    const history = await transport.fetchHistoryPage(auth.accessToken, auth.clientId, fromDate, toDate, page)
    await Debug.checkpoint(`myameria-history-${page}`, transport.maskLog(history))
    records.push(...array(history, 'transactions'))
    if (!getBoolean({ value: get(history, 'hasNext') }, 'value')) return records
  }
  throw new Error('MyAmeria history pagination limit exceeded')
}

/** Load every one-based page of deposit history. */
export async function fetchDepositTransactions (auth: Auth, id: string): Promise<readonly unknown[]> {
  const records: unknown[] = []
  for (let page = 1; page <= 1000; page++) {
    const response = await transport.fetchDepositHistory(auth, id, page)
    const entries = array(response, 'entries')
    const total = getNumber({ value: get(response, 'totalCount') }, 'value')
    console.assert(Number.isInteger(total) && total >= 0, 'Invalid MyAmeria deposit history count')
    records.push(...entries)
    if (records.length === total) return records
    console.assert(entries.length > 0 && records.length < total, 'Incomplete MyAmeria deposit history')
  }
  throw new Error('MyAmeria deposit history pagination limit exceeded')
}
