export enum AccountType {
  cash = 'cash',
  ccard = 'ccard',
  checking = 'checking',
  deposit = 'deposit',
  loan = 'loan',
  investment = 'investment'
}

export interface AccountOrCard {
  // Unique (within synchronization) account id
  // Transactions linked to account by this id in AccountReferenceById
  id: string
  type: AccountType.ccard | AccountType.checking | AccountType.investment
  title: string
  instrument: string
  // Persistent unique account ids
  // Used to match accounts between synchronizations
  // Usually card number/IBAN can be
  syncIds: string[]
  // Is it savings account
  savings?: boolean
  // Can be null if can't be determined exactly
  balance?: number | null
  // available = balance + creditLimit
  available?: number | null
  creditLimit?: number | null
  totalAmountDue?: number | null
  gracePeriodEndDate?: Date | null
  archived?: boolean
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
  // deposit: is there capitalization
  // loan: is it annuity
  capitalization: boolean
  percent: number
  endDateOffsetInterval: 'month' | 'year' | 'day'
  endDateOffset: number
  payoffInterval: 'month' | null
  payoffStep: number
  // not active account
  archived?: boolean
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
  category?: string
}

export interface NonParsedMerchant {
  fullTitle: string
  mcc: number | null
  location: Location | null
  // Additional field, if there is no mcc
  // but there is some classification from bank
  // you can put this classification id here
  category?: string
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
}

export interface ExtendedTransaction extends Transaction {
  groupKeys?: string[]
}

// Plugin entrypoint function
// Should parse all accounts and transactions between fromDate and toDate
export type ScrapeFunc<T> = (args: {
  fromDate: Date
  toDate?: Date // nullish means parse till now
  preferences: T
  isFirstRun: boolean
  isInBackground: boolean
}) => Promise<{
  accounts: Account[]
  transactions: Transaction[]
}>
