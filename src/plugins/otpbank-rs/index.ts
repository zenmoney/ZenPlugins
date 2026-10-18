import { Account, ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchCards, fetchTransactions, login } from './api'
import { convertAccounts, convertCards, convertTransaction, mergeTransactionsByMovementId } from './converters'
import { Currency } from './helpers'
import { Auth, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const session = await login(preferences, ZenMoney.getData('auth') as Auth | undefined)
  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  const accounts: Account[] = []
  const transactions: ExtendedTransaction[] = []
  const convertedProducts = [
    ...convertAccounts(await fetchAccounts(session)),
    ...convertCards(await fetchCards(session))
  ]
  const allAccounts = convertedProducts.map(({ account }) => account)

  await Promise.all(convertedProducts.map(async ({ account, products }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    await Promise.all(products.map(async product => {
      const apiTransactions = await fetchTransactions(session, product, account.instrument as keyof typeof Currency, fromDate, toDate ?? new Date())
      for (const apiTransaction of apiTransactions) {
        transactions.push(convertTransaction(apiTransaction, account, allAccounts))
      }
    }))
  }))
  return {
    accounts,
    transactions: adjustTransactions({ transactions: mergeTransactionsByMovementId(transactions) })
  }
}
