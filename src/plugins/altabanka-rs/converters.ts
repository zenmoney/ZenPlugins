import { AccountOrCard, AccountType, ExtendedTransaction, Transaction } from '../../types/zenmoney'
import { AccountInfo, AccountTransaction } from './models'
import { toISODateString, dateInTimezone } from '../../common/dateUtils'
import { getNumber, getString } from '../../types/get'

export function convertAccounts (apiAccounts: AccountInfo[]): AccountOrCard[] {
  return apiAccounts.map(apiAccount => {
    return {
      id: apiAccount.id,
      type: AccountType.ccard,
      title: apiAccount.name,
      instrument: apiAccount.currency,
      balance: apiAccount.balance,
      available: apiAccount.balance,
      creditLimit: 0,
      syncIds: [apiAccount.id]
    }
  })
}

export function convertTransaction (accountTransaction: AccountTransaction, account: AccountInfo, hold = false): ExtendedTransaction | null {
  const currency = accountTransaction.currency ?? 'RSD'

  if (accountTransaction.amount === 0) {
    return null
  }

  const match = accountTransaction.description.match(/^([\d.]+)\s(\w{3})/)

  let invoice = {
    sum: accountTransaction.amount,
    instrument: currency
  }
  if (accountTransaction.invoice != null) {
    // Card transaction: domestic `amount` plus the original-currency invoice.
    invoice = accountTransaction.invoice
  } else if (match != null) {
    invoice = {
      sum: accountTransaction.amount < 0 ? -parseFloat(match[1]) : parseFloat(match[1]),
      instrument: match[2]
    }
  }

  const foreign = invoice.instrument !== account.currency
  // Card transactions carry the domestic amount, so we keep `sum` even for foreign currency.
  const sum = accountTransaction.invoice != null ? accountTransaction.amount : (foreign ? null : accountTransaction.amount)

  const transaction: ExtendedTransaction = {
    hold,
    date: accountTransaction.date,
    movements: [
      {
        id: accountTransaction.id,
        account: { id: account.id },
        sum,
        fee: 0,
        invoice: foreign ? invoice : null
      }
    ],
    merchant: null,
    comment: accountTransaction.description !== '' && (match == null) ? accountTransaction.description : null
  };
  [
    parseCashTransfer,
    parseInnerTransfer,
    parsePayeeAndComment
  ].some(parser => parser(transaction, accountTransaction, account, invoice))
  return transaction
}

function parseCashTransfer (transaction: ExtendedTransaction, accountTransaction: AccountTransaction, account: AccountInfo, invoice: { sum: number, instrument: string }): boolean {
  if ([
    /ATM/,
    /Gotovinska/i
  ].some(regexp => regexp.test(accountTransaction.address))) {
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        instrument: invoice.instrument,
        syncIds: null,
        type: AccountType.cash
      },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })
  }
  return false
}

function parseInnerTransfer (transaction: ExtendedTransaction, accountTransaction: AccountTransaction, account: AccountInfo, invoice: { sum: number, instrument: string }): boolean {
  if ([
    /Interni transfer/i,
    /Kupovina deviza/i
  ].some(regex => regex.test(accountTransaction.address))) {
    transaction.groupKeys = [
      `${toISODateString(dateInTimezone(transaction.date, 180)).slice(0, 10)}_${invoice.instrument}_${Math.abs(invoice.sum)}`,
      accountTransaction.id
    ]
    transaction.merchant = null
    transaction.comment = accountTransaction.address

    return true
  }
  return false
}

function parsePayeeAndComment (transaction: ExtendedTransaction, accountTransaction: AccountTransaction, account: AccountInfo, invoice: { sum: number, instrument: string }): boolean {
  transaction.merchant = {
    fullTitle: accountTransaction.address,
    mcc: null,
    location: null
  }
  if ([
    /Uplata/i,
    /Gotovinska/i
  ].some(regex => regex.test(accountTransaction.address))) {
    transaction.merchant = null
    transaction.comment = accountTransaction.address
  }
  return false
}

export function deduplicateTransactions (transactions: Transaction[]): Transaction[] {
  const result = transactions.concat()
  for (let i = 0; i < result.length; ++i) {
    for (let j = i + 1; j < result.length; ++j) {
      if (getDeduplicationKey(result[i]) === getDeduplicationKey(result[j])) {
        result[i].hold = false
        result.splice(j--, 1)
      }
    }
  }
  return result
}

function getDeduplicationKey (transaction: Transaction): string | null {
  if (transaction.movements.length !== 1) {
    return null
  }
  const movement = transaction.movements[0]
  const accountId = getString(movement.account, 'id')
  const sum = getNumber(movement, 'sum')
  if (accountId === null || sum === null) {
    return null
  }
  return JSON.stringify({
    year: transaction.date.getFullYear(),
    month: transaction.date.getMonth(),
    day: transaction.date.getDate(),
    hour: transaction.date.getHours(),
    accountId,
    sum,
    merchant: transaction.merchant,
    comment: transaction.comment
  })
}
