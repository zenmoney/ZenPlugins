import * as Tinkoff from './api'
import { convertAccount, convertTransaction, doubleTransactionsParsing, transactionCompare } from './converters'
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

  // обработаем операции
  const transactions = {}
  await Promise.all(fetchedData.transactions.map(async apiTransaction => {
    // работаем только по активным счетам
    let accountId = apiTransaction.account
    if (!inAccounts(accountId, accounts)) {
      accountId = apiTransaction.account + '_' + apiTransaction.amount.currency.name
      if (!inAccounts(accountId, accounts)) return
    }

    // учитываем только успешные операции
    if ((apiTransaction.status && apiTransaction.status === 'FAILED') || apiTransaction.accountAmount.value === 0) { return }

    transactionParsing(transactions, apiTransaction, accountId)
  }))

  return {
    accounts: accounts,
    transactions: values(transactions)
  }
}

function inAccounts (id, accounts) {
  const length = accounts.length
  for (let i = 0; i < length; i++) { if (accounts[i].id === id) return true }
  return false
}

export function transactionParsing (transactions, apiTransaction, accountId) {
  const tran = convertTransaction(apiTransaction, accountId)

  // Внутренний ID операции
  let tranId = apiTransaction.payment && apiTransaction.payment.paymentId
    // если есть paymentId, объединяем по нему, отделяя комиссии от переводов
    ? (apiTransaction.group === 'CHARGE' ? 'f' : 'p') + apiTransaction.payment.paymentId
    // либо работаем просто как с операциями, разделяя их на доходы и расходы
    : apiTransaction.id

  // проверяем на дубли операции
  for (var id in transactions) {
    if (transactionCompare(transactions[id], tran)) {
      tranId = id
    }
  }

  if (transactions[tranId]) {
    // обработаем дублирующую операцию
    doubleTransactionsParsing(tranId, transactions[tranId], tran)
  } else {
    transactions[tranId] = tran
  }

  return transactions
}
