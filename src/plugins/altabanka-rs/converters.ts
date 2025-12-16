import { AccountOrCard, AccountType, ExtendedTransaction } from '../../types/zenmoney'
import { AccountInfo, AccountTransaction } from './types'
import { toISODateString, dateInTimezone } from '../../common/dateUtils'

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
  accountTransaction.currency = accountTransaction.currency === undefined
    ? 'RSD'
    : accountTransaction.currency

  if (accountTransaction.amount === 0) {
    return null
  }
  let invoice = {
    sum: accountTransaction.amount,
    instrument: accountTransaction.currency
  }
  const match = accountTransaction.description.match(/^([\d.]+)\s(\w{3})/)
  if (match != null) {
    invoice = {
      sum: accountTransaction.amount < 0 ? -parseFloat(match[1]) : parseFloat(match[1]),
      instrument: match[2]
    }
  }

  const transaction: ExtendedTransaction = {
    hold,
    date: accountTransaction.date,
    movements: [
      {
        id: accountTransaction.id,
        account: { id: account.id },
        sum: invoice?.instrument !== account.currency ? null : accountTransaction.amount,
        fee: 0,
        invoice: invoice?.instrument === account.currency ? null : invoice
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
    const idCurrency = accountTransaction.id.split('%')[0]
    transaction.groupKeys = [
      `${toISODateString(dateInTimezone(transaction.date, 180)).slice(0, 10)}_${invoice.instrument}_${Math.abs(invoice.sum)}`,
      `${idCurrency}`
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
