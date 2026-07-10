import { Transaction } from '../../types/zenmoney'

export interface Auth {
  deviceId: string
}

export interface MBankStatementAccount {
  id: string
  title: string
  balance: number
  instrument: string
  /** Statement generation date in ISO form (informational). */
  date: string
}

export interface MBankStatementTransaction {
  /** ISO date-time, e.g. '2026-05-28T20:42:00.000' */
  date: string
  /** Raw "Дебет" cell as printed in the file (e.g. '1 749,13'). */
  debit: string
  /** Raw "Кредит" cell as printed in the file (e.g. '0,00'). */
  credit: string
  /** Raw "Получатель/Плательщик" cell (column B), or null when generic/empty. */
  payee: string | null
  /** Raw "Операция" description (column E). */
  description: string
  /** Deterministic, re-export-stable id (hash of the raw row). */
  uid: string
}

export interface TransactionWithId {
  transaction: Transaction
  uid: string
}

export interface Preferences {
  startDate: string
}

export type RawAccountAndTransactions = Array<{
  account: MBankStatementAccount
  transactions: MBankStatementTransaction[]
}>
