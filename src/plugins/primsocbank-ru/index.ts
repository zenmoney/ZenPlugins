import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransactions } from './converters'
import { Auth, Preferences, ProductKind } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const session = await login(preferences, ZenMoney.getData('auth') as Auth | undefined)

  const convertedAccounts = convertAccounts(await fetchAccounts(preferences, session))
  const accounts: Account[] = convertedAccounts.map(({ account }) => account)
  const transactions: Transaction[] = []

  await Promise.all(convertedAccounts.map(async ({ account, product }) => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    if (product.kind === ProductKind.loan) {
      return
    }
    const productTransactions = convertTransactions(await fetchTransactions(preferences, session, product, fromDate, toDate ?? new Date()), account)
    transactions.push(...productTransactions)
  }))

  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  return {
    accounts,
    transactions
  }
}
