import { generateUUID } from '../../common/utils'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, InvalidPreferencesError, UserInteractionError } from '../../errors'
import { getOptString } from '../../types/get'
import type { QPayAccountGraph, QPayHistory } from './converters'
import {
  fetchCardBalance, fetchCards, fetchCardTransactionsPage, fetchOperation,
  fetchOperationsPage, fetchWallet, QPayApiError, refreshAuthorization,
  resolveTenant, sendEmailCode, sendMfaCode, SessionExpiredError,
  verifyEmailCode, verifyMfaCode, verifyPin
} from './fetchApi'
import { Authorization, Device, isSession, normalizeEmail, Page, Preferences, QPayFetchParams, Session } from './models'

export interface AuthenticationOptions {
  isInBackground: boolean
  saveSession: (session: Session) => void | Promise<void>
  saveDevice: (device: Device) => void | Promise<void>
}

function deviceFrom (value: unknown): Device | null {
  const id = getOptString(value, 'id')
  const fingerprint = getOptString(value, 'fingerprint')
  return id != null && id !== '' && fingerprint != null && fingerprint !== '' ? { id, fingerprint } : null
}

async function codeInput (text: string, digits: number): Promise<string> {
  const value = await ZenMoney.readLine(text, { inputType: 'numberPassword' })
  assert(value !== null, 'Required Q-Pay input was not provided')
  assert(new RegExp(`^\\d{${digits}}$`).test(value), 'Invalid Q-Pay code format')
  return value
}

async function saveAuthorization (session: Session, result: Authorization, options: AuthenticationOptions): Promise<Session> {
  const updated = { ...session, ...result }
  await options.saveSession(updated)
  return updated
}

async function finishAuthentication (initial: Session, options: AuthenticationOptions): Promise<Session> {
  let session = initial
  const visited = new Set<string>()
  // Active sessions may skip the official client's optional create-PIN screen.
  // An existing PIN is required only for the server's pending_pin stage.
  while (session.stage !== 'active') {
    assert(!visited.has(session.stage), 'Q-Pay repeated an incomplete authentication stage', { stage: session.stage })
    visited.add(session.stage)
    if (options.isInBackground) throw new UserInteractionError()
    if (session.stage === 'pending_pin') {
      const pin = await codeInput('Введите PIN-код Q-Pay (4 цифры)', 4)
      try {
        session = await saveAuthorization(session, await verifyPin(session, pin), options)
      } catch (error) {
        if (error instanceof QPayApiError && error.code === 'PIN_INVALID') {
          throw new InvalidLoginOrPasswordError('Неверный PIN-код Q-Pay')
        }
        throw error
      }
    } else {
      const supported = session.methods.filter(method => ['totp', 'sms', 'email'].includes(method))
      const method = supported.includes('totp') ? 'totp' : supported[0] ?? (session.methods.length === 0 ? 'totp' : undefined)
      assert(method != null, 'Q-Pay has no supported MFA method')
      // Sending SMS/email is an external user interaction; guard above precedes it.
      if (method !== 'totp') await sendMfaCode(session, method)
      const prompt = method === 'totp'
        ? 'Введите код Q-Pay из приложения-аутентификатора (6 цифр)'
        : method === 'sms' ? 'Введите код Q-Pay из SMS (6 цифр)' : 'Введите код Q-Pay из письма (6 цифр)'
      const code = await codeInput(prompt, 6)
      try {
        session = await saveAuthorization(session, await verifyMfaCode(session, method, code), options)
      } catch (error) {
        if (error instanceof QPayApiError && error.code === 'MFA_CODE_INVALID') {
          throw new InvalidOtpCodeError('Неверный код подтверждения Q-Pay')
        }
        throw error
      }
    }
  }
  return session
}

async function coldAuthentication (preferences: Preferences, savedDevice: unknown, options: AuthenticationOptions): Promise<Session> {
  const email = normalizeEmail(preferences.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InvalidPreferencesError('Проверьте email Q-Pay в настройках')
  // Do not send an email challenge while the user cannot complete it.
  if (options.isInBackground) throw new UserInteractionError()
  const device = deviceFrom(savedDevice) ?? { id: generateUUID(), fingerprint: `zenmoney:${generateUUID()}` }
  await options.saveDevice(device)
  const tenantId = await resolveTenant()
  await sendEmailCode(tenantId, email)
  const code = await codeInput('Введите код входа Q-Pay из письма (6 цифр)', 6)
  const result = await verifyEmailCode(tenantId, email, code, device)
  const session: Session = { version: 2, email, tenantId, device, ...result }
  await options.saveSession(session)
  return await finishAuthentication(session, options)
}

export async function authenticate (
  preferences: Preferences,
  storedSession: unknown,
  savedDevice: unknown,
  options: AuthenticationOptions
): Promise<Session> {
  if (!isSession(storedSession)) {
    if (storedSession != null) console.debug('Q-Pay stored authorization is incompatible with the current API; starting email authentication')
    return await coldAuthentication(preferences, savedDevice, options)
  }
  // Preference edits do not replace a working authenticated customer session.
  let session = storedSession
  if (session.expiresAt <= Date.now()) {
    try {
      session = await saveAuthorization(session, await refreshAuthorization(session), options)
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) throw error
      console.debug('Q-Pay refresh was rejected; starting email authentication')
      return await coldAuthentication(preferences, session.device, options)
    }
  }
  try {
    return await finishAuthentication(session, options)
  } catch (error) {
    if (!(error instanceof SessionExpiredError)) throw error
    console.debug('Q-Pay pending authorization was rejected; starting email authentication')
    return await coldAuthentication(preferences, session.device, options)
  }
}

export interface QPayClient {
  run: <T>(action: (session: Session) => Promise<T>) => Promise<T>
}

export async function createClient (
  preferences: Preferences,
  storedSession: unknown,
  savedDevice: unknown,
  options: AuthenticationOptions
): Promise<QPayClient> {
  let session = await authenticate(preferences, storedSession, savedDevice, options)
  return {
    async run<T> (action: (session: Session) => Promise<T>): Promise<T> {
      try {
        return await action(session)
      } catch (error) {
        if (!(error instanceof SessionExpiredError)) throw error
      }
      try {
        session = await saveAuthorization(session, await refreshAuthorization(session), options)
      } catch (error) {
        if (!(error instanceof SessionExpiredError)) throw error
        console.debug('Q-Pay authorization was rejected; starting email authentication')
        session = await coldAuthentication(preferences, session.device, options)
      }
      // A second rejection is reportable; never loop or re-send login challenges.
      return await action(session)
    }
  }
}

/** Complete cursor traversal. Page length never establishes completion. */
export async function collectPages (load: (cursor?: string) => Promise<Page>): Promise<unknown[]> {
  const items = new Map<string, unknown>()
  const cursors = new Set<string>()
  let cursor: string | undefined
  while (true) {
    const page = await load(cursor)
    for (const item of page.items) {
      const id = getOptString(item, 'id')
      assert(id != null && id !== '', 'Q-Pay history item has no stable identifier')
      const prior = items.get(id)
      assert(prior == null || JSON.stringify(prior) === JSON.stringify(item), 'Q-Pay history changed across overlapping pages')
      items.set(id, item)
    }
    if (page.nextCursor === null) return [...items.values()]
    assert(!cursors.has(page.nextCursor), 'Q-Pay repeated a history cursor')
    cursors.add(page.nextCursor)
    cursor = page.nextCursor
  }
}

export async function fetchAccountGraph (client: QPayClient): Promise<QPayAccountGraph> {
  const wallet = await client.run(fetchWallet)
  const cards = await client.run(fetchCards)
  const graph: QPayAccountGraph = { wallet, cards: [] }
  for (const card of cards) {
    const id = getOptString(card, 'id')
    assert(id != null && id !== '', 'Q-Pay card has no stable identifier')
    graph.cards.push({ card, balance: await client.run(async session => await fetchCardBalance(session, id)) })
  }
  return graph
}

function withinInterval (item: unknown, field: string, fromDate: Date, toDate: Date | null | undefined): boolean {
  const rawDate = getOptString(item, field) ?? (field === 'authorized_at' ? getOptString(item, 'settled_at') : undefined)
  const date = rawDate == null ? NaN : Date.parse(rawDate)
  assert(Number.isFinite(date), 'Q-Pay history has an invalid date', { field })
  return date >= fromDate.getTime() && (toDate == null || date <= toDate.getTime())
}

export async function fetchHistory (
  client: QPayClient,
  fetchParams: QPayFetchParams,
  fromDate: Date,
  toDate?: Date | null
): Promise<QPayHistory> {
  const history: QPayHistory = { operations: [], cards: [] }
  if (fetchParams.kind === 'wallet') {
    const operations = await collectPages(async cursor => await client.run(async session => await fetchOperationsPage(session, fromDate, toDate, cursor)))
    for (const operation of operations) {
      if (!withinInterval(operation, 'occurred_at', fromDate, toDate)) continue
      const id = getOptString(operation, 'id')
      assert(id != null, 'Q-Pay operation identifier is missing')
      history.operations.push({ operation, detail: await client.run(async session => await fetchOperation(session, id)) })
    }
  } else {
    const transactions = await collectPages(async cursor => await client.run(async session => await fetchCardTransactionsPage(session, fetchParams.cardId, cursor)))
    history.cards.push({
      cardId: fetchParams.cardId,
      transactions: transactions.filter(item => withinInterval(item, 'authorized_at', fromDate, toDate))
    })
  }
  return history
}
