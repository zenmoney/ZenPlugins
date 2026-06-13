import forge from 'node-forge'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'
import { getBoolean, getNumber, getOptString, getString } from '../../types/get'
import { Session } from './models'

const AUTH_HOST = 'https://ffb-authentication.ffinpay.ru'
const MOBILE_HOST = 'https://mo.ffinpay.ru'

const APP_VERSION = '9.3.0'
const APP_USER_AGENT = 'okhttp/5.3.2'

function defaultHeaders (session?: Session): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json; charset=UTF-8',
    'User-Agent': APP_USER_AGENT,
    'X-App-Version': APP_VERSION,
    'X-Platform': 'android'
  }
  if (session != null) {
    headers.Authorization = `Bearer ${session.token}`
  }
  return headers
}

async function callJson (url: string, options: FetchOptions, session?: Session): Promise<FetchResponse> {
  return await fetchJson(url, {
    ...options,
    headers: {
      ...defaultHeaders(session),
      ...(typeof options.headers === 'object' && options.headers !== null ? options.headers : {})
    }
  })
}

export async function fetchPassRequest (phone: string, cardNumber: string): Promise<number> {
  // The bank expects sha256 of the raw card number (no spaces) as the answer to the CARD_NUMBER security question.
  const secAnswer = forge.md.sha256.create().update(cardNumber.replace(/\D/g, ''), 'utf8').digest().toHex()
  const response = await callJson(`${AUTH_HOST}/ncs-mobile/rest/v2/auth/pass-request`, {
    method: 'POST',
    body: {
      userId: phone.replace(/\D/g, ''),
      userIdType: 'PHONE',
      secQuestion: 'CARD_NUMBER',
      secAnswer
    },
    sanitizeRequestLog: { body: { userId: true, secAnswer: true } }
  })
  if (response.status !== 200 || !getBoolean(response.body, 'success')) {
    throw new InvalidLoginOrPasswordError('Не удалось начать вход в Цифра Банк. Проверьте номер телефона и номер карты.')
  }
  return getNumber(response.body, 'passRequestId')
}

export async function fetchLogonWithSmsCode (
  phone: string,
  passRequestId: number,
  smsCode: string
): Promise<{ token: string, refresh: string }> {
  const response = await callJson(`${AUTH_HOST}/ncs-mobile/rest/v3/auth/logon-request`, {
    method: 'POST',
    body: {
      passwordType: 'SMS_CODE',
      userIdType: 'PHONE',
      authType: 'CARD_NUMBER',
      password: smsCode,
      userId: phone.replace(/\D/g, ''),
      passRequestId
    },
    sanitizeRequestLog: { body: { userId: true, password: true } },
    sanitizeResponseLog: { body: { token: true, refresh: true } }
  })
  if (response.status !== 200 || getOptString(response.body, 'status') !== 'SUCCESS') {
    throw new InvalidLoginOrPasswordError('Не удалось войти: неверный SMS-код или истёк срок ожидания.')
  }
  return {
    token: getString(response.body, 'token'),
    refresh: getString(response.body, 'refresh')
  }
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  const response = await callJson(`${MOBILE_HOST}/ncs-mobile/rest/v1/accounts`, {
    method: 'GET'
  }, session)
  if (response.status === 401) {
    throw new SessionExpiredError()
  }
  if (response.status !== 200) {
    throw new Error(`Cifra Bank: failed to fetch accounts (${response.status})`)
  }
  return Array.isArray(response.body) ? response.body : []
}

export async function fetchCardOperations (
  session: Session,
  accountId: number,
  fromDate: Date,
  toDate: Date
): Promise<unknown[]> {
  return await fetchOperations(session, '/ncs-mobile/rest/v1/card/sca-operations/', accountId, fromDate, toDate)
}

export async function fetchAccountStatement (
  session: Session,
  accountId: number,
  fromDate: Date,
  toDate: Date
): Promise<unknown[]> {
  return await fetchOperations(session, '/ncs-mobile/rest/v1/accounts/statement/', accountId, fromDate, toDate)
}

async function fetchOperations (
  session: Session,
  path: string,
  accountId: number,
  fromDate: Date,
  toDate: Date
): Promise<unknown[]> {
  const params = [
    `accountId=${accountId}`,
    'order=desc',
    `dateFrom=${formatRangeDate(fromDate, 'start')}`,
    `dateTo=${formatRangeDate(toDate, 'end')}`
  ].join('&')
  const response = await callJson(`${MOBILE_HOST}${path}?${params}`, {
    method: 'GET'
  }, session)
  if (response.status === 401) {
    throw new SessionExpiredError()
  }
  if (response.status !== 200) {
    throw new Error(`Cifra Bank: failed to fetch operations from ${path} (${response.status})`)
  }
  return Array.isArray(response.body) ? response.body : []
}

// The bank expects local-time bounds formatted as "YYYY-MM-DD HH:MM:SS".
function formatRangeDate (date: Date, edge: 'start' | 'end'): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const time = edge === 'start' ? '00:00:01' : '23:59:00'
  // URL-encode the space between date and time as '+'.
  return encodeURIComponent(`${y}-${m}-${d} ${time}`).replace(/%20/g, '+')
}

export class SessionExpiredError extends Error {
  constructor () {
    super('Cifra Bank session expired')
  }
}
