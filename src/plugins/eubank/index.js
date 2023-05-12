import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, generateDevice, login, logout } from './api'
import { convertAccounts, convertTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  ZenMoney.locale = 'ru'
  toDate = toDate || new Date()
  const auth = await login(preferences, ZenMoney.getData('auth') || { device: generateDevice() })
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accountsData = convertAccounts(await fetchAccounts(auth))
  const accounts = []
  const transactions = []
  await Promise.all(accountsData.accounts.map(async (accountData) => {
    if (accountData.account) {
      accounts.push(accountData.account)
    } else {
      accounts.push(...accountData.accounts)
    }
    transactions.push(...convertTransactions(await fetchTransactions(auth, accountData.mainProduct, fromDate, toDate), accountData.account || accountData.accounts, accountsData.accountsByNumber))
  }))

  await logout()

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
