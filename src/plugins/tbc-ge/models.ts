import { getOptString } from '../../types/get'
import { Account, AccountOrCard, AccountType, Amount, DepositOrLoan, Merchant, Movement, Transaction } from '../../types/zenmoney'
import { isInvoiceString, isPOSDateCorrect, parsePOSDateString } from './converters'
export interface Signature {
  response: null
  status: string
  challenge: null
  regenerateChallengeCount: null
  authenticationAccessToken: null
  authenticationCode: null
  signer: null
  type: OtpDeviceV2
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

export interface CardV2 {
  id: string
  blockedAmount: number
  numberSuffix: string
  isCardActivated: boolean
  expirationDate: number
  holderName: string
  userIsCardHolder: boolean
  backgroundImage: null
  designId: number
  designUrl: string
  harmAccessAllowedOnCard: boolean
  harmAccessOptionOnProduct: boolean
  isCardExpired: boolean
  isCardBlocked: boolean
  productId: number
}

export interface AccountV2 {
  id: number
  coreAccountId: number
  balance: number
  currency: string
  overdraftCheckDate: null
  overdraftAmount: null
}

export interface DepositDataV2 {
  deposit: DepositV2
  details: DepositDetailsV2
}

export interface DepositsV2 {
  items: DepositV2[]
  nextPageId: null
}
export interface DepositV2 {
  id: number
  subType: number
  typeText: string
  subTypeText: string
  friendlyName: string
  currentAmount: number
  targetAmount: number | null
  currency: string
  externalAccountId: number
  accountNo: string
  targetAmountIsReached: boolean | null
  currentAmountInGel: number
  addAmountPossibility: boolean
  closingInProgress: boolean
}

export interface DepositDetailsV2 {
  depositDetails: {
    id: number
    date: number
    startDate: number
    endDate: number
    plannedTotalInterestAmount: number
    guardName: null
    addAmountPossibility: null
    rollOver: boolean
    accountNo: string
    existingEffectiveInterestRate: number
    coreAccountId: number
    paymentOperationTypeContexts: null
  }
  interestCalculation: {
    interestRate: number
    plannedTotalInterestAmount: number
    accruedInterest: number
    paidInterest: null
    interestPaymentFrequency: number
  }
  interestCalculationUponCancellation: {
    interestRate: number
    annulmentInterestRate: number
    annulmentInterest: number
    currentInterest: number
    amount: number
    totalAmount: number
  }
}

export interface DepositStatementV2 {
  movementDate: number
  depositAmount: number
  interestedAmount: number
  withdrawnDepositAmount: number
  balance: number
}

export interface FetchHistoryV2Data {
  account: Account
  currency: string
  iban: string
  id: string
}

export interface TransactionRecordV2 {
  transactionId: number // 0 if blocked
  accountId: number | null // null if blocked
  entryType: 'StandardMovement' | 'BlockedTransaction'
  movementId: string | null // null if blocked
  transactionDate: null // always null
  localTime: null // always null
  repeatTransaction: null | boolean
  setAutomaticTransfer: null | boolean
  payback: null | boolean
  saveAsTemplate: null | boolean
  shareReceipt: null | boolean
  dispute: null | boolean // true if blocked
  title: string
  subTitle: string
  amount: number
  currency: string
  categoryCode: string | null // null if blocked
  subCategoryCode: string
  isSplit: null | boolean
  transactionSubtype: number | null // null if blocked
  blockedMovementDate: null | number // null if not blocked
  blockedMovementCardId: null | number // null if not blocked
  blockedMovementIban: null | string // null if not blocked
  transactionStatus: string //  Always 'Green'
  isDebit: boolean // false if blocked
}

export interface TransactionsByDateV2 {
  date: number
  transactions: TransactionRecordV2[]
}

export interface PreparedCardV2 {
  account: AccountOrCard
  code: string // TODO GET from https://rmbgw.tbconline.ge/wallet/api/v1/cards
  id: number
  iban: string
}

export interface PreparedLoanV2 {
  account: DepositOrLoan
}

export interface PreparedAccountV2 {
  account: AccountOrCard
  iban: string
}

export interface CoreAccountId {
  currency: string
  iban: string
  id: string
  type: number
}

export interface TransactionV2 {
  coreAccountIds: CoreAccountId[]
  isChildCardRequest: boolean
  pageType: string
  showBlockedTransactions: boolean
}

export enum OtpDeviceV2 {
  SMS = 'SMS_OTP',
  GEMALTO = 'TOKEN_GEMALTO',
  VASCO = 'TOKEN_VASCO'
}

export class TransactionBlockedV2 {
  transaction: TransactionRecordV2
  amount: number
  merchant: string
  city: string
  countryCode: string
  id: string

  isCash (): boolean {
    // title of cash in operation has next formatted:
    // 00000000,12/01/2024,ანგარიშზე თანხის შეტანა,GEL
    return this.transaction.title.includes('ATM ') || this.transaction.title.includes('ანგარიშზე თანხის შეტანა')
  }

  constructor (transaction: TransactionRecordV2, date: number) {
    if (transaction.entryType !== 'BlockedTransaction') {
      console.error(transaction)
      throw new Error('Invalid transaction entryType, expected BlockedTransaction')
    }
    this.transaction = transaction
    this.amount = transaction.amount

    try {
      const arr = transaction.title.split('>')
      this.merchant = arr[0].trim()
      const arr2 = arr[1].split(' ')
      this.city = arr2[0].trim()
      this.countryCode = arr2[1].trim()
      const idLine = (transaction.blockedMovementDate?.toString() ?? 'null') +
        transaction.title +
        transaction.amount.toString() +
        (transaction.blockedMovementCardId?.toString() ?? 'null') +
        (transaction.blockedMovementIban ?? 'null')
      this.id = Buffer.from(idLine).toString('base64')
    } catch (err) {
      console.error(transaction)
      throw new Error(`Error parsing title "${transaction.title}" in TransactionBlockedV2: ${getOptString(err, 'message') ?? 'unknown error'}`)
    }
  }
}

export class TransactionTransferV2 {
  transaction: TransactionRecordV2
  amount: number

  public get isIncome (): boolean {
    return this.transaction.categoryCode === 'INCOME'
  }

  constructor (transaction: TransactionRecordV2) {
    if (!TransactionTransferV2.isTransfer(transaction)) {
      console.error(transaction)
      throw new Error('Invalid transaction categoryCode')
    }
    this.transaction = transaction
    this.amount = transaction.amount
  }

  static isTransfer (transaction: TransactionRecordV2): boolean {
    return transaction.entryType === 'StandardMovement' &&
      (transaction.categoryCode === 'INCOME' || transaction.categoryCode === 'PAYMENTS' || transaction.categoryCode === 'BANK_INSURE_TAX')
  }
}

export class TransactionTaxV2 {
  transaction: TransactionRecordV2
  static isTax (transaction: TransactionRecordV2): boolean {
    return transaction.subCategoryCode === 'TAXES'
  }

  merchant: Merchant

  constructor (transaction: TransactionRecordV2) {
    if (transaction.subCategoryCode !== 'TAXES') {
      console.error(transaction)
      throw new Error('Transaction is not tax, the subCategoryCode is ' + transaction.subCategoryCode)
    }
    this.transaction = transaction

    this.merchant = {
      country: 'Georgia',
      city: null,
      title: 'Government of Georgia',
      mcc: 9311, // Tax Payments and other similar services
      location: null,
      category: 'Taxes'
    }
  }
}

export class TransactionUtilPayV2 {
  transaction: TransactionRecordV2
  merchant: string
  merchantCountry: string
  amount: number

  static isUtilPay (transaction: TransactionRecordV2): boolean {
    return transaction.categoryCode === 'UTIL_PAY' && !transaction.title.startsWith('POS')
  }

  constructor (transaction: TransactionRecordV2) {
    this.transaction = transaction
    this.merchantCountry = 'Georgia'
    if (transaction.subCategoryCode === 'TELEPHONE_MOBILE') {
      try {
        // Title is in format:
        // Cellfie;599000111;თანხა:10.00
        // SERVICENET;1009;2273000;თანხა:60.00
        const arr = transaction.title.split(';')
        this.merchant = arr[0]
        this.amount = transaction.amount
      } catch (err) {
        console.error(transaction)
        throw new Error(`Error parsing title "${transaction.title}" in TransactionUtilPayV2: ${getOptString(err, 'message') ?? 'unknown error'}`)
      }
    } else if (transaction.subCategoryCode === 'TV_INTERNET') {
      try {
        // Title is in format:
        // CITYCOM;82157580;თანხა:64.65;საკ.:0.50
        // Silk-ID;1014;301102120;თანხა:35.00
        const arr = transaction.title.split(';')
        this.merchant = arr[0]
        this.amount = transaction.amount
      } catch (err) {
        console.error(transaction)
        throw new Error(`Error parsing title "${transaction.title}" in TransactionUtilPayV2: ${getOptString(err, 'message') ?? 'unknown error'}`)
      }
    } else {
      // There are might be other util payment subCategories (ex: GAS)
      // Set default values for other sub categories
      this.amount = transaction.amount
      this.merchant = transaction.title.split(';')[0]
    }
  }
}

export class TransactionStandardMovementV2 {
  transaction: TransactionRecordV2
  merchant: string
  amount: number
  date: Date
  cardNum: string | null
  mcc: number | null
  invoice: Amount | null

  isCash (): boolean {
    if (this.transaction.categoryCode === 'INCOME') {
      // title of cash in operation has next formatted:
      // 00000000,12/01/2024,ანგარიშზე თანხის შეტანა,GEL
      return this.transaction.title.includes('ანგარიშზე თანხის შეტანა')
    } else return this.transaction.categoryCode === 'CASHOUT'
  }

  needInvoice (): boolean {
    if (this.invoice === null) {
      return false
    }
    if (this.invoice.instrument !== this.transaction.currency) {
      return true
    }
    return Math.abs(this.invoice.sum) !== Math.abs(this.amount)
  }

  constructor (transaction: TransactionRecordV2, defaultDate: number) {
    if (transaction.entryType !== 'StandardMovement') {
      console.error(transaction)
      throw new Error('Invalid transaction entryType, expected StandardMovement')
    }
    if (TransactionTransferV2.isTransfer(transaction)) {
      console.error(transaction)
      throw new Error('Invalid transaction categoryCode')
    }
    try {
      this.transaction = transaction
      this.amount = transaction.amount
      const arr = transaction.title.split(',')
      if (arr.length < 2) {
        // Unparsable title - set default values and return
        this.merchant = transaction.title
        this.date = new Date(defaultDate)
        this.cardNum = null
        this.mcc = null
        this.invoice = null
        return
      }
      let invoice: { sum: number, instrument: string } | undefined
      let sumIndex = 0
      for (let i = 0; i < arr.length; i++) {
        const str = arr[i].trim()
        if (isInvoiceString(str)) {
          sumIndex = i
          // format is თანხა 10.00 USD or ტრანზაქციის თანხა 10.00 USD or 10.00 USD
          const invoiceStr = str.split(' ')
          invoice = {
            sum: Number.parseFloat(invoiceStr[invoiceStr.length - 2]),
            instrument: invoiceStr[invoiceStr.length - 1]
          }
          const sign = Math.sign(this.amount)
          if (sign === -1) {
            invoice.sum = -invoice.sum
          }
          break
        }
      }

      if (invoice !== undefined && !Number.isNaN(invoice.sum)) {
        this.invoice = invoice
      } else {
        this.invoice = null
      }

      // arr from 0 to sumIndex
      this.merchant = arr.slice(0, sumIndex).join(', ')
        .replace('POS - ', '')
        .replace('POS wallet - ', '')
        .trim()

      const dateTimeString = arr[sumIndex + 1].trim()
      this.date = isPOSDateCorrect(dateTimeString) ? parsePOSDateString(dateTimeString) : new Date(defaultDate)
      this.cardNum = arr[arr.length - 1].trim().slice(-4)
      this.mcc = arr.length >= 3 ? Number.parseInt(arr[arr.length - 3].replace('MCC:', '').trim()) : null
    } catch (err) {
      console.error(transaction)
      throw new Error(`Error parsing title "${transaction.title}" in TransactionStandardMovementV2: ${getOptString(err, 'message') ?? 'unknown error'}`)
    }
  }
}

/* {
  "cards": [{
  "cardId": 1004888841,
  "numberSuffix": "1234",
  "expiry": "05/25",
  "designId": 301,
  "friendlyName": "Card",
  "cardProvider": "Visa"
}]
} */

export interface CardProductV2 {
  iban: string
  friendlyName: null
  totalBalance: number
  currency: string
  primary: boolean
  operations: string[]
  canBePrimary: boolean
  isChildCard: boolean
  isCreditCard: boolean
  cardUsageType: number
  type: string
  typeText: string
  subType: string
  subTypeText: string
  hasPrefix: boolean
  cards: CardV2[]
  accounts: AccountV2[]
}

export interface LoanProductV2 {
  id: string
  customerRole: string
  totalLoanAmount: number
  currencyCode: string
  approvementDate: number
  typeCode: string
  typeText: string
  endDate: number
  lastPaymentDate: number
  outstandingPrincipalAmount: number
  outstandingPrincipalAmountInGel: number
  statusCode: string
  statusText: string
  unusedAmount: number
  friendlyName: string
  hasDebt: boolean
  showPaymentDayExplanationMark: boolean
  activateRepayment: boolean
  isBNPL: boolean
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
  possibleChallengeRegenTypes: OtpDeviceV2[]
  cookies: string[]
}

export interface PasswordLoginRequestV2 {
  'username': string
  'password': string
  'language': 'en'
  'deviceInfo': string
  'deviceData': string
  'deviceId': string
}

export interface EasyLoginRequestV2 {
  'userName': string
  'passcode': string
  'registrationId': string
  'deviceInfo': string
  'deviceData': string
  'passcodeType': string
  'language': 'en'
  'deviceId': string
  'trustedDeviceId'?: string // skip this to receive a sms code
}

export class DeviceInfo {
  appVersion: string
  deviceId: string
  manufacturer: string
  modelNumber: string
  os: string
  remembered = true
  rooted = false

  constructor (appVersion: string, deviceId: string, manufacturer: string, modelNumber: string, os: string) {
    this.appVersion = appVersion
    this.deviceId = deviceId
    this.manufacturer = manufacturer
    this.modelNumber = modelNumber
    this.os = os
  }

  toBase64 (): string {
    return Buffer.from(JSON.stringify(this)).toString('base64')
  }
}

export class DeviceData extends DeviceInfo {
  isRemembered = 'true'
  isRooted = 'false'
  operatingSystem: string
  operatingSystemVersion: string

  static fromDeviceInfo (deviceInfo: DeviceInfo, operatingSystem: string, operatingSystemVersion: string): DeviceData {
    return new DeviceData(deviceInfo.appVersion, deviceInfo.deviceId, deviceInfo.manufacturer, deviceInfo.modelNumber, deviceInfo.os, operatingSystem, operatingSystemVersion)
  }

  constructor (appVersion: string, deviceId: string, manufacturer: string, modelNumber: string, os: string, operatingSystem: string,
    operatingSystemVersion: string) {
    super(appVersion, deviceId, manufacturer, modelNumber, os)
    this.operatingSystem = operatingSystem
    this.operatingSystemVersion = operatingSystemVersion
  }
}

export interface AuthV2 {
  username: string
  passcode: string | null
  deviceId: string | null
  registrationId: string
  trustedDeviceId?: string
}

export interface CertifyLoginResponseV2 {
  success: boolean
  signatures: null
  transactionId: null
  accessToken: null
  linkedProfiles: null
  changePasswordRequired: boolean
  changePasswordSuggested: boolean
  userSelectionRequired: boolean
  possibleChallengeRegenTypes: null
}

export interface SessionV2 {
  cookies: string[]
  auth: AuthV2
}

export interface Preferences {
  login: string
  password: string
}

export interface ConvertedCard {
  tag: 'card'
  coreAccountId: number
  account: Account
  holdTransactions: Transaction[]
}

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
