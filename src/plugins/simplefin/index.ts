import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, login } from './api'
import { convertAccounts, convertTransactions } from './converters'
import { Auth, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const auth = await login(preferences, ZenMoney.getData('auth') as Auth | undefined)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accountSet = await fetchAccounts(auth, fromDate, toDate)
  const accounts: Account[] = []
  const transactions: Transaction[] = []

  for (const convertedAccount of convertAccounts(accountSet)) {
    accounts.push(convertedAccount.account)
    if (ZenMoney.isAccountSkipped(convertedAccount.account.id)) {
      continue
    }
    transactions.push(...convertTransactions(convertedAccount.apiAccount))
  }

  return {
    accounts,
    transactions
  }
}
