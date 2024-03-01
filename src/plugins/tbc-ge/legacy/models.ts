import { Account, AccountType, Movement, Transaction } from '../../../types/zenmoney'
export type OtpDevice = 'SMS_OTP' | 'TOKEN_GEMALTO' | 'TOKEN_VASCO'

export interface Signature {
  response: null
  status: string
  challenge: null
  regenerateChallengeCount: null
  authenticationAccessToken: null
  authenticationCode: null
  signer: null
  type: string
  authenticationCodeRsaPublicKey: null
  id: null
  otpId: string
}

export interface AccountOrDebitCard {
  id: number | null
  iban: string
  name: string
  description: string
  type: 'Card' | 'Saving'
  designUrl: string | null
  hasMultipleCards: boolean
  amount: number
  currency: string
}

export interface CardsAndAccounts {
  totalAmount: number
  totalAmountCurrency: string
  accountsAndDebitCards: AccountOrDebitCard[]
  creditCards: null
  childCards: null
  conversionFailed: boolean
}

export interface CoreAccountId {
  currency: string
  iban: string
  id: string
  type: number
}

export interface LoginResponse {
  signatures: Signature[] | null
  signature: null
  validEmail: boolean
  success: boolean
  passcodeDirty: null
  secondPhaseRequired: boolean // 2FA
  accessToken: null
  changePasswordRequired: boolean
  changePasswordSuggested: boolean
  userSelectionRequired: boolean
  transactionId: string
  linkedProfiles: null
  possibleChallengeRegenTypes: string[]
  cookies: string[]
}

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

export const APP_VERSION = '6.66.3'
export const OS_VERSION = '10'

export const PASSCODE = '12345'

export const COMPANY_ID = '15622'

export const createCashMovement = (currency: string, sum: number): Movement => {
  return {
    account: {
      company: null,
      instrument: currency,
      syncIds: null,
      type: AccountType.cash
    },
    fee: 0,
    id: null,
    invoice: null,
    sum
  }
}
