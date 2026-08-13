import { Account, AccountType, Transaction } from '../../types/zenmoney'
import {
  FetchCardAccount,
  FetchCurrentAccount,
  FetchCardTransaction,
  FetchStatementOperation,
  FetchCardAccountMeta,
  FetchCurrentAccountMeta
} from './types/fetch.types'
import { convertIsoDateStringToDate, getBusinessDateIdentityKey } from './helpers'
import { appendCashbackComment } from './cashback.js'

export type TransactionIdentityStage = 'pending' | 'posted'
export type TransactionWithIdentityStage = Transaction & { identityStage?: TransactionIdentityStage }

const normalizeIdPart = (value: string | null | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim().toUpperCase()

const getAmountIdentityKey = ({
  accountInstrument,
  sum,
  invoice
}: {
  accountInstrument: string
  sum: number | null
  invoice: { sum: number, instrument: string } | null
}): string => {
  if (invoice != null) {
    return `invoice|${invoice.instrument}|${invoice.sum.toFixed(2)}`
  }

  return `sum|${accountInstrument}|${(sum ?? 0).toFixed(2)}`
}

const buildMovementId = ({
  accountId,
  accountInstrument,
  date,
  merchantTitle,
  mcc,
  sum,
  invoice
}: {
  accountId: string
  accountInstrument: string
  date: Date
  merchantTitle: string | null
  mcc: number | null
  sum: number | null
  invoice: { sum: number, instrument: string } | null
}): string => {
  return [
    'zepterbank-by',
    accountId,
    getBusinessDateIdentityKey(date),
    date.toISOString(),
    getAmountIdentityKey({ accountInstrument, sum, invoice }),
    String(mcc ?? ''),
    normalizeIdPart(merchantTitle)
  ].join('|')
}

const parseMcc = (mcc: string | undefined): number | null => {
  const digits = mcc?.replace(/\D/g, '') ?? ''

  if (digits === '') {
    return null
  }

  const parsedMcc = Number(digits)

  return Number.isInteger(parsedMcc) && parsedMcc > 0
    ? parsedMcc
    : null
}

const normalizeMerchantTitle = (title: string | undefined): string | null => {
  const normalizedTitle = title?.trim()

  return normalizedTitle != null && normalizedTitle !== ''
    ? normalizedTitle
    : null
}

const getStatementDedupDate = (fetchTransaction: FetchStatementOperation): Date | null => {
  const isAccountCurrencyOnlyOperation =
    Number(fetchTransaction.transactionSum) === 0 &&
    Number(fetchTransaction.operationSum) !== 0

  if (!isAccountCurrencyOnlyOperation || fetchTransaction.balanceDate == null) {
    return null
  }

  return convertIsoDateStringToDate(`${fetchTransaction.balanceDate}T00:00:00`)
}

export const convertCardAccount = (fetchAccount: FetchCardAccount): Account & FetchCardAccountMeta => {
  return {
    id: fetchAccount.productCardId,
    title: fetchAccount.cardProductKindName,
    balance: Number(fetchAccount.amount),
    instrument: fetchAccount.currencyIso,
    syncIds: [
      fetchAccount.ibanNum,
      fetchAccount.contractNumber,
      fetchAccount.cardPAN.slice(-4)
    ],
    type: AccountType.ccard,
    _meta: {
      cardTransactionsFetchId: fetchAccount.productCardId,
      productStatementFetchId: fetchAccount.productId
    }
  }
}

export const convertCurrentAccount = (fetchAccount: FetchCurrentAccount): Account & FetchCurrentAccountMeta => {
  return {
    id: fetchAccount.productId,
    title: fetchAccount.contractKindName, // could be the same for some accounts, for check
    balance: Number(fetchAccount.contractCurrentRest),
    instrument: fetchAccount.contractCurrencyIso,
    syncIds: [fetchAccount.ibanNum, fetchAccount.contractNumber],
    type: AccountType.checking,
    _meta: {
      cardTransactionsFetchId: null,
      productStatementFetchId: fetchAccount.productId
    }
  }
}

export const convertCardTransaction = (fetchTransaction: FetchCardTransaction, account: Account): Transaction => {
  const isInDifferentCurrency = fetchTransaction.currencyIso !== account.instrument
  const identityStage: TransactionIdentityStage = /\bPRE-PURCHASE\b/i.test(fetchTransaction.transacName) ? 'pending' : 'posted'
  const isDebit = fetchTransaction.transOperType === 'debit' || /\bPURCH COMPL\b/i.test(fetchTransaction.transacName)
  const amount = Number(`${isDebit ? '-' : ''}${fetchTransaction.amount}`)
  const merchantTitle = normalizeMerchantTitle(fetchTransaction.cardAcceptor)
  const mcc = parseMcc(fetchTransaction.transMcc)
  const invoice = isInDifferentCurrency ? { sum: amount, instrument: fetchTransaction.currencyIso } : null
  const sum = isInDifferentCurrency ? null : amount
  const date = convertIsoDateStringToDate(fetchTransaction.effectiveDate)
  const movementId = buildMovementId({
    accountId: account.id,
    accountInstrument: account.instrument,
    date,
    merchantTitle,
    mcc,
    sum,
    invoice
  })

  const transaction: Transaction = {
    hold: null,
    date,
    comment: appendCashbackComment(fetchTransaction.transacName, mcc),
    movements: [
      {
        id: movementId,
        account: { id: account.id },
        fee: 0,
        invoice,
        sum
      }
    ],
    merchant: merchantTitle !== null
      ? {
          fullTitle: merchantTitle,
          mcc,
          location: null
        }
      : null
  }

  Object.defineProperty(transaction, 'identityStage', {
    value: identityStage,
    enumerable: false,
    configurable: true
  })

  return transaction
}

export const convertStatementTransaction = (fetchTransaction: FetchStatementOperation, account: Account): Transaction => {
  const operationAmount = Number(fetchTransaction.operationSum) * fetchTransaction.operationSign
  const transactionAmount = Number(fetchTransaction.transactionSum) * fetchTransaction.operationSign
  const hasInvoice = fetchTransaction.operationCurrencyIso !== fetchTransaction.transactionCurrencyISO

  const payee = fetchTransaction.terminalLocation ?? ''
  const [country = '', city = ''] = (fetchTransaction.merchant ?? '').split(' ')
  const mcc = parseMcc(fetchTransaction.MCC)
  const invoice = hasInvoice ? { sum: transactionAmount, instrument: fetchTransaction.transactionCurrencyISO } : null
  const date = convertIsoDateStringToDate(fetchTransaction.transactionDate)
  const dedupDate = getStatementDedupDate(fetchTransaction)
  const movementId = buildMovementId({
    accountId: account.id,
    accountInstrument: account.instrument,
    date,
    merchantTitle: payee,
    mcc,
    sum: operationAmount,
    invoice
  })

  const transaction: Transaction = {
    hold: null,
    date,
    comment: appendCashbackComment(fetchTransaction.operationName, mcc),
    movements: [
      {
        id: movementId,
        account: { id: account.id },
        fee: 0,
        invoice,
        sum: operationAmount
      }
    ],
    merchant: mcc !== null
      ? {
          title: payee,
          mcc,
          country,
          city,
          location: null
        }
      : null
  }

  if (dedupDate !== null) {
    Object.defineProperty(transaction, 'dedupDate', {
      value: dedupDate,
      enumerable: false,
      configurable: true
    })
  }

  return transaction
}
