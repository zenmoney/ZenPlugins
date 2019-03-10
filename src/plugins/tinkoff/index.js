import * as Tinkoff from './api'
import { convertAccount, convertTransaction, convertTransactionToTransfer } from './converters'
import _ from 'lodash'

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
    if (_.isArray(acc)) {
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
  await Promise.all(fetchedData.transactions.map(async t => {
    // работаем только по активным счетам
    let tAccount = t.account
    if (!inAccounts(tAccount, accounts)) {
      tAccount = t.account + '_' + t.amount.currency.name
      if (!inAccounts(tAccount, accounts)) return
    }

    // учитываем только успешные операции
    if ((t.status && t.status === 'FAILED') || t.accountAmount.value === 0) { return }

    const cardId = t.cardNumber.substr(t.cardNumber.length - 4)
    const tran = convertTransaction(t, tAccount)

    // При необходимости добавляем номер карты в комментарий к операции
    if (preferences.cardIdInComment) {
      if (tran.comment) tran.comment = '*' + cardId + ' ' + tran.comment
      else tran.comment = '*' + cardId
    }
    // Внутренний ID операции
    const tranId = t.payment && t.payment.paymentId
    // если есть paymentId, объединяем по нему, отделяя комиссии от переводов
      ? (t.group === 'CHARGE' ? 'f' : 'p') + t.payment.paymentId
    // либо работаем просто как с операциями, разделяя их на доходы и расходы
      : t.id

    if (transactions[tranId]) {
      // обработаем переводы
      convertTransactionToTransfer(tranId, transactions[tranId], tran)
    } else { transactions[tranId] = tran }
  }))

  return {
    accounts: accounts,
    transactions: _.values(transactions)
  }
}

function inAccounts (id, accounts) {
  const length = accounts.length
  for (let i = 0; i < length; i++) { if (accounts[i].id === id) return true }
  return false
}
