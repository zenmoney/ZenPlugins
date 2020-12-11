import _ from 'lodash'
import { AuthError, fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertToZenMoneyTransactions, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (!toDate) {
    toDate = new Date()
  }
  preferences.inn = preferences.inn.toString().replace(/[^\d]/g, '')
  preferences.kpp = preferences.kpp?.toString().replace(/[^\d]/g, '') || '0'

  const accountsById = {}
  const accounts = []
  const transactionData = []

  let i = 0
  let auth = ZenMoney.getData('auth')
  let apiAccounts = null
  const isFirstRun = !auth
  do {
    auth = await login(auth, preferences, isInBackground)
    try {
      apiAccounts = await fetchAccounts(auth, preferences)
    } catch (e) {
      if (e instanceof AuthError) {
        if (!isFirstRun && i === 0) {
          auth.expirationDateMs = 0
        } else if (!isFirstRun && i === 1) {
          auth = undefined
        } else {
          throw new TemporaryError('Недостаточно прав для просмотра счетов и операций. Попробуйте подключить синхронизацию заново.')
        }
      } else {
        throw e
      }
    }
    i++
  } while (!apiAccounts)

  for (const apiAccount of apiAccounts) {
    const account = convertAccount(apiAccount)
    if (account) {
      accounts.push(account)
      accountsById[account.id] = account
    }
  }

  await Promise.all(accounts.map(async account => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    for (const apiTransaction of (await fetchTransactions(auth, preferences, account, fromDate, toDate))) {
      const data = convertTransaction(apiTransaction, account, accountsById)
      if (data) {
        transactionData.push(data)
      }
    }
  }))

  ZenMoney.setData('auth', auth)

  return {
    accounts,
    transactions: _.sortBy(convertToZenMoneyTransactions(transactionData), transaction => transaction.date)
  }
}
