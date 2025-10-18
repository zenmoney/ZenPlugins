import type { BaseFetchInput } from './base'

/**
 *
 * AUTHENTICATE
 *
 * **/

export interface AuthenticateInput {
  login: string
  password: string
}

export interface AuthenticateOutput {
  sessionToken: string
}

/**
 *
 * ACCOUNTS
 *
 * **/

export interface FetchAccountBase {
  /** IBAN-like account number? **/
  accountNumber: string
  contractNumber: string
  contractNumberHash: string
  /** 1 for card accounts, 5 for standalone **/
  contractType: 1 | 5
  currency: string
  ibanNum: string
  /** Account open date in Unix-timestamp **/
  openDate: number
  productCode: number
  /** Marketing product name **/
  productName: string
}

export interface FetchCard {
  /** First and last 4 digits **/
  cardNumberMasked: string
  cardHash: string
  /** ACTIVE / ? **/
  cardStatus: string
  /** Expiration date in Unix-timestamp  **/
  expireDate: number
  /** Name on the card **/
  owner: string
  isVirtual: boolean
  balance: number
  currency: string
  /** BETRAY / ? **/
  stateSignature: string
  isAdditional: boolean
  cardId: number
  paySystemName: string
  productCode: number
  /** User-configured card name **/
  name: string
  /** 0 / ? **/
  komplatStatus: string
  contractNumber: string
}

export interface FetchCardAccount extends FetchAccountBase {
  cards: FetchCard[]
  isOverdraft: boolean
}

export interface FetchCurrentAccount extends FetchAccountBase {
  accruedInterest: number
  interestRate: number
  balanceAmount: number
  contractId: string
}

export interface FetchAccountsInput extends BaseFetchInput {}

export interface FetchAccountsOutput {
  cardAccount: FetchCardAccount[]
  currentAccount: FetchCurrentAccount[]
}

/**
 *
 * TRANSACTIONS
 *
 * **/

export interface FetchTransaction {
  contractNumber?: string
  /** BPC / ? **/
  payCode: string
  /** Datetime of payment in Unix-timestamp **/
  paymentDate: number
  /** Name of card from card in account **/
  sourceOfPayment?: string
  /** Place of payment or name of service / service point **/
  payName: string
  /** Пополнение / Списание / ? **/
  operationType: string
  mcc?: string
  /** Positive or negative number **/
  amount: number
  /** Currency code/name of operation **/
  currency: string
  /** Geolocation **/
  operationLocation?: string
  /** Place of payment **/
  servicePoint?: string
  rrn?: string
  /** В обработке / Исполнен / ? **/
  operationStatus: string
  operationId?: string
  paymentId?: string
  diType?: string
  commission?: number
  commissionCurrency?: string
  /** Masked card number / account contract number, to where transfer was completed **/
  personalAccount?: string
  authCode?: string
  attrRecords?: Array<{
    code: string
    name: string
    value: string
  }>
}

export interface FetchTransactionsInput extends BaseFetchInput {
  from: number
  to: number
}

export interface FetchTransactionsOutput {
  operationHistory: FetchTransaction[]
}
