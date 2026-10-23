export interface Preferences { login: string }

export interface BankAccount {
  number: string
  title: string
  currency: string
  current: number
  available: number
  index: string
}

export interface FetchParams { index: string }

export interface BankTransaction {
  id: string
  fields: Record<string, string>
}

export interface HistoryPage {
  transactions: BankTransaction[]
  current: number
  pages: number
  elements: number
  csrf: string
  fields: Array<[string, string]>
  maxDate: number
}

export interface LoginPage {
  fields: Array<[string, string]>
  polling: boolean
  confirmationCode: string
}
