import { Account, Transaction } from '../../types/zenmoney'

export type OtpDevice = 'SMS_OTP' | 'TOKEN_GEMALTO' | 'TOKEN_VASCO'

export interface Device {
  androidId: string
  model: string
  manufacturer: string
  device: string
}

export interface Auth {
  device: Device
  passcode: string
  registrationId: string
  trustedRegistrationId: string
}

export interface Session {
  auth: Auth
  ibsAccessToken: string
}

export interface Preferences {
  login: string
  password: string
}

export interface FetchedAccountLoan {
  tag: 'account' | 'loan'
  product: unknown
}

export interface FetchedDeposit {
  tag: 'deposit'
  product: unknown
  depositProduct: unknown
  details: unknown
}

export type FetchedAccount = FetchedAccountLoan | FetchedDeposit

export interface FetchedAccounts {
  accounts: FetchedAccount[]
  debitCardsWithBlockations: unknown[]
  creditCardsWithBlockations: unknown[]
  creditCards: unknown[]
}

export interface ConvertedCard {
  tag: 'card'
  coreAccountId: number
  account: Account
  holdTransactions: Transaction[]
}

export interface ConvertedCreditCard {
  tag: 'card'
  coreAccountId: number
  account: Account
  holdTransactions: Transaction[]
}

export interface ConvertedAccount {
  tag: 'account'
  coreAccountId: number
  account: Account
}

export interface ConvertedLoan {
  tag: 'loan'
  account: Account
}

export interface ConvertedDeposit {
  tag: 'deposit'
  depositId: number
  account: Account
}

export type ConvertedProduct = ConvertedAccount | ConvertedCard | ConvertedLoan | ConvertedDeposit | ConvertedCreditCard

export const APP_VERSION = '6.60.6'
export const OS_VERSION = '10'
