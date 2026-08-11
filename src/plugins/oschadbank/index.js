import { isArray } from 'lodash'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, generateDevice, login } from './api'
import { convertAccounts, convertTransactions } from './converters'

export async function scrape ({ preferences, isInBackground, fromDate, toDate }) {
  await ZenMoney.restoreCookies()
  let auth = ZenMoney.getData('auth')
  if (!auth) {
    auth = {
      device: generateDevice()
    }
    ZenMoney.setData('auth', auth)
    ZenMoney.saveData()
  }
  auth = await login(preferences, isInBackground, auth)

  let apiAccounts = await fetchAccounts(auth.device)
  if (!apiAccounts) {
    auth = await login(preferences, isInBackground, auth)
    apiAccounts = await fetchAccounts(auth.device)
    console.assert(apiAccounts, 'Still can\'t get accounts after relogin')
  }
  const workingAccounts = convertAccounts(apiAccounts)
  const accounts = []
  const transactions = []

  await Promise.all(workingAccounts.map(async ({ account, mainProduct }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    let apiTransactions = await fetchTransactions(mainProduct, fromDate, toDate, auth.device)
    if (!apiTransactions) {
      auth = await login(preferences, isInBackground, auth)
      apiTransactions = await fetchTransactions(mainProduct, fromDate, toDate, auth.device)
      console.assert(apiTransactions, 'Still can\'t get transactions after relogin')
    }
    transactions.push(...convertTransactions(apiTransactions, account))
  }))
  await ZenMoney.saveCookies()

  if (!isArray(accounts) || accounts.length === 0) {
    throw new Error('Пустой список счетов')
  }

  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
