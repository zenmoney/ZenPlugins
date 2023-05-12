import { Account, Transaction } from '../../types/zenmoney'

export interface Auth {
  deviceId: string
}

export interface Preferences {
  login: string
  password: string
}

export type FetchedAccountType = 'deposit' | 'loan' | 'gold' | 'red' | 'socialAccount'

export interface StatementAccount {
  id: string
  title: string
  balance: number
  instrument: string
  date: Date
}

export interface StatementTransaction {
  hold: boolean
  date: Date
  originalAmount: string | null
  amount: string
  description: string | null
  statementUid: string
}

export interface ConvertedAccount {
  account: Account
  date: Date
}

export interface ConvertedTransaction {
  transaction: Transaction
  statementUid: string
}

export interface ObjectWithAnyProps {
  [key: string]: unknown
}
