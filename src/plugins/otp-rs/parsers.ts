import { OtpAccount, OtpTransaction } from './models'

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
    const [datePart, _] = dateString.split(' ')
    const [day, month, year] = datePart.split('.').map(Number)
    return new Date(year, month - 1, day)
  }
  let transaction_amount = 0

  if (apiTransaction[9] !== '') {
    transaction_amount = -parseFloat(apiTransaction[9])
  } else if (apiTransaction[10] !== '') {
    transaction_amount = parseFloat(apiTransaction[10])
  }

  const otpTransaction: OtpTransaction = {
    date: parseDate(apiTransaction[3]),
    title: apiTransaction[4],
    amount: transaction_amount,
    currencyCode: apiTransaction[2],
    currencyCodeNumeric: apiTransaction[1]
  }
  return otpTransaction
}
