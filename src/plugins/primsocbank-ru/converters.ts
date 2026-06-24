import get, { getOptBoolean, getOptString } from '../../types/get'
import md5 from 'crypto-js/md5'
import { Account, AccountType, Amount, Transaction } from '../../types/zenmoney'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { ConvertedAccount, ProductKind } from './models'

const ACCOUNT_ID_PATHS = [
  'accountId',
  'cardAccountId',
  'contractId',
  'productId',
  'id',
  'number',
  'accountNumber'
]

const PRODUCT_ID_PATHS = [
  'productId',
  'contractId',
  'cardId',
  'accountId',
  'id'
]

const ACCOUNT_TITLE_PATHS = [
  'title',
  'name',
  'productName',
  'displayName',
  'cardName',
  'accountName',
  'alias'
]

const ACCOUNT_SYNC_ID_PATHS = [
  'accountNumber',
  'iban',
  'cardNumberMasked',
  'cardNumber',
  'maskedPan',
  'pan',
  'number'
]

const ACCOUNT_BALANCE_PATHS = [
  'balance.amount',
  'balance.value',
  'accountBalance.amount',
  'accountBalance.value',
  'currentBalance.amount',
  'currentBalance.value',
  'detailSum',
  'showSum',
  'availableWhenPay',
  'balance',
  'amount',
  'available',
  'availableBalance'
]

const ACCOUNT_AVAILABLE_PATHS = [
  'available',
  'availableBalance',
  'available.amount',
  'available.value',
  'availableWhenPay'
]

const CURRENCY_PATHS = [
  'currency',
  'currencyCode',
  'currency.code',
  'currency.shortName',
  'balance.currency',
  'balance.currency.code',
  'balance.currency.shortName',
  'accountBalance.currency',
  'accountBalance.currency.code',
  'accountBalance.currency.shortName'
]

const TRANSACTION_DATE_PATHS = [
  'operDateTime',
  'operDate',
  'date',
  'operationDate',
  'operationTime',
  'transactionDate',
  'createdAt',
  'processedAt',
  'postingDate'
]

const TRANSACTION_DESCRIPTION_PATHS = [
  'details',
  'description',
  'merchantName',
  'merchant.name',
  'purpose',
  'operationName'
]

const TRANSACTION_COMMENT_PATHS = [
  'comment',
  'pfmCategoryTO.enName',
  'pfmCategoryTO.name',
  'categoryName',
  'category',
  'type',
  'operationType'
]

const TRANSACTION_SUM_PATHS = [
  'accountAmount',
  'accountAmount.amount',
  'accountAmount.value',
  'amount',
  'amount.amount',
  'amount.value',
  'sum',
  'value',
  'transactionAmount',
  'transactionAmount.amount',
  'transactionAmount.value'
]

const TRANSACTION_CURRENCY_PATHS = [
  'accountCurrency',
  'accountAmount.currency',
  'accountAmount.currency.code',
  'accountAmount.currency.shortName',
  'currency',
  'currencyCode',
  'currency.code',
  'currency.shortName',
  'amount.currency',
  'amount.currency.code',
  'amount.currency.shortName'
]

const ORIGINAL_AMOUNT_PATHS = [
  'originalAmount',
  'originalAmount.amount',
  'originalAmount.value',
  'operationAmount',
  'operationAmount.amount',
  'operationAmount.value'
]

const ORIGINAL_CURRENCY_PATHS = [
  'originalCurrency',
  'originalAmount.currency',
  'originalAmount.currency.code',
  'originalAmount.currency.shortName',
  'operationCurrency',
  'operationAmount.currency',
  'operationAmount.currency.code',
  'operationAmount.currency.shortName'
]

const TRANSACTION_STATUS_PATHS = [
  'status',
  'statusCode',
  'statusName',
  'state.code',
  'state.name',
  'operationStatus',
  'operationStatus.code',
  'operationStatus.name',
  'paymentStatus',
  'paymentStatus.code',
  'paymentStatus.name',
  'orderStatus',
  'orderStatus.code',
  'orderStatus.name'
]

// The bank may return rejected payment attempts in the same feed as posted operations.
const FAILED_TRANSACTION_STATUS_MARKERS = [
  'failed',
  'failure',
  'error',
  'declined',
  'rejected',
  'reject',
  'cancelled',
  'canceled',
  'expired',
  'unsuccessful',
  'refused',
  'ошиб',
  'отказ',
  'отклон',
  'отмен',
  'не исполн',
  'не выполн',
  'не провед',
  'неуспеш',
  'аннулир',
  'истек',
  'истёк'
]

function normalizeString (value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  return undefined
}

function normalizeNumber (value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

function pickString (data: unknown, paths: string[]): string {
  const result = pickOptString(data, paths)
  assert(result != null, 'cant pick string from paths', paths, data)
  return result ?? ''
}

function pickOptString (data: unknown, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = normalizeString(get(data, path))
    if (value != null) {
      return value
    }
  }
  return undefined
}

function pickOptNumber (data: unknown, paths: string[]): number | undefined {
  for (const path of paths) {
    const value = normalizeNumber(get(data, path))
    if (value != null) {
      return value
    }
  }
  return undefined
}

function parseBankDateString (value: string): Date | undefined {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (match != null) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function pickOptDate (data: unknown, paths: string[]): Date | undefined {
  for (const path of paths) {
    const value = get(data, path)
    if (typeof value === 'number') {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        return date
      }
    }
    if (typeof value === 'string') {
      const date = parseBankDateString(value)
      if (date != null) {
        return date
      }
    }
  }
  return undefined
}

function uniqueDefinedStrings (values: Array<string | undefined>): string[] {
  const result: string[] = []
  for (const value of values) {
    if (value != null && !result.includes(value)) {
      result.push(value)
    }
  }
  return result
}

function normalizeSyncId (value: string | undefined): string | undefined {
  return value?.replace(/\s/g, '')
}

function normalizeStatusText (value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, 'е')
}

function getTransactionStatusTexts (apiTransaction: unknown): string[] {
  return uniqueDefinedStrings(TRANSACTION_STATUS_PATHS.map(path => pickOptString(apiTransaction, [path]))).map(normalizeStatusText)
}

function isFailedTransaction (apiTransaction: unknown): boolean {
  const statusTexts = getTransactionStatusTexts(apiTransaction)
  return statusTexts.some(status => FAILED_TRANSACTION_STATUS_MARKERS.some(marker => status.includes(normalizeStatusText(marker))))
}

function getProductKind (apiAccount: unknown): ProductKind {
  const rawType = (pickOptString(apiAccount, ['kind', 'type', 'productType', 'product.kind', 'product.type', 'background']) ?? '').toLowerCase()
  if (rawType.includes('loan') || rawType.includes('credit') || rawType.includes('кредит')) {
    return ProductKind.loan
  }
  if (rawType.includes('account') || rawType.includes('счет') || rawType.includes('счёт')) {
    return ProductKind.account
  }
  return ProductKind.card
}

function isArchived (apiAccount: unknown): boolean | undefined {
  const archived = getOptBoolean(apiAccount, 'archive') ?? getOptBoolean(apiAccount, 'archived')
  if (archived != null) {
    return archived
  }
  const active = getOptBoolean(apiAccount, 'active') ?? getOptBoolean(apiAccount, 'isActive')
  if (active != null) {
    return !active
  }
  const status = (getOptString(apiAccount, 'status') ?? '').toLowerCase()
  if (status === '') {
    return undefined
  }
  return ['closed', 'blocked', 'inactive', 'закрыт', 'заблокирован'].some(value => status.includes(value))
}

export function convertAccounts (apiAccounts: unknown[]): ConvertedAccount[] {
  return apiAccounts.map(convertAccount).filter((account): account is ConvertedAccount => account != null)
}

function convertAccount (apiAccount: unknown): ConvertedAccount | null {
  const kind = getProductKind(apiAccount)
  if (kind === ProductKind.loan) {
    return convertLoan(apiAccount)
  }
  if (kind === ProductKind.unsupported) {
    return null
  }
  const id = pickString(apiAccount, ACCOUNT_ID_PATHS)
  const productId = pickOptString(apiAccount, PRODUCT_ID_PATHS) ?? id
  const instrument = pickString(apiAccount, CURRENCY_PATHS)
  const syncIds = uniqueDefinedStrings([
    id,
    ...ACCOUNT_SYNC_ID_PATHS.map(path => normalizeSyncId(pickOptString(apiAccount, [path])))
  ])
  const account: Account = {
    id,
    type: kind === ProductKind.account ? AccountType.checking : AccountType.ccard,
    title: pickOptString(apiAccount, ACCOUNT_TITLE_PATHS) ?? id,
    instrument,
    syncIds,
    savings: false,
    balance: pickOptNumber(apiAccount, ACCOUNT_BALANCE_PATHS) ?? null
  }
  const available = pickOptNumber(apiAccount, ACCOUNT_AVAILABLE_PATHS)
  if (available != null) {
    account.available = available
  }
  const creditLimit = pickOptNumber(apiAccount, ['creditLimit', 'limit', 'cardLimit'])
  if (creditLimit != null) {
    account.creditLimit = creditLimit
  }
  const archived = isArchived(apiAccount)
  if (archived != null) {
    account.archived = archived
  }
  return {
    account,
    product: {
      id: productId,
      accountId: id,
      kind
    }
  }
}

function convertLoan (apiLoan: unknown): ConvertedAccount {
  const id = pickString(apiLoan, ['id', 'loanId', 'contractId'])
  const startDate = pickOptDate(apiLoan, ['openDate', 'startDate', 'agreementDate', 'openDateS', 'startDateS']) ?? new Date()
  const endDate = pickOptDate(apiLoan, ['maturityDate', 'endDate', 'maturityDateS', 'endDateS']) ?? new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate())
  const { interval: endDateOffsetInterval, count: endDateOffset } = getIntervalBetweenDates(startDate, endDate)
  const principalDebt = pickOptNumber(apiLoan, ['outstandingDebt.principalAmount', 'principalDebt', 'outstandingPrincipalAmount'])
  const totalDebt = pickOptNumber(apiLoan, ['outstandingDebt.amount', 'debtAmount', 'currentDebt'])
  const debt = principalDebt ?? totalDebt ?? 0
  const account: Account = {
    id,
    type: AccountType.loan,
    title: pickOptString(apiLoan, ['productName', 'name', 'displayNumber']) ?? id,
    instrument: pickString(apiLoan, CURRENCY_PATHS),
    syncIds: uniqueDefinedStrings([
      id,
      normalizeSyncId(pickOptString(apiLoan, ['displayNumber', 'number', 'contractNumber']))
    ]),
    balance: -debt,
    startDate,
    startBalance: pickOptNumber(apiLoan, ['amount', 'startBalance', 'initialPrincipal', 'loanScheduleAmounts.plannedPrincipalAmount']) ?? Math.abs(debt),
    capitalization: true,
    percent: pickOptNumber(apiLoan, ['interestRate', 'rate', 'percent']) ?? 0,
    endDateOffsetInterval,
    endDateOffset,
    payoffInterval: 'month',
    payoffStep: 1
  }
  const archived = isArchived(apiLoan)
  if (archived != null) {
    account.archived = archived
  }
  return {
    account,
    product: {
      id,
      accountId: id,
      kind: ProductKind.loan
    }
  }
}

function pickTransactionSum (apiTransaction: unknown): number {
  const credit = pickOptNumber(apiTransaction, ['creditAmount', 'incomeAmount', 'credit'])
  const debit = pickOptNumber(apiTransaction, ['debitAmount', 'outcomeAmount', 'debit'])
  if (credit != null || debit != null) {
    return (credit ?? 0) - (debit ?? 0)
  }
  const sum = pickOptNumber(apiTransaction, TRANSACTION_SUM_PATHS)
  assert(sum != null, 'cant pick transaction sum', apiTransaction)
  return sum ?? 0
}

function parseTransactionDate (apiTransaction: unknown): Date {
  const rawDate = pickOptString(apiTransaction, TRANSACTION_DATE_PATHS)
  assert(rawDate != null, 'cant pick transaction date', apiTransaction)
  const match = rawDate?.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (match != null) {
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      Number(match[4] ?? 0),
      Number(match[5] ?? 0),
      Number(match[6] ?? 0)
    )
  }
  return new Date(rawDate ?? '')
}

function getIdPart (value: unknown): string {
  if (value == null) {
    return ''
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.getTime().toString()
  }
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase()
}

function getAmountIdPart (value: number | null | undefined): string {
  return value == null ? '' : value.toFixed(4).replace(/\.?0+$/, '')
}

function hashId (source: string): string {
  return md5(source).toString()
}

function getTransactionIdentitySource (apiTransaction: unknown, account: Account): string {
  const date = parseTransactionDate(apiTransaction)
  const sum = pickTransactionSum(apiTransaction)
  const invoice = makeInvoice(apiTransaction, account)
  return [
    account.id,
    date,
    getAmountIdPart(sum),
    account.instrument,
    getAmountIdPart(invoice?.sum),
    invoice?.instrument,
    pickOptString(apiTransaction, TRANSACTION_DESCRIPTION_PATHS)
  ].map(getIdPart).join('|')
}

function getStableTransactionId (apiTransaction: unknown, account: Account, duplicateIndex: number): string {
  return hashId([
    getTransactionIdentitySource(apiTransaction, account),
    duplicateIndex
  ].join('|'))
}

function getHoldStatus (apiTransaction: unknown): boolean | null {
  const explicit = getOptBoolean(apiTransaction, 'hold') ?? getOptBoolean(apiTransaction, 'pending')
  if (explicit != null) {
    return explicit
  }
  const status = (getOptString(apiTransaction, 'status') ?? '').toLowerCase()
  if (status === '') {
    return null
  }
  return ['hold', 'pending', 'processing', 'reserved'].some(value => status.includes(value))
}

function makeInvoice (apiTransaction: unknown, account: Account): Amount | null {
  const sum = pickOptNumber(apiTransaction, ORIGINAL_AMOUNT_PATHS)
  const instrument = pickOptString(apiTransaction, ORIGINAL_CURRENCY_PATHS)
  if (sum == null || instrument == null || instrument === account.instrument) {
    return null
  }
  return { sum, instrument }
}

export function convertTransactions (apiTransactions: unknown[], account: Account): Transaction[] {
  const identityCounts = new Map<string, number>()
  return apiTransactions
    .filter(apiTransaction => !isFailedTransaction(apiTransaction))
    .map(apiTransaction => {
      const identitySource = getTransactionIdentitySource(apiTransaction, account)
      const duplicateIndex = (identityCounts.get(identitySource) ?? 0) + 1
      identityCounts.set(identitySource, duplicateIndex)
      return convertTransaction(apiTransaction, account, duplicateIndex)
    })
}

export function convertTransaction (apiTransaction: unknown, account: Account, duplicateIndex = 1): Transaction {
  const description = pickOptString(apiTransaction, TRANSACTION_DESCRIPTION_PATHS)
  const currency = pickOptString(apiTransaction, TRANSACTION_CURRENCY_PATHS)
  if (currency != null) {
    assert(currency === account.instrument, 'unexpected account transaction currency', apiTransaction)
  }
  const stableTransactionId = getStableTransactionId(apiTransaction, account, duplicateIndex)
  return {
    hold: getHoldStatus(apiTransaction),
    date: parseTransactionDate(apiTransaction),
    movements: [
      {
        id: stableTransactionId,
        account: { id: account.id },
        invoice: makeInvoice(apiTransaction, account),
        sum: pickTransactionSum(apiTransaction),
        fee: pickOptNumber(apiTransaction, ['fee', 'commission', 'commissionAmount']) ?? 0
      }
    ],
    merchant: description != null
      ? {
          fullTitle: description,
          mcc: pickOptNumber(apiTransaction, ['mcc']) ?? null,
          location: null
        }
      : null,
    comment: pickOptString(apiTransaction, TRANSACTION_COMMENT_PATHS) ?? null
  }
}
