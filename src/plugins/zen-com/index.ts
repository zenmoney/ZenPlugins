import type { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions } from './api'
import { convertAccounts, convertTransactions } from './converters'
import { loginMobile } from './mobile'

export const scrape: ScrapeFunc<Record<string, unknown>> = async ({ fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'en'
  const session = await loginMobile(ZenMoney.getData('mobileAuth'), isInBackground, async auth => {
    ZenMoney.setData('mobileAuth', auth)
    await ZenMoney.saveData()
  })
  const plans = convertAccounts(await fetchAccounts(session))
  const accounts = plans.flatMap(plan => plan.accounts)
  const transactions: Transaction[] = []
  for (const plan of plans) {
    const includedIds = new Set(plan.accounts.filter(account => !ZenMoney.isAccountSkipped(account.id)).map(account => account.id))
    if (includedIds.size === 0) continue
    transactions.push(...convertTransactions(await fetchTransactions(session, plan.fetchParams, fromDate, toDate), plan.accounts, includedIds, plan.knownAccountNumbers))
  }
  return { accounts, transactions }
}
