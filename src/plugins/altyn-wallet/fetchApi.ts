import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { AltynAccount, AltynTransaction, Preferences } from './models'

const API_BASE = 'https://api.lk.altyn.one'
const LK_BASE = 'https://lk.altyn.one'

// Базовый запрос к API Altyn Wallet с Bearer-токеном из настроек.
async function fetchApi (path: string, preferences: Preferences, options: FetchOptions = {}): Promise<FetchResponse> {
  const response = await fetchJson(API_BASE + path, {
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

export { LK_BASE }
