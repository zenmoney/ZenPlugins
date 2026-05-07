import { Account, Transaction } from '../../types/zenmoney'

export interface Auth {
  deviceId: string
}

export interface Preferences {
  login: string
  password: string
}

export interface StatementAccount {
  id: string
  balance: number
  instrument: string
  cardNumber: string | null
}

export interface StatementTransaction {
  date: string
  time: string
  category: string
  details: string
  amount: number
  instrument: string
  isCardOperation: boolean
  originString: string
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
