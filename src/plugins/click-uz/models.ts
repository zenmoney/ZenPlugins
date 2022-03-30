export interface Auth {
  imei: string
  deviceId: string
  authToken: string
  sessionKey: string
}

export interface Preferences {
  phone: string
  password: string
}

export interface FetchedAccounts {
  cards: unknown[]
  balances: unknown[]
}

export const APP_VERSION = '7.6.5'
