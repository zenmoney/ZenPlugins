import { adjustTransactions, mergeTransfersHandler } from '../../common/transactionGroupHandler'
import { fetchProducts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction, mergeCurrencyExchanges } from './converters'

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
  }, authState => persistSession({ authState }))
  persistSession(session)

  const plans = convertAccounts(await fetchProducts(session))
  persistSession(session)
  const accounts = plans.map(plan => plan.account)
  const transactions = []
  const apiTransactions = accounts.some(account => !ZenMoney.isAccountSkipped(account.id))
    ? await fetchTransactions(session, args.fromDate, args.toDate || new Date())
    : []
  for (const apiTransaction of apiTransactions) {
    const transaction = convertTransaction(apiTransaction, plans)
    if (transaction && transaction.movements.some(movement => movement.account.id && !ZenMoney.isAccountSkipped(movement.account.id))) {
      transactions.push(transaction)
    }
  }
  persistSession(session)

  return {
    accounts,
    transactions: adjustTransactions({ transactions, accounts, groupHandlers: [mergeCurrencyExchanges, mergeTransfersHandler] })
  }
}
