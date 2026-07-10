import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { convertAccounts, convertTransaction } from './converters'
import { authorize, fetchAllAccounts, fetchAllTransactions } from './api'
import { Preferences } from './models'

// Точка входа плагина Altyn Wallet.
// Токен и PIN берутся из настроек (preferences.token, preferences.pin).
export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  // Подтверждаем сессию PIN-кодом (ставит сессионную куку NextAuth)
  await authorize(preferences)

  const accounts: Account[] = []
  const transactions: Transaction[] = []
  for (const { account } of convertAccounts(await fetchAllAccounts(preferences))) {
    accounts.push(account)
    // Пропускаем транзакции по счётам, отключённым пользователем в настройках
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }
    const apiTransactions = await fetchAllTransactions(preferences, fromDate, toDate)
    for (const apiTx of apiTransactions) {
      const tx = convertTransaction(apiTx, account)
      if (tx !== null) {
        transactions.push(tx)
      }
    }
  }
  return { accounts, transactions }
}
