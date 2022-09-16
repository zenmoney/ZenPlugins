import { adjustTransactions } from '../../common/transactionGroupHandler'
import { concat } from 'lodash'
import { fetchAccounts, fetchBalance, fetchTransactions, login } from './api'
import { convertAccount, convertTransactionNew } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (!toDate) {
    toDate = new Date()
  }

  const auth = await login(ZenMoney.getData('auth'), preferences)
  console.assert(auth.accessToken, 'incorrect access token')

  const accounts = []
  let transactions = []

  const fetchedAccounts = await fetchAccounts(auth)

  await Promise.all(fetchedAccounts.map(async (apiAccount) => {
    const balances = await fetchBalance(auth, apiAccount.accountId)
    const account = convertAccount(apiAccount, balances)
    if (!ZenMoney.isAccountSkipped(account.id)) {
      accounts.push(account)

      const apiTransactions = await fetchTransactions(auth, apiAccount, fromDate, toDate)
      const trans = apiTransactions.map(apiTransaction => convertTransactionNew(apiTransaction, account)).filter(transaction => transaction)
      transactions = concat(transactions, trans)
    }
  }))

  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
