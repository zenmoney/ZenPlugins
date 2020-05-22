import { fetchPolicies, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  await login(preferences)
  const policies = (await fetchPolicies())
    .map(convertAccount)
    .filter(account => account !== null)
  const transactions = []
  for (let i = 0; i < policies.length; i++) {
    const polTransactions = (await fetchTransactions(policies[i], fromDate, toDate))
      .map(transaction => convertTransaction(transaction, policies[i]))
      .filter(transaction => transaction !== null)
    transactions.push(...polTransactions)
  }

  return {
    accounts: policies,
    transactions: transactions
  }
}
