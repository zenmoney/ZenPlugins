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

export interface FetchCardAccount {
  currency: string
  /** Account open date in Unix-timestamp **/
  openDate: number
  /** IBAN-like account number? **/
  accountNumber: string
  productCode: number
  /** Marketing product name **/
  productName: string
  contractNumber: string
  cards: Array<{
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
  }>
  ibanNum: string
  contractType: number
  isOverdraft: boolean
  contractNumberHash: string
}

export interface FetchAccountsInput extends BaseFetchInput {}

export interface FetchAccountsOutput {
  cardAccount: FetchCardAccount[]
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
  /** Currency code of operation **/
  currency: string | number
  /** Geographical location **/
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
}

export interface FetchTransactionsInput extends BaseFetchInput {
  from: number
  to: number
}

export interface FetchTransactionsOutput {
  operationHistory: Array<FetchTransaction>
}
