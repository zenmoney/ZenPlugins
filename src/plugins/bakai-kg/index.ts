import { adjustTransactions } from '../../common/transactionGroupHandler'
import { ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { fetchAccountBalance, fetchAccounts, fetchTransactions, getHistoryDates, login } from './api'
import { convertAccounts, convertTransactions } from './converters'
import { AuthState, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'ru'
  const persist = (state: AuthState): void => {
    ZenMoney.setData('auth', state)
    ZenMoney.saveData()
  }
  const state = await login(preferences, ZenMoney.getData('auth', null), isInBackground, persist)
  const plans = convertAccounts(await fetchAccounts(state))
  persist(state)
  // Validate every selected source before loading any history or returning data.
  for (const plan of plans) {
    if (!ZenMoney.isAccountSkipped(plan.account.id)) getHistoryDates(plan.fetchParams, fromDate, toDate)
  }
  const transactions: ExtendedTransaction[] = []
  for (const plan of plans) {
    plan.account.balance = await fetchAccountBalance(state, plan.fetchParams.accountId)
    if (ZenMoney.isAccountSkipped(plan.account.id)) continue
    const records = await fetchTransactions(state, plan.fetchParams, fromDate, toDate)
    transactions.push(...convertTransactions(records, plan.account, fromDate, toDate))
  }
  const accounts = plans.map(plan => plan.account)
  return { accounts, transactions: adjustTransactions({ transactions }) }
}
