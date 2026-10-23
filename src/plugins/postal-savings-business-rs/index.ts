import { restoreCookies, saveCookies } from '../../common/network'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { AccountOrCard, ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { authenticate, fetchTransactions } from './api'
import { convertAccounts, convertTransactions } from './converters'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'sr'
  await restoreCookies()
  const plans = convertAccounts(await authenticate(preferences, isInBackground, saveCookies))
  const accounts: AccountOrCard[] = plans.map(plan => plan.account)
  const transactions: ExtendedTransaction[] = []
  for (const plan of plans) {
    if (ZenMoney.isAccountSkipped(plan.account.id)) continue
    const raw = await fetchTransactions(plan.fetchParams, fromDate, toDate)
    const converted = convertTransactions(raw, plan.account, accounts)
    if (converted.length !== raw.length) console.debug('Collapsed duplicate booked SEPA receipts', { sourceRecords: raw.length, transactions: converted.length })
    for (const transaction of converted) {
      if (transaction.date >= fromDate && (toDate == null || transaction.date <= toDate)) transactions.push(transaction)
    }
  }
  return { accounts, transactions: adjustTransactions({ transactions }) }
}
