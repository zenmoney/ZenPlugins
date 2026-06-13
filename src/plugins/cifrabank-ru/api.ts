import {
  fetchAccountStatement,
  fetchAccounts as fetchAccountsRaw,
  fetchCardOperations,
  fetchLogonWithSmsCode,
  fetchPassRequest,
  fetchRefreshToken,
  fetchRelatedCards as fetchRelatedCardsRaw,
  SessionExpiredError
} from './fetchApi'
import { Auth, Preferences, Product, Session } from './models'

interface DecodedAccessToken {
  exp: number
}

export function decodeAccessToken (token: string): DecodedAccessToken | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4)
    const json = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8')) as { exp?: number }
    if (typeof json.exp !== 'number') {
      return null
    }
    return { exp: json.exp }
  } catch (e) {
    return null
  }
}

function buildSession (token: string, refresh: string): Session {
  const decoded = decodeAccessToken(token)
  return {
    token,
    refresh,
    expiresAt: decoded?.exp ?? Math.floor(Date.now() / 1000) + 60
  }
}

// 16-hex-char id matching the format the official mobile client sends.
export function generateDeviceId (): string {
  const bytes = new Uint8Array(8)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function loginInteractively (deviceId: string, preferences: Preferences): Promise<Session> {
  const passRequestId = await fetchPassRequest(deviceId, preferences.phone, preferences.cardNumber)
  const smsCode = await ZenMoney.readLine('Введите код из SMS от Цифра Банка', {
    inputType: 'number',
    time: 120000
  })
  if (smsCode == null || smsCode.length === 0) {
    throw new Error('Не удалось получить код подтверждения')
  }
  const tokens = await fetchLogonWithSmsCode(deviceId, preferences.phone, passRequestId, smsCode)
  return buildSession(tokens.token, tokens.refresh)
}

export async function login (preferences: Preferences, auth: Auth): Promise<Session> {
  if (auth.refresh != null && auth.refresh.length > 0) {
    const refreshed = await fetchRefreshToken(auth.deviceId, auth.refresh)
    if (refreshed != null) {
      return buildSession(refreshed, auth.refresh)
    }
    // Stored refresh token no longer works (revoked, expired, or rotated by a fresh logon
    // on the real device) — fall through to interactive SMS login.
  }
  return await loginInteractively(auth.deviceId, preferences)
}

export async function fetchAccounts (session: Session, deviceId: string): Promise<unknown[]> {
  return await fetchAccountsRaw(session, deviceId)
}

export async function fetchRelatedCards (session: Session, deviceId: string): Promise<unknown[]> {
  return await fetchRelatedCardsRaw(session, deviceId)
}

export async function fetchTransactions (
  session: Session,
  deviceId: string,
  product: Product,
  fromDate: Date,
  toDate: Date
): Promise<unknown[]> {
  if (product.subtype === 'CARD') {
    return await fetchCardOperations(session, deviceId, product.id, fromDate, toDate)
  }
  return await fetchAccountStatement(session, deviceId, product.id, fromDate, toDate)
}

export { SessionExpiredError }
