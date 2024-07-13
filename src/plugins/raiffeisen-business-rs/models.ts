import { AccountOrCard } from '../../types/zenmoney'

// Stored in persistent storage
export interface Auth {
  cookie: string
}

// Input preferences from schema in preferences.xml
export interface Preferences {
  login: string
  password: string
}

export interface RaiffAccount extends AccountOrCard {
  ProductCodeCore: string
}

export type AuthTicket = string
export type LegalEntitiesTicket = string

export interface LegalEntitiesResponse {
  Success: boolean
  Ticket: LegalEntitiesTicket
  LastSuccessfulLogon: string
  PinMustBeChanged: boolean
  PrincipalData: LegalEntity[]
  FailedAttempts: number | null
  WrongPassword: string | null
  UserTempBlocked: string | null
  UserBlocked: string | null
  TempBlockPeriodInMinutes: number | null
}

export interface LegalEntity {
  Name: string
  UserUniqueIdentifier: number
  LegalEntityID: number
  IsActive: boolean
  PrincipalID: number
}

export interface AccountBalanceResponse {
  ShortAccountNumber: string
  ProductDescriptionAL: string | null
  AccountType: string
  IsEbankingAccount: string | null
  OrganizationUnit: string
  ItemTypeOfLastChange: string | null
  CurrencyCode: string
  CurrencyCodeNumeric: string
  AccountNumber: string
  BlockedAmount: number | null
  AccountCustomName: string | null
  fwStatus: number
  LastChangeDate: string | null
  LastChangedAmount: number | null
  SubsystemProductID: string | null
  fwNamespace: string
  Status: string | null
  IBANNumber: string | null
  BankAccountID: number
  RetailAccountNumber: string | null
  AccountStatusDescription: string
  Balance: number
  AccountStatus: string
  OrderTypeName: string | null
  Group: string
  ID: number
  Blocked: string
  ProductDescriptionEN: string | null
  ProductCodeCore: string
  AvailableBalance: number
  fwType: string
}

export interface GetAccountTransactionsResponse {
  AccountNumber: string
  Reference: string
  CreditAmount: number
  DebitAmount: number
  Description: string | null
  Note: string | null
  DebtorCreditorName: string | null
  Trnben: string | null
  ValueDate: string
  CurrencyCode: string
  CurrencyCodeNumeric: string
  PaymentCode: string | number | null
  PBO: string | null
  [others: string]: string | number | null
}
