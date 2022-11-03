// import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchLogin, fetchAccounts, fetchTransactions } from './api'
import { convertTransaction, convertAccount } from './converters'
// import { fetchLogin } from './api'

export const scrape = async ({ preferences, fromDate, toDate }) => {
  if (!toDate) {
    toDate = new Date()
  }

  const transactionType = ''

  let auth = ZenMoney.getData('auth')

  if (!auth) {
    auth = await fetchLogin(preferences)
    ZenMoney.setData('auth', auth)
    ZenMoney.saveData()
  } else if (auth.Cookie) {
    const accounts = ZenMoney.getData('accounts')
    const response = await fetchTransactions(auth, accounts[0], fromDate, toDate, transactionType)
    if (await response.status !== 401) {
      auth = await fetchLogin(preferences)
      ZenMoney.setData('auth', auth)
      ZenMoney.saveData()
    }
  }

  const accounts = []
  const transactions = []

  await Promise.all((await fetchAccounts(auth)).map(async account => {
    accounts.push(convertAccount(account))
    if (ZenMoney.isAccountSkipped(account)) {
      return
    }
    await Promise.all(async account => {
      const transactionsResponse = await fetchTransactions(auth, account, fromDate, toDate, transactionType)
      let obj = JSON.parse(await transactionsResponse.body)
      for (const transaction of obj.transactions) {
        transactions.push(convertTransaction(transaction, account))
      }
      const transactionsCount = obj.remnantCount
      let lastTransactionId = obj.transactions[obj.transactions.length - 1].tranId
      if (transactionsCount >= 20) {
        for (let i = 0; i < transactionsCount; i += 20) {
          const transactionsResponse = await fetchTransactions(auth, account, fromDate, toDate, transactionType, lastTransactionId)
          obj = JSON.parse(await transactionsResponse.body)
          for (const transaction of obj.transactions) {
            transactions.push(convertTransaction(transaction, account))
          }
          lastTransactionId = obj.transactions[obj.transactions.length - 1].tranId
        }
      }
    })
  }))
  return {
    accounts,
    transactions
  }
}
