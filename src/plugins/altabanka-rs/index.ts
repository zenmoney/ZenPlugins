import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Preferences } from './types'
import { convertAccounts, convertTransaction } from './converters'
import { altaBankaApi } from './api'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  await altaBankaApi.login(preferences)

  const apiAccounts = await altaBankaApi.fetchAccounts()
  const accounts: Account[] = convertAccounts(apiAccounts)
  const transactions: Transaction[] = []

  await Promise.all(apiAccounts.map(async (account) => {
    if (ZenMoney.isAccountSkipped(account.iban)) {
      return
    }

    const apiTransactions = await altaBankaApi.fetchTransactions(
      account,
      fromDate,
      toDate ?? new Date()
    )

    transactions.push(
      ...apiTransactions
        .map(t => convertTransaction(t, account))
        .filter((tx): tx is Transaction => tx !== null)
    )
  }))

  return { accounts, transactions }
}
