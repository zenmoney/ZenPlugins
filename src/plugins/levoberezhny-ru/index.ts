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
  const savedDepositIds: unknown = ZenMoney.getData('syncedDepositIds')
  const syncedDepositIds = Array.isArray(savedDepositIds) ? savedDepositIds.filter((id): id is string => typeof id === 'string') : []
  const plans = convertAccounts(await fetchAccounts(session), syncedDepositIds)
  console.assert(plans.length > 0, 'No supported bank accounts')
  const transactions: ExtendedTransaction[] = []
  const histories = []
  for (const { account, fetchParams } of plans) {
    if (ZenMoney.isAccountSkipped(account.id)) continue
    const operations = await fetchTransactions(session, fetchParams, fromDate, toDate)
    histories.push({ account, operations })
  }
  const history = histories.flatMap(item => item.operations)
  for (const { account, operations } of histories) {
    transactions.push(...convertTransactions(operations, account, fromDate, toDate, plans.map(plan => plan.account), history))
  }
  const accounts = plans.map(({ account }) => {
    if (account.type !== AccountType.ccard && account.type !== AccountType.checking && account.type !== AccountType.deposit) throw new Error('Unsupported account type for history')
    return account
  })
  const grouped = groupTransactions(transactions)
  const depositIds = accounts.filter(account => account.type === AccountType.deposit || ('savings' in account && account.savings === true)).map(account => account.id)
  if (depositIds.length > 0) {
    ZenMoney.setData('syncedDepositIds', Array.from(new Set([...syncedDepositIds, ...depositIds])))
    ZenMoney.saveData()
  }
  return { accounts, transactions: grouped }
}
