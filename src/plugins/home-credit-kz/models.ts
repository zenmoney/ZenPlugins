import { Account, Transaction } from '../../types/zenmoney'

export interface Auth {
  deviceId: string
}

export interface Preferences {
  startDate: string
}

export type HomeCreditLocale = 'en' | 'kz' | 'ru'

export interface ParsedHeader {
  iban: string
  cardLast4: string
  statementDateIso: string
  balance: number
  locale: HomeCreditLocale
  statementKind: 'card' | 'deposit'
  productTitle?: string
  depositPeriodStart?: string
  depositPeriodEnd?: string
}

export interface StatementTransactionRaw {
  hold: boolean
  date: string
  originalAmount: string | null
  amount: string
  description: string | null
  statementUid: string
  originString: string
  operation: string
}

export interface StatementAccount {
  id: string
  title: string
  balance: number
  instrument: string
  date: string
  type: string
  startDate: string | null
  startBalance: number | null
  capitalization: string | null
  endDate: string | null
}

export interface StatementTransaction {
  hold: boolean
  date: string
  originalAmount: string | null
  amount: string
  description: string | null
  statementUid: string
  originString: string
}

export interface ConvertedAccount {
  account: Account
  date: Date
}

export interface ConvertedTransaction {
  transaction: Transaction
  statementUid: string
}
