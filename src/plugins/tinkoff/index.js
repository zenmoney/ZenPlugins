import * as Tinkoff from './api'
import { convertAccount, convertTransactions, getDoubledHoldTransactionsId } from './converters'
import { isArray, values } from 'lodash'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  const pinHash = ZenMoney.getData('pinHash', null)
  const auth = await Tinkoff.login(preferences, isInBackground, { pinHash: pinHash })
  const fetchedData = await Tinkoff.fetchAccountsAndTransactions(auth, fromDate, toDate)

  // обработаем счета
  const accounts = []
  const initialized = ZenMoney.getData('initialized', false) // флаг первичной инициализации счетов, когда необходимо передать остатки всех счетов
  await Promise.all(fetchedData.accounts.map(async account => {
    const acc = convertAccount(account, initialized)
    if (!acc || ZenMoney.isAccountSkipped(acc.id)) return
    if (isArray(acc)) {
      acc.forEach(function (item) {
        if (!item) return
        accounts.push(item)
      })
    } else { accounts.push(acc) }
  }))
  if (!initialized) {
    ZenMoney.setData('initialized', true)
    ZenMoney.saveData()
  }

  // проверка на ошибочные дубли холдов (bp-за проблем с дублями в выписке банка)
  const doubledHoldTransactionsId = getDoubledHoldTransactionsId(fetchedData.transactions)

  // обработаем операции
  const transactions = convertTransactions(fetchedData.transactions, accounts, doubledHoldTransactionsId)

  return {
    accounts: accounts,
    transactions: values(transactions)
  }
}
