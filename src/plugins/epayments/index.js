import * as request from './request'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const login = await request.authenthicate(preferences.login, preferences.password)
  console.log(login)

  const authInfo = {
    tokenType: login.token_type,
    token: login.access_token
  }

  const accounts = await request.fetchUserInfo(authInfo).then(response => converters.extractAccounts(response.body))
  console.log(accounts)

  const transactionsParams = {
    auth: authInfo,
    pageParams: {
      fromDate: fromDate,
      toDate: toDate
    }
  }
  const transactions = await request.fetchTransactions(transactionsParams.auth, transactionsParams.pageParams)
    .then(transactions => converters.convertTransactions(transactions))
    .then(transactions => converters.mergeTransactions(transactions))

  console.log(transactions)

  return {
    accounts: accounts,
    transactions: transactions
  }
}
