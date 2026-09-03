import type { Account } from '../../types/zenmoney'

export const BASE_API_URL = 'https://mb.asb.by/ibanking/'
export const APP_VERSION = '2026.3.0'
export const AUTH_DATA_KEY = 'belarusbankAuth'
export const DEVICE_UID_DATA_KEY = 'belarusbankDeviceUid'

export interface PreferenceInput {
  login: string
  password: string
}

export interface AuthState {
  login: string
  sessionToken: string
  refreshToken: string
  tokenType: string
}

export type ProductKind = 'card' | 'account' | 'deposit' | 'credit'

export interface ProductMeta {
  productId: string
  transactionCardId: string | null
  statementProductId: string | null
  cardTransactionsAllowed?: boolean
  cardStatementAllowed?: boolean
  productKind: ProductKind
}

export type ProductAccount = Account & { _meta: ProductMeta }
