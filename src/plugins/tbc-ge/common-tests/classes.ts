import { TransactionRecordV2 } from '../models'

export class TransactionRecordV2Class implements TransactionRecordV2 {
  transactionId: number // 0 if blocked
  accountId: number | null // null if blocked
  entryType: 'StandardMovement' | 'BlockedTransaction'
  movementId: string | null // null if blocked
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

  static mobile (title: string, amount: number, currency: string, accountId: number, movementId: string, transactionId: number): TransactionRecordV2Class {
    const result = new TransactionRecordV2Class('StandardMovement', title, 'Mobile', amount, currency)
    result.transactionId = transactionId
    result.accountId = accountId
    result.movementId = movementId
    result.categoryCode = 'UTIL_PAY'
    result.subCategoryCode = 'TELEPHONE_MOBILE'
    result.transactionSubtype = 31
    return result
  }

  static blocked (title: string, amount: number, currency: string, date: number, cardId: number, iban: string): TransactionRecordV2Class {
    const result = new TransactionRecordV2Class('BlockedTransaction', title, 'Blocked amount', amount, currency)
    result.blockedMovementDate = date
    result.blockedMovementCardId = cardId
    result.blockedMovementIban = iban
    result.dispute = true
    result.subCategoryCode = 'bam'
    return result
  }

  static cashOut (title: string, amount: number, currency: string,
    accountId: number, movementId: string, transactionId: number): TransactionRecordV2Class {
    const result = new TransactionRecordV2Class('StandardMovement', title, 'Cash out', amount, currency)

    result.transactionId = transactionId
    result.accountId = accountId
    result.movementId = movementId
    result.categoryCode = 'CASHOUT'
    result.transactionSubtype = 30
    result.subCategoryCode = 'CASHOUT'
    result.isDebit = true
    result.dispute = null
    return result
  }

  static standard (title: string, subTitle: string, amount: number, currency: string, transactionId: number,
    accountId: number, movementId: string, categoryCode: string, subCategoryCode: string, transactionSubtype: number): TransactionRecordV2Class {
    const result = new TransactionRecordV2Class('StandardMovement', title, subTitle, amount, currency)

    result.transactionId = transactionId
    result.accountId = accountId
    result.movementId = movementId
    result.categoryCode = categoryCode
    result.transactionSubtype = transactionSubtype
    result.subCategoryCode = subCategoryCode
    result.isDebit = true
    result.dispute = null
    return result
  }

  constructor (
    entryType: 'StandardMovement' | 'BlockedTransaction',
    title: string,
    subTitle: string,
    amount: number,
    currency: string) {
    this.entryType = entryType
    this.title = title
    this.subTitle = subTitle
    this.amount = amount
    this.currency = currency

    this.subCategoryCode = ''
    this.isDebit = true
    this.repeatTransaction = null
    this.setAutomaticTransfer = null
    this.payback = null
    this.saveAsTemplate = null
    this.shareReceipt = null
    this.dispute = null
    this.categoryCode = null
    this.isSplit = null
    this.transactionSubtype = null
    this.blockedMovementDate = null
    this.blockedMovementCardId = null
    this.blockedMovementIban = null
    this.transactionStatus = 'Green'
    this.accountId = null
    this.movementId = null
    this.transactionId = 0
  }
}
