import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Auth, fetchAccounts, fetchTransactions, login, Preferences } from './api'
import { convertAccounts, convertTransaction } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const auth = await login(preferences, ZenMoney.getData('auth') as Auth)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accounts: Account[] = []
  const transactions: Transaction[] = []
  await Promise.all(convertAccounts(await fetchAccounts(auth)).map(async ({ account, products }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    await Promise.all(products.map(async product => {
      const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account)
        transactions.push(transaction)
      }
    }))
  }))
  return {
    accounts,
    transactions
  }
}
