import { AccountOrCard } from '../../types/zenmoney'

// Persisted between syncs (currently unused — bank refresh-token requires
// device-bound material that we cannot reproduce, so we re-auth via SMS each sync).
export interface Auth {
  refresh?: string
}

// Active session, populated on each sync
export interface Session {
  token: string
  refresh: string
  expiresAt: number
}

export interface Preferences {
  phone: string
  cardNumber: string
  startDate: string
}

export interface Product {
  // numeric account id used by the operations endpoints
  id: number
  // Cifra Bank's subtype: CARD / CURRENT / etc. Selects the operations endpoint.
  subtype: string
}

export interface ConvertedAccount {
  account: AccountOrCard
  products: Product[]
}
