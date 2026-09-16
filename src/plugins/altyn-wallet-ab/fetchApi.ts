import { fetchJson, FetchOptions, FetchResponse, ParseError } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { AltynAccount, AltynTransaction, Preferences } from './models'

// Банк перенёс кабинет и приложение на lk.altyn.in; старый lk.altyn.one
// объявлен временно недоступным, поэтому оставлен запасным доменом.
const API_BASES = ['https://api.lk.altyn.in', 'https://api.lk.altyn.one']
const LK_BASES = ['https://lk.altyn.in', 'https://lk.altyn.one']

// Домены, ответившие последним успешным ответом. Кешируются на время запуска
// синхронизации, чтобы не пробовать недоступный домен на каждый запрос.
let workingApiBase: string | null = null
let workingLkBase: string | null = null

// Ошибка транспорта (DNS, обрыв соединения) — сервер не ответил вовсе.
// Ответ с любым статусом или битым JSON (ParseError и ошибки статусов)
// означает, что домен отвечает, и фолбек на другой домен не нужен.
export function isNetworkError (error: unknown): boolean {
  return !(error instanceof ParseError) &&
    !(error instanceof TemporaryError) &&
    !(error instanceof InvalidLoginOrPasswordError)
}

// Домены кабинета в порядке приоритета: последним работавший — первым.
export function lkBases (): string[] {
  return workingLkBase === null
    ? LK_BASES
    : [workingLkBase, ...LK_BASES.filter((base) => base !== workingLkBase)]
}

// Фиксирует домен кабинета, прошедший авторизацию, для последующих запросов.
export function setWorkingLkBase (base: string): void {
  workingLkBase = base
}

// Пробует API-домены по очереди, начиная с последнего работавшего.
// Транспортная ошибка означает недоступность домена — пробуем следующий;
// любой HTTP-ответ считается успехом (статусы разбирает вызывающий код).
async function fetchJsonWithFallback (path: string, options: FetchOptions): Promise<FetchResponse> {
  const ordered = workingApiBase === null
    ? API_BASES
    : [workingApiBase, ...API_BASES.filter((base) => base !== workingApiBase)]
  let lastError: unknown = null
  for (const base of ordered) {
    try {
      const response = await fetchJson(base + path, options)
      workingApiBase = base
      return response
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error
      }
      lastError = error
    }
  }
  throw new TemporaryError(`Altyn Wallet: нет связи ни с одним доменом (${API_BASES.join(', ')}) — ${String(lastError)}`)
}

// Базовый запрос к API Altyn Wallet с Bearer-токеном из настроек.
async function fetchApi (path: string, preferences: Preferences, options: FetchOptions = {}): Promise<FetchResponse> {
  const response = await fetchJsonWithFallback(path, {
    ...options,
    headers: {
      ...options.headers as Record<string, string>,
      Authorization: `Bearer ${preferences.token}`,
      Accept: 'application/json, text/plain, */*',
      'x-brand-slug': 'altyn'
    }
  })
  // 401 — неверный/просроченный токен: просим исправить настройки
  if (response.status === 401) {
    throw new InvalidLoginOrPasswordError('Неверный или просроченный токен Altyn Wallet')
  }
  // 5xx — временный сбой сервера: предложим повторить синхронизацию
  if (response.status >= 500) {
    throw new TemporaryError('Сервер Altyn Wallet временно недоступен')
  }
  return response
}

// Проверка ответа API на типичную ошибку «недостаточно прав / нужно подтвердить PIN».
// Сервис отдаёт 403 с { detail, need_verify_pin, session_is_closed } вместо списка.
function assertNotBlocked (body: unknown): void {
  const data = body as { detail?: string, need_verify_pin?: boolean, session_is_closed?: boolean }
  if (typeof data.detail === 'string' || data.need_verify_pin === true) {
    throw new InvalidLoginOrPasswordError(
      data.need_verify_pin === true
        ? 'Сессия требует подтверждения PIN. Проверьте PIN-код и токен.'
        : `Altyn Wallet: ${data.detail ?? 'недостаточно прав'}`
    )
  }
}

// GET /account/ — список счетов пользователя
export async function fetchAccounts (preferences: Preferences): Promise<AltynAccount[]> {
  const response = await fetchApi('/account/', preferences)
  const body = response.body as { results?: AltynAccount[] }
  assertNotBlocked(response.body)
  if (!Array.isArray(body.results)) {
    throw new TemporaryError(`Altyn Wallet: неожиданный ответ /account/ — ${JSON.stringify(response.body).slice(0, 200)}`)
  }
  return body.results
}

// GET /transaction/ — список операций с cursor-пагинацией через поле next.
export async function fetchTransactions (
  preferences: Preferences,
  fromDate: Date,
  toDate: Date
): Promise<AltynTransaction[]> {
  const all: AltynTransaction[] = []
  let nextPath: string | null = '/transaction/'
  while (nextPath !== null) {
    const response = await fetchApi(nextPath, preferences)
    const body = response.body as { results?: AltynTransaction[], next?: string | null }
    assertNotBlocked(response.body)
    if (!Array.isArray(body.results)) {
      throw new TemporaryError(`Altyn Wallet: неожиданный ответ /transaction/ — ${JSON.stringify(response.body).slice(0, 200)}`)
    }
    let reachedOlder = false
    for (const tx of body.results) {
      const date = new Date(tx.created_at)
      if (date < fromDate) {
        reachedOlder = true
        break
      }
      if (date <= toDate) {
        all.push(tx)
      }
    }
    if (reachedOlder) {
      break
    }
    nextPath = typeof body.next === 'string' ? body.next.replace(/^https?:\/\/[^/]+/, '') : null
  }
  return all
}
