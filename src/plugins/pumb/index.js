import { adjustTransactions } from '../../common/transactionGroupHandler'
import { TemporaryUnavailableError } from '../../errors'
import { fetchProducts, fetchTransactions, login, logout } from './api'
import { convertAccount, convertDeposit, convertLoan, convertTransaction } from './converters'

function getLinkedAccounts (link) {
  return Array.isArray(link.accounts) ? link.accounts : [link.account]
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  toDate = toDate || new Date()
  const lastSync = ZenMoney.getData('lastSync')
  if (lastSync && isInBackground && Date.now() - lastSync < 3600000) {
    throw new TemporaryUnavailableError('Last sync was less than an hour ago')
  }

  let session
  try {
    session = await login(preferences, isInBackground)
    const apiProducts = await fetchProducts(session)
    const links = [
      ...apiProducts.accounts.map(convertAccount),
      ...apiProducts.deposits.map(deposit => convertDeposit(deposit, toDate)),
      ...apiProducts.loans.map(convertLoan).filter(Boolean)
    ]
    const accounts = links.flatMap(getLinkedAccounts)
    const transactionBatches = await Promise.all(links.map(async link => {
      const linkedAccounts = getLinkedAccounts(link)
      if (link.product.type !== 'account' || linkedAccounts.every(account => ZenMoney.isAccountSkipped(account.id))) {
        return []
      }
      const transactions = []
      for (const apiTransaction of await fetchTransactions(session, link.product, fromDate, toDate)) {
        const transaction = convertTransaction(
          apiTransaction,
          Array.isArray(link.accounts) ? linkedAccounts : linkedAccounts[0]
        )
        if (transaction) {
          transactions.push(transaction)
        }
      }
      return transactions
    }))
    const transactions = transactionBatches.flat()

    ZenMoney.setData('lastSync', Date.now())
    ZenMoney.saveData()
    return {
      accounts,
      transactions: adjustTransactions({ transactions, accounts })
    }
  } finally {
    await logout(session)
  }
}
