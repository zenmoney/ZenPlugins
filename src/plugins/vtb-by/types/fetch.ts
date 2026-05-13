import type { ResponseWithErrorInfo } from './base'

export interface AuthenticateInput {
  login: string
  password: string
}

export interface AuthenticateOutput extends ResponseWithErrorInfo {
  sessionToken: string
}

export interface FetchCard {
  cardNumberMasked: string
  cardHash: string
  cardStatus: string
  cardStatusCode: number
  owner: string
  tariffName: string
  balance: number
  payment: string
  accountId: string
  stateSignature: string
  cardProductId: number
  cardId: number
  salary: boolean
  virtual: boolean
  cardType?: {
    name: string
    paySystemName?: string
  }
}

export interface FetchCardAccount {
  internalAccountId: string
  currency: string
  openDate: number
  accountNumber: string
  cardAccountNumber: string
  productCode: string
  productName: string
  contractId: string
  interestRate: number
  accountStatus: string
  cards: FetchCard[]
  ibanNum: string
}

export interface FetchCurrentAccount {
  internalAccountId: string
  currency: string
  openDate: number
  accountNumber: string
  productCode: string
  productName: string
  balanceAmount: number
  contractId: string
  interestRate: number
  accountStatus: string
  ibanNum: string
}

export interface FetchDepositAccount {
  internalAccountId: string
  currency: string
  openDate: number
  endDate: number
  accountNumber: string
  productCode: string
  productName: string
  balanceAmount: number
  contractId: string
  interestRate: number
  accountStatus: string
  ibanNum: string
  personalizedName?: string
}

export interface FetchAccountsOverviewOutput extends ResponseWithErrorInfo {
  overviewResponse: {
    cardAccount?: FetchCardAccount[]
    currentAccount?: FetchCurrentAccount[]
    depositAccount?: FetchDepositAccount[]
  }
}

export interface FetchCardStatementOperation {
  accountNumber: string
  operationName: string
  transactionDate: number
  operationDate: number
  transactionAmount: number
  transactionCurrency: string
  operationAmount: number
  operationCurrency: string
  operationSign: string
  actionGroup: number
  clientName?: string
  operationClosingBalance: number
  operationCode: number
  merchantName?: string
  mcc?: string
}

export interface FetchMiniCardStatementOperation {
  operationDate: number
  operationDescription: string
  operationAmount: number
  operationCurrency: string
  operationPlace?: string
  operationState: number
  transactionAmount: number
  transactionCurrency: string
  mcc?: number
  transactionAuthCode?: string
}

export interface FetchCardAccountFullStatementInput {
  sessionToken: string
  internalAccountId: string
}

export interface FetchMiniCardStatementInput {
  sessionToken: string
  cardHash: string
  from: number
  till: number
}

export interface FetchCardAccountFullStatementOutput extends ResponseWithErrorInfo {
  operations: FetchCardStatementOperation[]
  incomingBalance: number
  closingBalance: number
  debitAmount: number
  creditAmount: number
  accountNumber: string
  accountName: string
  accountCurrency: string
  ibanNumber: string
  incomeOverLimit: number
  outcomeOverLimit: number
  incomeForPeriod: number
  outcomeForPeriod: number
  lastActionDate: number
}

export interface FetchMiniCardStatementOutput extends ResponseWithErrorInfo {
  statement: FetchMiniCardStatementOperation[]
}
