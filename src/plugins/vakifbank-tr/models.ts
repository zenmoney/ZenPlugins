import { Transaction } from '../../types/zenmoney'

export interface Auth {
  deviceId: string
}

export interface VakifStatementAccount {
  id: string
  title: string
  balance: number
  instrument: string
  date: string
}

export interface VakifStatementTransaction {
  date: string
  balance: string
  amount: string
  description1: string | null
  description2: string | null
  statementUid: string
  originString: string
}

export interface TransactionWithId {
  transaction: Transaction
  statementUid: string
}

export interface ObjectWithAnyProps {
  [key: string]: unknown
}

export interface Preferences {
  login: string
  password: string
}

export type RawAccountAndTransactions = Array<{
  account: VakifStatementAccount
  transactions: VakifStatementTransaction[]
}>
