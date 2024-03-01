import { Account, AccountOrCard, AccountType, Amount, Merchant, Movement, Transaction } from '../../types/zenmoney'
import { parsePOSDateString } from './converters'
export interface Signature {
  response: null
  status: string
  challenge: null
  regenerateChallengeCount: null
  authenticationAccessToken: null
  authenticationCode: null
  signer: null
  type: string
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
  // transactionDate: null // always null
  // localTime: null // always null
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
    return this.transaction.title.includes('ATM ') // TODO add cash in
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
      const idLine = transaction.blockedMovementDate!.toString() +
        transaction.title +
        transaction.amount.toString() +
        transaction.blockedMovementCardId!.toString() +
        transaction.blockedMovementIban!
      this.id = Buffer.from(idLine).toString('base64')
    } catch ({ message }) {
      console.error(transaction)
      throw new Error(`Error parsing title "${transaction.title}" in TransactionBlockedV2: ${message}`)
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

export class TransactionCustomMobileV2 {
  transaction: TransactionRecordV2
  merchant: string
  merchantCountry: string
  amount: number

  static isCustomMobile (transaction: TransactionRecordV2): boolean {
    return transaction.subTitle === 'Mobile' && transaction.title.startsWith('Cellfie')
  }

  constructor (transaction: TransactionRecordV2) {
    if (transaction.subTitle !== 'Mobile') {
      console.error(transaction)
      throw new Error('Transaction is not mobile, the subtitle is ' + transaction.subTitle)
    }

    this.transaction = transaction
    try {
      // title is in format 'Cellfie;599000111;თანხა:10.00'
      const arr = transaction.title.split(';')
      this.merchant = arr[0]
      this.merchantCountry = 'Georgia'
      this.amount = -Number.parseFloat(arr[2].split(':')[1])
    } catch ({ message }) {
      console.error(transaction)
      throw new Error(`Error parsing title "${transaction.title}" in TransactionCustomMobileV2: ${message}`)
    }
  }
}

export class TransactionStandardMovementV2 {
  transaction: TransactionRecordV2
  merchant: string
  amount: number
  date: Date
  cardNum: string
  mcc: number
  invoice: Amount | null

  isCash (): boolean {
    return this.transaction.categoryCode === 'CASHOUT' // TODO add cash in
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

  constructor (transaction: TransactionRecordV2) {
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
      const arr = transaction.title.split(',')
      let invoice: { sum: number, instrument: string } | undefined
      let sumIndex = 0
      this.amount = transaction.amount
      for (let i = 0; i < arr.length; i++) {
        const str = arr[i].trim()
        if (str.startsWith('თანხა') || str.startsWith('ტრანზაქციის თანხა')) {
          sumIndex = i
          // format is თანხა 10.00 USD
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
      this.date = parsePOSDateString(dateTimeString)
      this.cardNum = arr[arr.length - 1].trim().slice(-4)
      this.mcc = Number.parseInt(arr[arr.length - 3].replace('MCC:', '').trim())
    } catch ({ message }) {
      console.error(transaction)
      throw new Error(`Error parsing title "${transaction.title}" in TransactionStandardMovementV2: ${message}`)
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
  possibleChallengeRegenTypes: string[]
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
  passcode: string
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
