import { convertAccount, convertTransaction } from './converters'
import { fetchAccount, fetchTransactions, isAuthError, login } from './yandex'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  let apiAccount = null
  let accessToken = ZenMoney.getData('accessToken')
  if (accessToken) {
    try {
      apiAccount = await fetchAccount({ accessToken })
    } catch (e) {
      if (!isAuthError(e)) {
        throw e
      }
      console.log('invalid access token. Need to authorize')
      ZenMoney.setData('accessToken', undefined)
      ZenMoney.saveData()
      accessToken = null
    }
  }
  if (!accessToken) {
    accessToken = (await login()).accessToken
    apiAccount = await fetchAccount({ accessToken })
  }
  const account = convertAccount(apiAccount)
  const transactions = []
  for (const apiTransaction of await fetchTransactions({ accessToken }, fromDate, toDate)) {
    const transaction = convertTransaction(apiTransaction, account)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  ZenMoney.setData('accessToken', accessToken)
  return {
    accounts: [account],
    transactions
  }
}
