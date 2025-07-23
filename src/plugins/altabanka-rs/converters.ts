import { AccountOrCard, AccountType, ExtendedTransaction } from '../../types/zenmoney'
import { AccountInfo, AccountTransaction } from './types'

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

  const merchant = {
    fullTitle: accountTransaction.address,
    mcc: null,
    location: null
  }

  const transaction: ExtendedTransaction = {
    hold,
    date: accountTransaction.date,
    movements: [
      {
        id: accountTransaction.id,
        account: { id: account.id },
        sum: accountTransaction.amount,
        fee: 0,
        invoice: invoice?.instrument === account.currency ? null : invoice
      }
    ],
    merchant,
    comment: accountTransaction.description !== '' && (match == null) ? accountTransaction.description : null
  };
  [
    parseCashTransfer
  ].some(parser => parser(transaction, accountTransaction, account, invoice))
  return transaction
}

function parseCashTransfer (transaction: ExtendedTransaction, accountTransaction: AccountTransaction, account: AccountInfo, invoice: { sum: number, instrument: string }): boolean {
  if ([
    /ATM/
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
    return true
  }
  return false
}
