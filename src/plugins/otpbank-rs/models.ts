import { AccountOrCard } from '../../types/zenmoney'

// Stored in persistent storage
export interface Auth {
  cookieHeader: string
}

// Consists of everything that is needed in
// authorized requests, e.g. socket handles, session tokens
// Not stored!
export interface Session {
  auth: Auth
  login: string
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

export interface OtpAccount {
  accountNumber: string
  description: string
  currencyCode: string
  balance: number
  currencyCodeNumeric: string
}

export interface OtpTransaction {
  date: Date
  title: string
  amount: number
  currencyCode: string
  currencyCodeNumeric: string
}

export interface AccountBalanceResponse {
  CurrencyCode: string
  CurrencyCodeNumeric: string
  BlockedAmount: number | null
  IBANNumber: string | null
  AccountID: number
  Balance: number
  AccountNumber: string
  Description: string | null
  AvailableBalance: number
}
