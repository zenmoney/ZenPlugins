import { keyBy } from 'lodash'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api.js'
import { convertAccounts, convertTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  ZenMoney.locale = 'ru'
  toDate = toDate || new Date()
  const auth = await login(preferences, isInBackground)
  const accountsData = convertAccounts(await fetchAccounts(preferences, auth))
  const transactionsData = {
    cardTransactions: [],
    accountTransactions: []
  }
  const accounts = []
  await Promise.all(accountsData.map(async (data) => {
    accounts.push(data.account)
    if (ZenMoney.isAccountSkipped(data.account.id) || !data.mainProduct) {
      return
    }
    const accountTransactions = await fetchTransactions(preferences, auth, data.mainProduct, fromDate, toDate)
    transactionsData.cardTransactions.push(...accountTransactions.cardTransactions)
    transactionsData.accountTransactions.push(...accountTransactions.accountTransactions)
  }))
  const transactions = convertTransactions(transactionsData, keyBy(accounts, account => account.id))
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
