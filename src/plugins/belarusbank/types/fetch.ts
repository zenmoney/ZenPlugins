export interface ErrorInfo {
  code?: string | number
  errorText?: string
  errorDescription?: string
}

export interface ErrorResponse {
  errorInfo?: ErrorInfo
  error?: {
    errorInfo?: ErrorInfo
  }
}

export interface LoginRequest {
  appVersion: string
  deviceModel: string
  deviceUid: string
  login?: string
  mobilePhone?: string
  osType: string
  osVersion: string
  password: string
  token: string
}

export interface LoginPreparationResponse extends ErrorResponse {
  requestId: string
  sendCodeResponse?: unknown
  needCodeWord?: boolean
}

export interface LoginResponse extends ErrorResponse {
  sessionToken?: string
  token?: string
  refreshToken?: string
  firstName?: string
  tokenType?: string
}

export type ApiMoney = string | number

export interface Card {
  productId: string | number
  productCardId?: string | number
  cardPAN?: string
  cardProductKindName?: string
  name?: string
  expiryDate?: string
  amount?: ApiMoney
  currencyIso?: string | number
  ibanNum?: string
  cardAccountNumber?: string
  contractNumber?: string
  status?: string | number
  isArchived?: boolean
  blocked?: boolean
  temporarilyBlocked?: boolean
  isOrdered?: boolean
  markBalance?: boolean
  viewRights?: string
  serviceRights?: string
  userErrorHintMessages?: Record<string, string>
}

export interface CardsResponse extends ErrorResponse {
  cards?: Card[]
}

export interface BankAccount extends ErrorResponse {
  productId: string | number
  name?: string
  ibanNum?: string
  contractCurrency?: string
  contractCurrencyIso?: string | number
  contractCurrentRest?: ApiMoney
  contractNumber?: string
  contractKindName?: string
  status?: string | number
  statusName?: string
  isArchived?: boolean
  contractOpenDate?: string
  contractCloseDate?: string
  contractEndDate?: string
  returnDate?: string
  percRate?: ApiMoney
  markBalance?: boolean
}

export interface AccountsResponse extends ErrorResponse {
  accounts?: BankAccount[]
}

export interface Credit extends ErrorResponse {
  productId: string | number
  name?: string
  ibanNum?: string
  contractNumber?: string
  contractCurrency?: string
  contractCurrencyIso?: string | number
  contractFirstSum?: ApiMoney
  percRate?: ApiMoney
  restCredit?: ApiMoney
  restPerc?: ApiMoney
  restOverdue?: ApiMoney
  percSumForClose?: ApiMoney
  contractOpenDate?: string
  returnDate?: string
  status?: string | number
  statusName?: string
  isArchived?: boolean
  markBalance?: boolean
}

export interface CreditsResponse extends ErrorResponse {
  credits?: Credit[]
}

export type OperationDirection = 'debit' | 'credit' | 'DEBIT' | 'CREDIT'

export interface CardTransaction {
  id: string | number
  transactionDescription?: string
  operationDirection: OperationDirection
  amount: ApiMoney
  currency?: string | number
  amountInAccountCurrency?: ApiMoney
  accountCurrency?: string | number
  authorizationDate: string
  accountNumber?: string
  transactionType?: string
  mcc?: string | number
  terminalAddress?: string
  merchantCountry?: string
  merchantCity?: string
  merchantName?: string
  rrn?: string
}

export interface CardTransactionsResponse extends ErrorResponse {
  dataTable?: CardTransaction[]
  total?: number
}

export interface PaymentHistoryItem {
  id: string | number
  paymentName?: string
  amount: ApiMoney
  feeAmount?: ApiMoney
  currency?: string | number
  time: string
  cardNumber?: string
  cardAccount?: string
  channelTypeId?: string | number
  rrn?: string | number
  approvalId?: string | number
  paymentId?: string | number
  paymentIdLeaf?: string | number
  statusType?: string
  timeBpc?: string
}

export interface PaymentHistoryResponse extends ErrorResponse {
  dataTable?: PaymentHistoryItem[]
  total?: number
}
