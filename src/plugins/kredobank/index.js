import { flatten } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { login, fetchAccounts, fetchTransactions } from './api'
import { convertAccounts, convertTransaction } from './converters'

function createDateIntervals (fromDate, toDate) {
  const interval = 30 * 24 * 60 * 60 * 1000 // 30 days interval for fetching data
  const gapMs = 1
  return commonCreateDateIntervals({
    fromDate,
    toDate,
    addIntervalToDate: date => new Date(date.getTime() + interval - gapMs),
    gapMs
  })
}

export async function scrape ({ preferences, fromDate, toDate }) {
  const auth = await login(preferences, ZenMoney.getData('auth'))
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accounts = await Promise.all(['card', 'credit', 'deposit'].map(type => fetchAccounts(auth, type)))
    .then(contracts => {
      return convertAccounts(flatten(contracts))
        .filter(account => account !== null)
    })

  const transactions = []

  toDate = toDate || new Date()

  await Promise.all(accounts.map(async (account) => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }

    const dates = createDateIntervals(fromDate, toDate)

    const apiTransactions = await Promise.all(dates.map(date => {
      return fetchTransactions(auth, account, date[0], date[1])
    }))

    for (const apiTransaction of apiTransactions.flat()) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))

  return {
    accounts: accounts,
    transactions: transactions
  }
}
