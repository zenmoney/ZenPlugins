import { Account, ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences } from './models'
import { adjustTransactions } from '../../common/transactionGroupHandler'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  ZenMoney.locale = 'en'
  toDate = toDate ?? new Date()
  const session = await login(preferences, ZenMoney.getData('auth') as Auth | undefined)
  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  const accounts: Account[] = []
  const transactions: ExtendedTransaction[] = []
  await Promise.all(convertAccounts(await fetchAccounts(session)).map(async product => {
    accounts.push(product.account)
    if (ZenMoney.isAccountSkipped(product.account.id)) {
      return
    }
    if (product.tag === 'card') {
      transactions.push(...product.holdTransactions)
    }
    const apiTransactions = await fetchTransactions(product, fromDate, toDate!, session)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, product)
      if (transaction != null) {
        transactions.push(transaction)
      }
    }
  }))
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
