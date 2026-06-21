import { Transaction } from '../../types/zenmoney'

export interface SimbankStatementAccount {
  id: string
  title: string
  /**
   * Own-funds balance = the "Баланс после операции" of the last transaction (negative
   * = debt to the bank). Taken from the table, not a header label, so it's
   * language-independent. available = balance + creditLimit (see convertAccount).
   */
  balance: number
  /** Established credit/overdraft limit ("Сумма установленного лимита"), or null if none. */
  creditLimit: number | null
  /** Amount of the limit currently owed ("Сумма использованного лимита"), or null. */
  usedLimit: number | null
  instrument: string
  /** Statement period-end date in ISO form (informational). */
  date: string
}

export interface SimbankStatementTransaction {
  /** ISO date-time, e.g. '2025-12-21T09:49:14.000' */
  date: string
  /** Raw "Сумма" cell as printed (already signed, e.g. '-579,48' or '+0,01'). */
  amount: string
  /** Raw "Баланс после операции" cell as printed (e.g. '47 090,52', '-1 232,84'). */
  balance: string
  /** Raw "Детали операции" text (may have spanned several lines in the PDF). */
  description: string
  /** Deterministic, re-export-stable id (hash of the raw row). */
  uid: string
  /** Raw row joined for debugging / hashing provenance. */
  originString: string
}

export interface TransactionWithId {
  transaction: Transaction
  uid: string
}

export interface Preferences {
  startDate: string
}

export type RawAccountAndTransactions = Array<{
  account: SimbankStatementAccount
  transactions: SimbankStatementTransaction[]
}>
