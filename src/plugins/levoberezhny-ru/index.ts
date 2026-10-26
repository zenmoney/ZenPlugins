import { AccountType, ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login } from './api'
import { trustBankCertificates } from './certs'
import { convertAccounts, convertTransactions } from './converters'
import { Preferences } from './models'
import { groupTransactions } from './transfers'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'ru'
  trustBankCertificates()
  const session = await login(preferences, ZenMoney.getData('auth'), isInBackground, auth => {
    ZenMoney.setData('auth', auth)
    ZenMoney.saveData()
  })
  const plans = convertAccounts(await fetchAccounts(session))
  console.assert(plans.length > 0, 'No supported card or open current accounts')
  const transactions: ExtendedTransaction[] = []
  for (const { account, fetchParams } of plans) {
    if (ZenMoney.isAccountSkipped(account.id)) continue
    const operations = await fetchTransactions(session, fetchParams, fromDate, toDate)
    transactions.push(...convertTransactions(operations, account, fromDate, toDate, plans.map(plan => plan.account)))
  }
  const accounts = plans.map(({ account }) => {
    if (account.type !== AccountType.ccard && account.type !== AccountType.checking) throw new Error('Unsupported account type for history')
    return {
      id: account.id,
      type: account.type,
      title: account.title,
      instrument: account.instrument,
      syncIds: account.syncIds,
      archived: account.archived,
      balance: account.balance
    }
  })
  return { accounts, transactions: groupTransactions(transactions) }
}
