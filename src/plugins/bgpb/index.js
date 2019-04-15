import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await bank.login(preferences.login, preferences.password)

  const accounts = (await bank.fetchAccounts(token))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  if (accounts.length === 0) {
    throw new Error('Не удалось загрузить счета')
  }
  for (let i = 0; i < accounts.length; i++) {
    accounts[i].balance = await bank.fetchBalance(token, accounts[i])
    let accIDs = await bank.fetchTransactionsAccId(token, accounts[i])
    accounts[i].transactionsAccId = accIDs.transactionsAccId
  }

  const transactionsStatement = (await bank.fetchFullTransactions(token, accounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
  const transactionsLast = (await bank.fetchLastTransactions(token, accounts))
    .map(transaction => converters.convertLastTransaction(transaction, accounts))
    .filter(function (op) {
      if (op === null) {
        // удаляем лишние уведомления
        return false
      } else if (op.movements[0].invoice !== null && isNaN(op.movements[0].invoice.sum)) {
        // удаляем все операции, что были сделаны в отличной от счета валюте, пока не понятно как узнать реальное списание
        return false
      }
      return true
    })
  const transactions = converters.transactionsUnique(transactionsStatement.concat(transactionsLast))
    .filter(transaction => transaction.movements[0].sum !== 0)
  return {
    accounts: accounts,
    transactions: transactions
  }
}
