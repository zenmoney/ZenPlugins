import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const session = await login(preferences, ZenMoney.getData('auth') as Auth | undefined)
  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  /* const accounts: Account[] = [] */
  const transactions: Transaction[] = []

  const credoAccounts = await fetchAccounts(session)
  const accounts = convertAccounts(credoAccounts)

  console.log('scrape_accounts: ', accounts)

  for (const account of accounts) {
    console.log(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }
    console.log('>>> Getting transactions for account: ' + account.id)
    const apiTransactions = await fetchTransactions(session, account.id, fromDate, toDate!)
    for (const apiTransaction of apiTransactions) {
      transactions.push(convertTransaction(apiTransaction, account))
    }
  }

  return { accounts, transactions }
}
