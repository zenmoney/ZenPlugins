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
export type Preferences = Record<string, never>

export interface Product {
  id: string
  transactionNode: string
}

export interface ConvertResult {
  products: Product[]
  account: AccountOrCard
}

export type Locale = 'ru' | 'en' | 'kz'

export interface ParsedSections {
  header: string
  transactions: string
  attic: string
}

export interface ParsedHeader {
  accountNumber?: string
  currency?: string
  balance?: number
  // Deposit specific
  isDeposit?: boolean
  productName?: string
  percent?: number
  startDate?: string
  startBalance?: number
}

export interface ParsedTransactionDetails {
  merchantName?: string
  merchantLocation?: string
  merchantBank?: string
  paymentMethod?: string
  atmCode?: string
  receiver?: string
  receiverAccount?: string
  mcc?: number
  foreignAmount?: number
  foreignCurrency?: string
}

export interface ParsedTransaction {
  date: string
  amount: number
  description: string // Raw description for fallback/debugging
  operation: string
  details: string
  parsedDetails?: ParsedTransactionDetails
  mcc?: number // Kept for backward compatibility, but should be in parsedDetails
  originString: string
}
