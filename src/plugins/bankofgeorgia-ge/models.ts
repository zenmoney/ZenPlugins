import { Account } from '../../types/zenmoney'

export interface Device {
  model: string
  manufacturer: string
}

export interface Auth {
  device: Device
  passCode: string
  privateKey: string
  extCustomerId: string
  extDeviceId: string
  passcodeAuthToken: string
  tmp?: boolean
}

export interface Session {
  auth: Auth
  authorizationBearer: string
  accessToken: string
  refreshToken: string
  requestIndex: number
}

export interface Preferences {
  login: string
  password: string
}

export interface FetchedLoanDeposit {
  tag: 'loan' | 'deposit'
  product: unknown
  details: unknown
}

export interface FetchedChecking {
  tag: 'account'
  product: unknown
  details: unknown
  cards: unknown[]
}

export type FetchedAccount = FetchedLoanDeposit | FetchedChecking

export interface ConvertedAccount {
  tag: 'account' | 'deposit'
  acctKey: string
  account: Account
}

export interface ConvertedLoan {
  tag: 'loan'
  acctKey: string
  account: Account
}

export type ConvertedProduct = ConvertedAccount | ConvertedLoan

export const APP_VERSION = '5.8.3'
export const APP_BUILD = '424'
export const OS_VERSION = '10'
