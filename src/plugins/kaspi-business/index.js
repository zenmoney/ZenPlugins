import { fetchAccounts, fetchLogin, fetchTransactions } from './api'
import { convertAccount, convertTransaction } from './converters'

export const scrape = async ({ preferences, fromDate, toDate }) => {
  if (!toDate) {
    toDate = new Date()
  }

  const auth = await fetchLogin(preferences)

  const accounts = []
  const transactions = []

  await Promise.all((await fetchAccounts(auth)).map(async account => {
    ZenMoney.setData('accounts', accounts)
    ZenMoney.saveData()
    accounts.push(convertAccount(account))
    if (ZenMoney.isAccountSkipped(account)) {
      return
    }
    const operations = await fetchTransactions(auth, account, fromDate, toDate)
    for (const operation of operations) {
      transactions.push(convertTransaction(operation, account))
    }
  }))
  return {
    accounts,
    transactions
  }
}
