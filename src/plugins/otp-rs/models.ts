import { AccountOrCard, Transaction } from '../../types/zenmoney'

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
  currencyCodeNumeric: string
  balance: number
}

export interface OtpTransaction {
  title: string,
  currencyCode: string, 
  currencyCodeNumeric: string,
  date: Date,
  amount: number
}

export interface AccountBalanceResponse {
  CurrencyCode: string
  // AccountType: string
  // IsEbankingAccount: string
  // LastChangeAmount: number
  // ID: number
  CurrencyCodeNumeric: string
  // LastChangeType: string
  // LastChangeDate: string
  BlockedAmount: number | null
  // AccountCustomName: string | null
  // SubsystemProductID: number | null
  // fwStatus: number
  // IsCASRegistrationForbidden: number
  IBANNumber: string | null
  // fwNamespace: string
  // ProductOrder: string | null
  // Alias: string | null
  AccountID: number
  // BansExist: number
  Balance: number
  AccountNumber: string
  // IsOwner: boolean
  Description: string | null
  // Blocked: string
  // FPAccountAllowed: boolean
  // ProductCodeCore: string
  AvailableBalance: number
  // fwType: string
}
