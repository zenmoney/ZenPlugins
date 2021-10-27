// import { convertTransaction, convertAccounts } from './converters'
import {
  fetchAccounts,
  fetchFullTransactions,
  login,
  parseTransactions
  // fetchDeposits,
  // parseDeposits
} from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  const token = await login(preferences.login, preferences.password)

  let accounts = await allAccounts(token)
  if (accounts.length === 0) {
    // если активация первый раз, но карточки все еще не выпущены
    return {
      accounts: [],
      transactions: []
    }
  }

  const transactionsStatement = []
  accounts = await Promise.all(accounts.map(async account => {
    if (account.transactionsAccId) {
      const mails = await fetchFullTransactions(token, account, fromDate, toDate)
      const transactions = parseTransactions(mails)
      for (const apiTransaction of transactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactionsStatement.push(transaction)
        }
      }
      // const mail = await fetchDeposits(token)
      // const transaction = parseDeposits(mail)
    }
    return account
  }))
  return {
    accounts: accounts,
    transactions: transactionsStatement
  }
}

async function allAccounts (token) {
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
    .filter(account => account !== null)

  return accounts
}
