import { Account } from '../../types/zenmoney'

export interface Preferences {
  token: string
}

export interface Auth {
  token: string
  accessUrl: string
}

export interface SimpleFinConnection {
  connId: string
  name?: string
  orgName?: string
  orgUrl?: string
  sfinUrl?: string
}

export interface SimpleFinAccount {
  id: string
  name: string
  connId?: string
  connName?: string
  currency: string
  balance: number
  availableBalance?: number
  balanceDate?: number
  transactions: SimpleFinTransaction[]
  extra?: Record<string, unknown>
}

export interface SimpleFinTransaction {
  id: string
  posted: number
  amount: number
  description: string
  transactedAt?: number
  pending?: boolean
  extra?: Record<string, unknown>
}

export interface SimpleFinAccountSet {
  connections: SimpleFinConnection[]
  accounts: SimpleFinAccount[]
}

export interface SimpleFinAccountWithConnection {
  account: Account
  apiAccount: SimpleFinAccount
  connection?: SimpleFinConnection
}
