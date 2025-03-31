import { AccountOrCard } from '../../types/zenmoney'

// Stored in persistent storage
export interface Auth {
  deviceUUID: string
  appVersion: string
  deviceReg: string
}

// Consists of everything that is needed in
// authorized requests, e.g. socket handles, session tokens
// Not stored!
export interface Session {
  auth: Auth
  token: string
  refNo: string
  deviceKey: string
}

// Input preferences from schema in preferences.xml
export interface Preferences {
  username: string
  password: string
}

export interface Product {
  id: string
  accountType: string
}

export interface ConvertResult {
  products: Product[]
  account: AccountOrCard
}

export enum ApiResponseCode {
  SUCCESS = 200,
  TECHNICAL_DIFFICULT = 500,
  OTP_REQUIRED = 6001,
  NEED_UPGRADE_APP_VERSION = 6777,
}

export enum AccountType {
  SpendAccount = '1025',
  GoalSave = '1026',
  TermDeposit = '1027',
  MoneyPot = '1028',
  CreditCard = '9999',
  CreditCardOnline = '8888',
  SplitBill = '1910',
  SchedulePaymnet = '1909',
  ChubbInsurance = '6511',
}
