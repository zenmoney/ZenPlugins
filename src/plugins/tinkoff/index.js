import * as Tinkoff from './api'
import * as _ from 'lodash'
import { convertAccount, convertTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  const pinHash = ZenMoney.getData('pinHash', null)
  const auth = await Tinkoff.login(preferences, isInBackground, { pinHash: pinHash })
  const fetchedData = await Tinkoff.fetchAccountsAndTransactions(auth, fromDate, toDate)

  // обработаем счета
  const accounts = {}
  const initialized = ZenMoney.getData('initialized', false) // флаг первичной инициализации счетов, когда необходимо передать остатки всех счетов
  await Promise.all(fetchedData.accounts.map(async account => {
    const acc = convertAccount(account, initialized)
    if (!acc || ZenMoney.isAccountSkipped(acc.id)) return
    if (_.isArray(acc)) {
      acc.forEach(function (item) {
        if (!item) return
        accounts[item.id] = item
      })
    } else { accounts[acc.id] = acc }
  }))
  if (!initialized) {
    ZenMoney.setData('initialized', true)
    ZenMoney.saveData()
  }

  // обработаем операции
  const transactions = convertTransactions(fetchedData.transactions, accounts)

  return {
    accounts: _.values(accounts),
    transactions: transactions
  }
}
