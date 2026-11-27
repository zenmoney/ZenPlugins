import type { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { authenticateAndFetchBalance, fetchLedgers, parseAuth } from './api'
import type { Auth, Preferences } from './api'
import { convertAccounts, convertTransaction } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'tr'
  const saveAuth = (auth: Auth): void => {
    ZenMoney.setData('auth', auth)
    ZenMoney.saveData()
  }
  const { auth, balance } = await authenticateAndFetchBalance(preferences, parseAuth(ZenMoney.getData('auth')), isInBackground, saveAuth)

  const accounts = convertAccounts(balance)
  console.assert(accounts.length > 0, 'Papara returned no supported balances')

  const transactions: Transaction[] = []
  // One ledger request covers every currency, so it is skipped only when all accounts are skipped.
  const activeAccountIds = new Set(accounts.filter(account => !ZenMoney.isAccountSkipped(account.id)).map(account => account.id))
  if (activeAccountIds.size > 0) {
    for (const item of await fetchLedgers(auth.token, fromDate)) {
      const transaction = convertTransaction(item, accounts)
      if (transaction === null || transaction.date < fromDate || (toDate != null && transaction.date > toDate)) continue
      const accountId = (transaction.movements[0].account as { id: string }).id
      if (activeAccountIds.has(accountId)) transactions.push(transaction)
    }
  }
  return { accounts, transactions }
}
