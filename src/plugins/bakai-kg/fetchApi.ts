import crypto from 'crypto-js'
import { fetchJson } from '../../common/network'
import { AuthState, CardFetchParams } from './models'

const BASE_URL = 'https://bakai24.bakai.kg/v2/'
const secretFields = new Set([
  'authorization', 'cookie', 'set-cookie', 'password', 'password2', 'password3',
  'token', 'access_token', 'refresh_token', 'otp', 'phone', 'login', 'username',
  'device_id', 'fullname', 'surname', 'patronymic', 'email', 'inn', 'avatar',
  'passport', 'address', 'push_token'
])

function sanitizeValue (value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value === null || typeof value !== 'object') return value
  const input = value as Record<string, unknown>
  return Object.fromEntries(Object.entries(input).map(([key, item]) => {
    const sensitiveName = key === 'name' && ('token' in input || 'customer_id' in input)
    const approvalCode = key === 'codes' || (key === 'code' && 'verified' in input)
    const fullPan = (key === 'card_num' || key === 'pan') && typeof item === 'string' && /^\d{13,19}$/.test(item.replace(/\s/g, ''))
    return [key, secretFields.has(key.toLowerCase()) || sensitiveName || approvalCode || fullPan ? '<redacted>' : sanitizeValue(item)]
  }))
}

export function sanitizeBody (value: unknown): unknown {
  return typeof value === 'string' ? '<unparsed bank response>' : sanitizeValue(value)
}

async function request (endpoint: string, state: AuthState, payload: Record<string, unknown>, authenticated = true): Promise<unknown> {
  const device = ZenMoney.device
  const body = {
    ...payload,
    platform: 'ios',
    device: `Zenmoney | ${device.manufacturer} ${device.model} | ${device.os.name} ${device.os.version}`,
    device_id: state.deviceId,
    version: '5.1.9.15',
    lang: 'ru-RU',
    mode: 'BAKAI'
  }
  const headers: Record<string, string> = {
    Origin: 'bakai://bakai.app',
    'Content-Type': 'application/json'
  }
  if (authenticated) {
    assert(state.token !== null, 'Authenticated request requires a token')
    headers.Authorization = `Basic ${crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(`${state.deviceId}:${state.token}`))}`
  }
  const response = await fetchJson(BASE_URL + endpoint, {
    method: 'POST',
    body,
    headers,
    parse: (raw: string): unknown => {
      try {
        return JSON.parse(raw)
      } catch {
        // JSON parser errors can quote a credential-bearing response fragment.
        throw new Error('Invalid bank JSON response')
      }
    },
    sanitizeRequestLog: { headers: { Authorization: true, Cookie: true, 'Set-Cookie': true }, body: sanitizeBody },
    sanitizeResponseLog: { headers: { Authorization: true, Cookie: true, 'Set-Cookie': true }, body: sanitizeBody }
  })
  assert(response.status === 200, 'Unexpected bank HTTP response', { endpoint, status: response.status })
  return response.body
}

export async function fetchLogin (state: AuthState, phone: string): Promise<unknown> {
  return await request('get_login', state, { phone }, false)
}

export async function fetchAuthorization (state: AuthState, payload: Record<string, string>): Promise<unknown> {
  return await request('auth', state, payload, false)
}

export async function fetchVerifyOtp (state: AuthState, otp: string): Promise<unknown> {
  return await request('verify_otp', state, { otp })
}

export async function fetchConfirmation (state: AuthState): Promise<unknown> {
  return await request('users.check_confirmation', state, {})
}

export async function fetchSendOtp (state: AuthState): Promise<unknown> {
  assert(state.token !== null, 'OTP request requires a token')
  return await request('ask_otp', state, { token: state.token })
}

export async function fetchAllAccounts (state: AuthState): Promise<unknown> {
  return await request('account.get_list', state, { inactive: true })
}

export async function fetchBalance (state: AuthState, accountId: number): Promise<unknown> {
  return await request('account.get_balance', state, { id: accountId })
}

export async function fetchAccountStatement (state: AuthState, accountId: number, start: string, end: string): Promise<unknown> {
  return await request('account.history', state, { account_id: accountId, datbeg: start, datend: end, search: '' })
}

export async function fetchStatement (state: AuthState, params: CardFetchParams, start: string, end: string): Promise<unknown> {
  return await request('card.online_statement', state, {
    card_id: params.cardId, account_id: params.accountId, datbeg: start, datend: end, search: ''
  })
}
