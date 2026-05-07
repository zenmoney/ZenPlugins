import { fetchAccounts, fetchCardBalance, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction, patchAccountFromSummary } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)

  const transactions = []
  for (const account of accounts) {
    const { history: apiTransactions, summaryData, msCardId } = await fetchTransactions(token, account, fromDate, toDate)
    if (msCardId) {
      const realTimeBalance = await fetchCardBalance(token, msCardId)
      if (realTimeBalance !== null) {
        const parsedBalance = parseFloat(realTimeBalance)
        const overdraftAmt = parseFloat(summaryData?.overdraftSum || 0) || 0
        if (overdraftAmt > 0) {
          account.balance = Math.round((parsedBalance - overdraftAmt) * 100) / 100
          account.creditLimit = overdraftAmt
        } else {
          account.balance = Math.round(parsedBalance * 100) / 100
        }
      } else {
        Object.assign(account, patchAccountFromSummary(account, summaryData))
      }
    } else {
      Object.assign(account, patchAccountFromSummary(account, summaryData))
    }
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }
  return {
    accounts,
    transactions
  }
}
