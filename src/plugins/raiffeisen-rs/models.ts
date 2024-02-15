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

export interface LoginResponse {
  Username: string
  Ticket: string
  SocialIdentityNumber: string
  FirstName: string
  LastName: string
  FullName: string
}

export interface AccountBalanceResponse {
  CurrencyCode: string
  AccountType: string
  IsEbankingAccount: string
  LastChangeAmount: number
  ID: number
  CurrencyCodeNumeric: string
  LastChangeType: string
  LastChangeDate: string
  BlockedAmount: number | null
  AccountCustomName: string | null
  SubsystemProductID: number | null
  fwStatus: number
  IsCASRegistrationForbidden: number
  IBANNumber: string | null
  fwNamespace: string
  ProductOrder: string | null
  Alias: string | null
  AccountID: number
  BansExist: number
  Balance: number
  AccountNumber: string
  IsOwner: boolean
  Description: string | null
  Blocked: string
  FPAccountAllowed: boolean
  ProductCodeCore: string
  AvailableBalance: number
  fwType: string
}

export interface GetAccountTransactionsResponse {
  CurrencyCode: string
  TransactionID: string
  ProcessedDate: string
  CurrencyCodeNumeric: number
  ChequeCardNumber: string | null
  CreditAmount: number
  TransactionBeneficiary: string
  AccountNumber: string
  DebitAmount: number
  Reference: string
  Description: string
  Note: string
  ValueDate: string
  TransactionType: string
  Details: GetTransactionDetailsResponse
  [others: string]: string | number | null | GetTransactionDetailsResponse
}

export interface GetTransactionDetailsResponse {
  s_Note_st: string
  c_CurrencyCode_tx: string | null
  c_CalculationDate: string | null
  c_CardNumber: string | null
  s_ValueDate: string
  s_ProcessedDate: string
  s_CurrencyCodeNumeric: number
  c_DomesticAmount: number | null
  s_OrderNumber: string
  c_TerminalID: string | null
  c_DebtorDetails: string | null
  DebtorAccount: string | null
  m_DebtorAmount: number | null
  c_AuthorizationID: string | null
  s_CurrencyCode: string
  c_Reference: number | null
  s_PaymentBasis: number | null
  s_Group: string
  c_Date_tx: string | null
  s_ConfirmationDate: string
  s_Amount: number
  c_Amount_tx: number | null
  [others: string]: string | number | null
}
