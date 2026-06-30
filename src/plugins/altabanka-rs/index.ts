import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Preferences } from './types'
import { convertAccounts, convertTransaction } from './converters'
import { altaBankaApi } from './api'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  // Пробуем восстановить прошлую сессию
  // Если удалось — OTP не спрашиваем
  const sessionRestored = await altaBankaApi.restoreSession()

  let apiAccounts = null
  if (sessionRestored) {
    try {
      apiAccounts = await altaBankaApi.fetchAccounts()
    } catch {
      // Сессия протухла — логинимся заново
      apiAccounts = null
    }
  }

  if (apiAccounts === null) {
    await altaBankaApi.login(preferences.login)
    apiAccounts = await altaBankaApi.fetchAccounts()
  }

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
