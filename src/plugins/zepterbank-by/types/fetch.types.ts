import type { BaseFetchInput } from './base.types'

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
  /** 1 for card accounts, 5 for standalone **/
  contractType: 1 | 5
  contractKindName: string
  status: string
  ibanNum: string
  contractNumber: string
  /** Account unique ID **/
  productId: string
}

export interface FetchCardAccount extends FetchAccountBase {
  /**
   * Masked card number
   * @example XXXX********XXXX
   * **/
  cardPAN: string
  /** YYYY-MM-DD **/
  expiryDate: string

  cardProductKindName: string

  /** BETRAY / ? **/
  stateSignature: string

  amount: string
  currency: number
  currencyIso: string

  productCardId: string
}

export interface FetchCurrentAccount extends FetchAccountBase {
  contractCurrency: number
  contractCurrencyIso: string
  /** IBAN */
  contractAccount: string
  /** Balance **/
  contractCurrentRest: string
}

export interface FetchAccountsInput extends BaseFetchInput {}

export interface FetchAccountsOutput {
  products: {
    cards: FetchCardAccount[]
    accounts: FetchCurrentAccount[]
  }
}

/**
 *
 * TRANSACTIONS
 *
 * **/

export interface FetchCardTransaction {
  /** ISO string **/
  'effectiveDate': string
  /** What transaction is **/
  'transacName': string
  'amount': string
  'currencyIso': string
  /** Place of payment **/
  'cardAcceptor': string
  'repeatable': false
  /** credit - income, debit - outcome **/
  'transOperType': 'debit' | 'credit'
  /**
   * MCC code (MCC is cyrillic)
   * @example MCC0000
   * **/
  'transMcc': string
}

export interface FetchTransactionsInput extends BaseFetchInput {
  /** YYYY-MM-DD **/
  from: string
  /** YYYY-MM-DD **/
  to: string
  cardId: string
}

export interface FetchStatementOperation {
  /** ISO string **/
  transactionDate: string
  balanceDate: string
  operationName: string
  operationSign: 1 | -1
  /** (in transaction currency) **/
  transactionSum: string
  transactionCurrency: string
  transactionCurrencyISO: string
  /** (in account currency) **/
  operationSum: string
  operationCurrency: string
  operationCurrencyIso: string
  purpose?: string
  /**
   * Masked card number
   * @example XXXX********XXXX
   * **/
  cardPAN?: string
  /**
   * Payment location
   * @example BLR MINSK
   *  **/
  merchant?: string
  terminalLocation?: string
  /**
   * MCC code (MCC is latin)
   * @example MCC 0000
   * **/
  MCC?: string
}

export type FetchTransactionsOutput = FetchCardTransaction[]

export interface FetchProductStatementInput extends BaseFetchInput {
  /** YYYY-MM-DD **/
  from: string
  /** YYYY-MM-DD **/
  to: string
  /** Account ID **/
  productId: string
}

export interface FetchProductStatementOutput {
  incomeForPeriod: string
  outcomeForPeriod: string
  ibanNum: string
  contractCurrency: string
  contractCurrencyISO: string
  operations: FetchStatementOperation[]
}
