import { fetchAccounts, fetchTransactions, login, generateDevice } from './api'
import { convertAccounts, convertTransaction, duplicatesTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  ZenMoney.locale = 'uk'
  toDate = toDate || new Date()

  // upgrade
  const device = ZenMoney.getData('device')
  if (device) {
    ZenMoney.setData('device', null)
    ZenMoney.setData('auth', null)
  }

  let auth = ZenMoney.getData('auth')

  if (!auth) {
    auth = { device: generateDevice() }
  }

  await login(preferences, auth, isInBackground, updatedAuth => {
    ZenMoney.setData('auth', updatedAuth)
    ZenMoney.saveData()
  })
  const plans = convertAccounts(await fetchAccounts(auth))
  const accounts = plans.map(plan => plan.account)
  const transactions = []

  await Promise.all(plans.map(async ({ account, product }) => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
    const newApiTransactions = duplicatesTransactions(apiTransactions)
    for (const apiTransaction of newApiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))
  return {
    accounts,
    transactions
  }
}
