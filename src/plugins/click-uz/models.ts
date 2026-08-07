import { AccountOrCard } from '../../types/zenmoney'

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

export interface Product {
  id: string
  cardType: string
}

export interface ConvertResult {
  account: AccountOrCard
  products: Product[]
}

export const APP_VERSION = '8.50.4'
