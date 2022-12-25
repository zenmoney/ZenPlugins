import { AccountOrCard } from '../../types/zenmoney'

// Stored in persistent storage
export interface Auth {
  accessToken: string
}

// Consists of everything that is needed in
// authorized requests, e.g. socket handles, session tokens
// Not stored!
export interface Session {
  auth: Auth
}

// Input preferences from schema in preferences.xml
export interface Preferences {
  login: string
  password: string
}

export interface Product {
  id: string
  transactionNode: string
}

export interface ConvertResult {
  products: Product[]
  account: AccountOrCard
}
