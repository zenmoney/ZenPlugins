import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, generateAuth, login } from './api'
import { convertAccounts, convertTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  ZenMoney.locale = 'ru'
  toDate = toDate || new Date()
  let auth = ZenMoney.getData('auth')
  if (!auth) {
    auth = generateAuth()
  }
  auth = await login(preferences, auth)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accountsData = convertAccounts(await fetchAccounts(auth))
  const accounts = []
  const transactions = []
  await Promise.all(accountsData.map(async ({ mainProduct, account }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    transactions.push(...convertTransactions(await fetchTransactions(auth, mainProduct, fromDate, toDate), account))
  }))

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
