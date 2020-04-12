import { convertAccount, convertTransaction } from './converters'
import { login, fetchPolicies, fetchTransactions } from './api'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  await login(preferences)
  let policies = (await fetchPolicies())
    .map(convertAccount)
    .filter(account => account !== null)
  let transactions = []
  for (let i = 0; i < policies.length; i++) {
    let polTransactions = (await fetchTransactions(policies[i], fromDate, toDate))
      .map(transaction => convertTransaction(transaction, policies[i]))
      .filter(transaction => transaction !== null)
    transactions.push(...polTransactions)
  }

  return {
    accounts: policies,
    transactions: transactions
  }
}
