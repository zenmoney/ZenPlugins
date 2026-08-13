import { AccountOrCard } from '../../types/zenmoney'

// Persisted between syncs.
export interface Auth {
  // Stable per-install device id sent in the `getuniqueid` header on every request.
  deviceId: string
  // Long-lived refresh JWT (~6 months). Used to obtain a fresh access token
  // without re-running the SMS login flow.
  refresh?: string
}

// Active session, populated on each sync.
export interface Session {
  token: string
  refresh: string
  // Epoch seconds when the access token expires (taken from JWT `exp`).
  expiresAt: number
}

export interface Preferences {
  phone: string
  cardNumber: string
  startDate: string
}

export interface Product {
  // Numeric account id used by the operations endpoints.
  id: number
  // Cifra Bank's subtype: CARD / CURRENT / etc. Selects the operations endpoint.
  subtype: string
}

export interface ConvertedAccount {
  account: AccountOrCard
  products: Product[]
}
