import { AccountOrCard } from '../../types/zenmoney'

// Stored in persistent storage
export interface Auth {
  accessToken: string
}

/*
{
  "alg": "RS256",
  "kid": "86a048ff5bb5636fd0da1f78730ded6c",
  "typ": "JWT"
}
{
  "nbf": 1708332948,
  "exp": 1708334748,
  "iss": "https://identitysso.mycredo.ge",
  "aud": [
    "https://identitysso.mycredo.ge/resources",
    "credo_api",
    "credo_legal_api"
  ],
  "client_id": "ang_client",
  "sub": "449855",
  "auth_time": 1708332948,
  "idp": "local",
  "UserName": "username",
  "AccessType": "full",
  "CustomerId": "1234567",
  "PersonalNumber": "434334342",
  "Phone": "5991212",
  "HasTempPassword": "False",
  "Channel": "WEB",
  "TraceId": "DQvzNVWzjPqJCJwAFzjqqfo/twjr6QqO7laU8Tu0Bgk=",
  "scope": [
    "openid",
    "profile",
    "credo_api",
    "credo_legal_api",
    "offline_access"
  ],
  "amr": [
    "pwd"
  ]
}
*/
export interface accessTokenPayload {
  nbf: number
  exp: number
  iss: string
  aud: string[]
  client_id: string
  sub: string
  auth_time: number
  idp: string
  UserName: string
  AccessType: string
  CustomerId: string
  PersonalNumber: string
  Phone: string
  HasTempPassword: boolean
  Channel: string
  TraceId: string
  scope: string[]
  amr: string[]
}

// Consists of everything that is needed in
// authorized requests, e.g. socket handles, session tokens
// Not stored!
export interface Session {
  auth: Auth
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
  english = 'English',
  russian = 'Russian',
  georgian = 'Georgian'
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
  languageType: string // LanguageType capitalized
  WebDevicePublicId?: string
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
  }
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
    initiateAddBindedDevice: {
      operationId: string
      status: OperationStatus
      requires2FA: boolean
      requiresAuthentification: boolean
    }
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

export enum AccountType {
  current = 'CURRENT',
  saving = 'SAVING',
}

export interface Card {
  cardId: number
  accountNumber: string // IBAN
  cardNumber: string
  cardCurrency: string // USD, INR, RUB, ...
  cardNickName: string
  cardImageId: string
  cardImageAddress: string
  cardStatusId: number
  cardProduct: string // "Debit Card"
  cardAvailableAmount: number
  cardBlockedAmount: number
  cardExpireShortDate: string // "03/25"
  cardStatus: string
  cardExpireDate: string // "2025-03-31T00:00:00"
  isDigitalCard: boolean
}

export interface CardsResponse {
  data: { cards: Card[] }
}

export interface Account {
  accountId: number
  accountNumber: string // ex: "GE12CD0360000012345678" looks like IBAN
  account: string
  currency: string // USD, INR, RUB, ...
  categoryId: number
  category: string
  hasCard: boolean
  status: string
  type: string // AccountType
  availableBalance: number // ex: 5208.01
  currencyPriority: number
  availableBalanceEqu: number // ex: 5208.01
  isDefault: boolean
  isHidden: boolean
  cssAccountId: number // same as for Deposit
}

export interface AccountsResponse {
  data: { accounts: Account[] }
}

export interface Deposit {
  balanceEqu: number
  depositNickName: string
  depositType: string // მოთხოვნამდე ანაბარი
  depositBalance: number
  depositCurrency: string // USD, INR, RUB, ...
  accruedInterestAmount: number
  contractN: string // IBAN
  depositInterestRate: number // 0.5
  openningDate: Date // 2022-04-19T16:39:10
  closeDate: Date | null
  interestAmountIfCanceled: number | null
  type: string // SAVING_DEPOSIT
  prolongationType: string // NONE
  isProlongable: boolean
  t24AccountId: number
  cssAccountId: number
}

export interface DepositsResponse {
  data: { customer: { deposits: Deposit[] } }
}

// TODO: Can we get result of LoansResponse and accounts related to loans?
export interface Loan {
  openingDate?: Date
}

export interface LoansResponse {
  data: { customer: { loans: Loan[] } }
}

export enum TransactionType {
  AccountWithdrawal = 'AccountWithdrawal',
  Transferbetweenownaccounts = 'Transferbetweenownaccounts',
  CurrencyExchange = 'CurrencyExchange',
  CardBlockedTransaction = 'CardBlockedTransaction',
  Otherexpenses = 'Otherexpenses'
}

export enum OperationType {
  ConversionRu = 'Безналичная конвертация',
  ConversionKa = 'უნაღდო კონვერტაცია',
  ConversionEn = 'Currency conversion'
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
  currency: string // USD, INR, RUB, EUR, ...
  transactionType: TransactionType | null //  can be null on Accrued interest payment
  transactionId: string // on blocked transaction differs from all others
  debit: number | null
  description: string // 'გადახდა - WWW.GENKI.WORLD 54.60 EUR 20.05.2023'
  isCardBlock: boolean
  operationDateTime: string // '2023-05-24 11:54:00'
  stmtEntryId: string // "202338292542841.120001"
  canRepeat: boolean
  canReverse: boolean
  amountEquivalent: number
  operationType: OperationType
  operationTypeId: null
}

export interface TransactionListResponse {
  data: {
    transactionPagingList: {
      pageCount: number
      totalItemCount: number
      itemList: Transaction[]
    }
  }
}

export interface TransactionDetail {
  amount: number
  transactionId: string | null
  operationId: string | null
  transactionType: TransactionType
  operationType: string
  debit: number
  debitEquivalent: number | null
  credit: number | null
  creditEquivalent: number | null
  description: string
  operationPerson: string | null
  currency: string // USD, INR, RUB, ...
  amountEquivalent: number
  accountNumber: string // IBAN
  contragentAccount: null
  contragentFullName: null
  contragentCurrency: null
  contragentAmount: null
  isCardBlock: boolean
  operationDateTime: string
  canRepeat: boolean
  canReverse: boolean
  transactionRate: number
  p2POperationStatements: null
  details: {
    cardNumber: string
    debitAmount: number
    creditBank: string | null
    treasuryCode: string | null
    debitAmountEquivalent: number | null
    creditAmount: number | null
    creditAmountEquivalent: number | null
    debitCurrency: string | null // USD, INR, RUB, ...
    creditCurrency: string | null // USD, INR, RUB, ...
    accountNumber: string // IBAN
    debitFullName: string | null // ალეკსეი ლუკომსკი
    creditFullName: string | null
    debitAccount: string | null // IBAN
    creditAccount: string | null // IBAN
    description: string
    rate: number | null
    thirdPartyFullName: string | null
    thirdPartyPersonalNumber: string | null
    utilityProviderName: string | null
    utilityServiceName: string | null
    utilityComment: string | null
    p2pFee: string | null
  }
}

export interface TransactionDetailResponse {
  data: {
    customer: {
      transactions: TransactionDetail[]
      cards: Card[]
    }
  }
}
