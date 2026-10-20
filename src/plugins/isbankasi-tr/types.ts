import { Account } from '../../types/zenmoney'

export interface Preferences {
  login: string
  password: string
  startDate?: string
}

export interface DeviceIdentity {
  deviceId: string
  androidId: string
  manufacturer: string
  model: string
  osVersion: string
}

export interface CookieStore {
  JSESSIONID?: string
  osc?: string
  f5osc?: string
  softtechSessionId?: string
}

export interface AuthSession extends DeviceIdentity {
  version: 3
  accessToken: string
  refreshToken: string
  randNo?: string
  cookies: CookieStore
}

export interface AccountFetchParams {
  accountIndex: string
  accountType: number
}

export interface ConvertedAccount {
  account: Account
  fetchParams: AccountFetchParams
}

export interface StoredAuthRejectionContext {
  status: number
  code: string
}

export class StoredAuthRejectedError extends Error {
  readonly context: StoredAuthRejectionContext

  constructor (context: StoredAuthRejectionContext) {
    super('Stored İşCep authorization is no longer usable')
    this.name = 'StoredAuthRejectedError'
    this.context = context
  }
}
