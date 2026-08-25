import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchProducts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

function persistSession (session) {
  ZenMoney.setData('auth', session.authState)
  ZenMoney.setData('device', session.authState.device)
  ZenMoney.saveData()
}

export async function scrape (args) {
  ZenMoney.locale = 'uk'
  const session = await login(args.preferences, args.isInBackground, {
    auth: ZenMoney.getData('auth'),
    device: ZenMoney.getData('device')
  })
  persistSession(session)

  const plans = convertAccounts(await fetchProducts(session))
  persistSession(session)
  const accounts = plans.map(plan => plan.account)
  const transactions = []
  for (const apiTransaction of await fetchTransactions(session, args.fromDate, args.toDate || new Date())) {
    const transaction = convertTransaction(apiTransaction, plans)
    if (transaction && !ZenMoney.isAccountSkipped(transaction.movements[0].account.id)) {
      transactions.push(transaction)
    }
  }
  persistSession(session)

  return {
    accounts,
    transactions: adjustTransactions({ transactions, accounts })
  }
}
