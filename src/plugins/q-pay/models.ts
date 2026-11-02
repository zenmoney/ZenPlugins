import type { Account } from '../../types/zenmoney'
import { getOptArray, getOptBoolean, getOptNumber, getOptString } from '../../types/get'

/** The current application authenticates by email code, MFA and PIN. */
export interface Preferences {
  email: string
  // Required by the shared ZenPlugins date adapter and exposed in preferences.xml.
  startDate?: string
}

export interface Device {
  id: string
  fingerprint: string
}

export interface Authorization {
  accessToken: string
  refreshToken: string
  expiresAt: number
  stage: 'active' | 'pending_mfa' | 'pending_pin'
  methods: string[]
  /** Whether the server offers Forgot PIN recovery for a pending PIN stage. */
  pinReset: boolean
}

/** Versioned authorization; old password-app tokens cannot authorize the new API. */
export interface Session extends Authorization {
  version: 2
  email: string
  tenantId: string
  device: Device
}

export type QPayFetchParams = { kind: 'wallet' } | { kind: 'card', cardId: string }

export type QPayAccountPlan =
  { accounts: Account[], fetchParams: { kind: 'wallet' } } |
  { account: Account, fetchParams: { kind: 'card', cardId: string } }

export interface Page {
  items: unknown[]
  nextCursor: string | null
}

/** Normalize credentials only when a new email challenge is necessary. */
export function normalizeEmail (email: string): string {
  return typeof email === 'string' ? email.trim() : ''
}

/** Validate untrusted session data loaded from ZenMoney storage. */
export function isSession (value: unknown): value is Session {
  const stage = getOptString(value, 'stage')
  const methods = getOptArray(value, 'methods')
  return getOptNumber(value, 'version') === 2 &&
    ['email', 'tenantId', 'accessToken', 'refreshToken', 'device.id', 'device.fingerprint']
      .every(key => (getOptString(value, key)?.length ?? 0) > 0) &&
    Number.isFinite(getOptNumber(value, 'expiresAt')) &&
    (stage === 'active' || stage === 'pending_mfa' || stage === 'pending_pin') &&
    methods != null && methods.every(method => typeof method === 'string') &&
    getOptBoolean(value, 'pinReset') != null
}

export const QPAY_BASE_URL = 'https://pay.quantera.pro/api/v1'

export const QPAY_ENDPOINTS = {
  config: '/configs/resolve?host=pay.quantera.pro',
  sendEmail: '/auth/email-otp/send',
  verifyEmail: '/auth/email-otp/verify',
  pin: '/auth/login/pin',
  sendMfa: '/auth/login/mfa/send',
  mfa: '/auth/login/mfa',
  refresh: '/auth/refresh',
  wallet: '/wallet',
  cards: '/cards',
  operations: '/operations'
}
