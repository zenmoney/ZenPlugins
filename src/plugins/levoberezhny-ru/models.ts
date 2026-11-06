import { Account } from '../../types/zenmoney'

export interface Preferences {
  login?: string
  password?: string
  startDate?: string
  syncClosedLoansBeforeStartDate?: boolean
}

export interface LoanSyncOptions {
  fromDate: Date
  includeClosedBeforeStartDate: boolean
  syncedLoanIds: string[]
}

export interface StoredCookie {
  name: string
  value: string
  path: string
  expires: string | null
}

export interface Auth {
  cookieHeader: string
  cookies?: StoredCookie[]
  fingerprint: string
}

export interface Session extends Auth {
  persist: (auth: Auth) => void
}

export interface AccountPlan {
  account: Account
  fetchParams: { accountId: string, historyAvailable?: boolean }
  loanSchedule?: unknown
}

export interface BankProducts {
  accounts: unknown[]
  deposits: unknown[]
  loans?: Array<{ loan: unknown, schedule: unknown }>
}
