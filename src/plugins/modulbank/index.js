import { adjustTransactions } from '../../common/transactionGroupHandler'
import { AuthError, fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ fromDate }) {
  let token = ZenMoney.getData('accessToken')
  let apiAccounts = null
  if (token) {
    try {
      apiAccounts = await fetchAccounts(token)
    } catch (e) {
      if (e instanceof AuthError) {
        token = null
      } else {
        throw e
      }
    }
  }
  if (!token) {
    token = await login()
    ZenMoney.setData('accessToken', token)
    ZenMoney.saveData()
  }

  const accounts = []
  const transactions = []
  await Promise.all((apiAccounts || await fetchAccounts(token)).map(async apiAccount => {
    const account = convertAccount(apiAccount)
    if (account) {
      accounts.push(account)
      if (!ZenMoney.isAccountSkipped(account.id)) {
        const apiTransactions = await fetchTransactions(token, account, fromDate)
        for (const apiTransaction of apiTransactions) {
          const transaction = convertTransaction(apiTransaction, account)
          if (transaction) {
            transactions.push(transaction)
          }
        }
      }
    }
  }))

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
