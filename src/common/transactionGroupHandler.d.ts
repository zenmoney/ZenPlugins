import { Account, Movement, Transaction } from '../types/zenmoney'

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type GroupHandler = (transactions: Transaction[], options: any) => void

export declare function adjustTransactions (args: {
  transactions: Transaction[]
  groupHandlers?: GroupHandler[]
}): Transaction[]

export declare function mergeTransfersHandler (transactions: Transaction[], options: {
  mergeComments: (outcome: { transaction: Transaction, movement: Movement }, income: { transaction: Transaction, movement: Movement }) => string | null
  shouldFillIncomeSum?: boolean
  shouldFillOutcomeSum?: boolean
  accountsById?: Record<string, Account | undefined>
}): Transaction[]
