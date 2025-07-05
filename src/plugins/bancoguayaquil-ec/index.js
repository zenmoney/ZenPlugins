import { login, fetchAccounts, fetchTransactions } from './api'

export const scrape = async ({ preferences, fromDate, toDate }) => {
  ZenMoney.locale = 'es'
  toDate = toDate ?? new Date()

  // ZenMoney.setData('uuid', 'f47ac10b-58cc-4372-a567-0e02b2c3d479') // debug

  const creds = await login(preferences)
  const accountsData = await fetchAccounts(creds)
  const transactions = await fetchTransactions(creds, accountsData, fromDate, toDate)

  return { accounts: accountsData.accounts, transactions }
}
