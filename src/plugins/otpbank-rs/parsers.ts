import { OtpAccount, OtpTransaction } from './models'
import { decode } from 'html-entities'

export function parseAccounts (apiAccounts: string[][]): OtpAccount[] {
  const accounts: OtpAccount[] = []
  for (const apiAccount of apiAccounts) {
    const res = parseAccount(apiAccount)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function parseAccount (apiAccount: string[]): OtpAccount {
  const account: OtpAccount = {
    accountNumber: apiAccount[1],
    description: apiAccount[2],
    currencyCode: apiAccount[3],
    balance: parseFloat(apiAccount[5]),
    currencyCodeNumeric: apiAccount[14]
  }
  return account
}

export function parseTransactions (apiTransactions: string[][]): OtpTransaction[] {
  const transactions: OtpTransaction[] = []
  for (const apiTransaction of apiTransactions) {
    const res = parseTransaction(apiTransaction)
    if (res != null) {
      transactions.push(res)
    }
  }
  return transactions
}

function parseTransaction (apiTransaction: string[]): OtpTransaction {
  const parseDate = (dateString: string): Date => {
    const [datePart] = dateString.split(' ')
    const [day, month, year] = datePart.split('.').map(Number)
    return new Date(year, month - 1, day)
  }
  let transactionAmount = 0

  if (apiTransaction[9] !== '') {
    transactionAmount = -parseFloat(apiTransaction[9])
  } else if (apiTransaction[10] !== '') {
    transactionAmount = parseFloat(apiTransaction[10])
  }

  const otpTransaction: OtpTransaction = {
    date: parseDate(apiTransaction[3]),
    title: decode(apiTransaction[4]),
    amount: transactionAmount,
    currencyCode: apiTransaction[2],
    currencyCodeNumeric: apiTransaction[1]
  }
  return otpTransaction
}
