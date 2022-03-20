export enum AccountType {
  cash = 'cash',
  ccard = 'ccard',
  checking = 'checking',
  deposit = 'deposit',
  loan = 'loan',
  investment = 'investment'
}

export interface AccountOrCard {
  id: string
  type: AccountType.ccard | AccountType.checking | AccountType.investment
  title: string
  instrument: string
  syncIds: string[]
  savings?: boolean
  balance?: number | null
  available?: number | null
  creditLimit?: number | null
  totalAmountDue?: number | null
  gracePeriodEndDate?: Date | null
}

export interface DepositOrLoan {
  id: string
  type: AccountType.deposit | AccountType.loan
  title: string
  instrument: string
  syncIds: string[]
  balance: number | null
  startDate: Date
  startBalance: number
  capitalization: boolean
  percent: number
  endDateOffsetInterval: 'month' | 'year' | 'day'
  endDateOffset: number
  payoffInterval: 'month' | null
  payoffStep: number
}

export type Account = AccountOrCard | DepositOrLoan

export interface AccountReferenceById {
  id: string
}

export interface AccountReferenceByData {
  type: AccountType | null
  instrument: string
  company: {
    id: string
  } | null
  syncIds: string[] | null
}

export interface Amount {
  sum: number
  instrument: string
}

export interface Location {
  latitude: number
  longitude: number
}

export interface Merchant {
  country: string | null
  city: string | null
  title: string
  mcc: number | null // https://ru.wikipedia.org/wiki/Merchant_Category_Code
  location: Location | null
}

export interface NonParsedMerchant {
  fullTitle: string
  mcc: number | null
  location: Location | null
}

export interface Movement {
  id: string | null
  account: AccountReferenceById | AccountReferenceByData
  invoice: Amount | null
  sum: number | null
  fee: number
}

export interface Transaction {
  hold: boolean | null
  date: Date
  movements: [Movement] | [Movement, Movement]
  merchant: Merchant | NonParsedMerchant | null
  comment: string | null
  groupKeys?: string[]
}

export type ScrapeFunc<T> = (args: {
  fromDate: Date
  toDate?: Date
  preferences: T
  isFirstRun: boolean
  isInBackground: boolean
}) => Promise<{
  accounts: Account[]
  transactions: Transaction[]
}>
