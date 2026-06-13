import { fetchAccountStatement, fetchAccounts as fetchAccountsRaw, fetchCardOperations, fetchLogonWithSmsCode, fetchPassRequest, SessionExpiredError } from './fetchApi'
import { Auth, Preferences, Product, Session } from './models'

interface DecodedAccessToken {
  exp: number
}

function decodeAccessToken (token: string): DecodedAccessToken | null {
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

function buildSession (tokens: { token: string, refresh: string }): Session {
  const decoded = decodeAccessToken(tokens.token)
  return {
    token: tokens.token,
    refresh: tokens.refresh,
    expiresAt: decoded?.exp ?? Math.floor(Date.now() / 1000) + 60
  }
}

async function loginInteractively (preferences: Preferences): Promise<Session> {
  const passRequestId = await fetchPassRequest(preferences.phone, preferences.cardNumber)
  const smsCode = await ZenMoney.readLine('Введите код из SMS от Цифра Банка', {
    inputType: 'number',
    time: 120000
  })
  if (smsCode == null || smsCode.length === 0) {
    throw new Error('Не удалось получить код подтверждения')
  }
  const tokens = await fetchLogonWithSmsCode(preferences.phone, passRequestId, smsCode)
  return buildSession(tokens)
}

// The bank's refresh-token endpoint requires a device-bound payload that the
// mobile app constructs from PIN-encrypted material; we do not have an analogue,
// so every plugin run authenticates via SMS. The Auth blob is therefore empty
// today, but is preserved as an extension point for a future flow.
export async function login (preferences: Preferences, _auth?: Auth): Promise<Session> {
  return await loginInteractively(preferences)
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  return await fetchAccountsRaw(session)
}

export async function fetchTransactions (
  session: Session,
  product: Product,
  fromDate: Date,
  toDate: Date
): Promise<unknown[]> {
  try {
    if (product.subtype === 'CARD') {
      return await fetchCardOperations(session, product.id, fromDate, toDate)
    }
    return await fetchAccountStatement(session, product.id, fromDate, toDate)
  } catch (e) {
    if (e instanceof SessionExpiredError) {
      // Re-throw so the surrounding scrape can decide; consumers can chain to a relogin later if needed.
      throw e
    }
    throw e
  }
}
