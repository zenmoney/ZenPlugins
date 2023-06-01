import { AccountOrCard } from '../../types/zenmoney'

// Stored in persistent storage
export interface Auth {
  accessToken: string
}

// Consists of everything that is needed in
// authorized requests, e.g. socket handles, session tokens
// Not stored!
export interface Session {
  auth: Auth
  operationId: string
}

// Input preferences from schema in preferences.xml
export interface Preferences {
  login: string
  password: string
}

export interface Product {
  id: string
  transactionNode: string
}

export interface ConvertResult {
  products: Product[]
  account: AccountOrCard
}

export enum LanguageType {
  english = 'ENGLISH',
  russian = 'RUSSIAN',
  georgian = 'GEORGIAN'
}

export enum State {
  ok = 'Ok'
}

export enum AuthStatus {
  pending = 'Pending'
}

export interface AuthInitiatePayload {
  username: string
  password: string
  channel: number
  deviceId: string | null
  refreshToken: string | null
  loggedInWith: number
  deviceName: string
  languageType: LanguageType
}

export interface AuthResponse {
  data: object
  message: string | null
  detailedMessage: string | null
  externalState: State
  state: State
  errorCode: number | null
  validationErrors: string | null
  isAuth: boolean
}

export interface AuthInitiateResponseData {
  operationId: string
  requires2FA: boolean
  requiresAuthentification: boolean
  status: AuthStatus
  operationData: string | null
}

export interface AuthInitiateResponse extends AuthResponse {
  data: AuthInitiateResponseData
}

export interface AuthUserPublicInfoRequest {
  username: string
}

export interface AuthUserResponseData {
  user_id: number
  name: string
  avatarImage: string | null
  mobile: string
}

export interface AuthUserPublicInfoResponse extends AuthResponse {
  data: AuthUserResponseData
}

export interface AuthOperationSendChallengeResponse {
  data: {
    operationSendChallenge: boolean
  }
}

export interface AuthConfirmResponseData {
  operationId: string | null
  approvalId: number
  triesLeft: number
  operationData: {
    name: string
    avatarImage: string | null
    mobile: string
    token: string
    refreshToken: string
    userId: number
    deviceHistoryId: string
  },
  status: string /* Pending */
}

export interface AuthConfirmResponse extends AuthResponse {
  data: AuthConfirmResponseData
}

export interface IpifyResponse {
  ip: string
}

export enum OperationStatus {
  pending = 'PENDING',
  approved = 'APPROVED'
}


export interface InitiateAddBindedDeviceResponse {
  data: {
    operationId: string
    status: OperationStatus
    requires2FA: boolean
    requiresAuthentification: boolean
  }
}

export interface BindDeviceConfirmResponse {
  data: {
    operationConfirm: {
      operationId: string
      operationData: string | null
      status: OperationStatus
    }
  }
}

export interface AccountNumber {
  accountNumber: string
}

export interface CardsAccounts {
  data: {
    customer: {
      cards: AccountNumber[]
    }
  }
}


export enum CurrencyCode {
  gel = "GEL",
  usd = "USD",
  rub = "RUB",
  eur = "EUR",
}

export enum AccountType {
  current = "CURRENT",
  saving = "SAVING",
}

export interface Card {
  cardId: number
  cardNumber: string
  cardCurrency: CurrencyCode
  cardNickName: string
  cardImageId: string
  cardImageAddress: string
  cardStatusId: number
  cardProduct: string  // "Debit Card"
  cardAvailableAmount: number
  cardBlockedAmount: number
  cardExpireShortDate: string // "03/25"
  cardStatus: string
  cardExpireDate: string // "2025-03-31T00:00:00"
  isDigitalCard: boolean
}

export interface Account {
  accountId: number
  accountNumber: string // ex: "GE12CD0360000012345678" looks like IBAN
  account: string
  currency: CurrencyCode
  categoryId: number
  category: string
  hasCard: boolean
  status: string
  type: AccountType
  availableBalance: number // ex: 5208.01
  currencyPriority: number
  availableBalanceEqu: number // ex: 5208.01
  isDefault: boolean
  isHidden: boolean
  cards: Card[]
}

export interface AccountsResponse {
  data: { accounts: Account[] }
}

export enum TransactionType {
  AccountWithdrawal = 'AccountWithdrawal',
  Transferbetweenownaccounts = 'Transferbetweenownaccounts',
  CurrencyExchange = 'CurrencyExchange',
  CardBlockedTransaction = 'CardBlockedTransaction',
}

// Отображение транзакции для пользователя. Меняется при смене языка
/* export enum OperationType {
 *   CardTransaction = "Card transaction",
 *   TransferBetweenOwnAccounts = 'Transfer between own accounts',
 *   AccruedInterestPayment = 'Accrued interest payment',
 *   DifferentFees = 'Different fees',
 *   CurrencyConversion = 'Currency conversion',
 *   ForeignCurrencyIncomingTransfer = 'Foreign currency incoming transfer',
 * } */

export interface Transaction {
  credit: number | null
  currency: CurrencyCode
  transactionType: TransactionType | null  // can be null on Accrued interest payment
  transactionId: string  // on blocked transaction differs from all others
  debit: number | null
  description: string  // 'გადახდა - WWW.GENKI.WORLD 54.60 EUR 20.05.2023'
  isCardBlock: boolean
  operationDateTime: string  // '2023-05-24 11:54:00'
  stmtEntryId: string  //	"202338292542841.120001"
  canRepeat: boolean
  canReverse: boolean
  amountEquivalent: number
  operationType: string  // OperationType
  operationTypeId: null
}

export interface TransactionListResponse {
  data: {
    transactionPagingList: {
      pageCount: number,
      totalItemCount: number,
      itemList: Transaction[]
    }
  }
}
