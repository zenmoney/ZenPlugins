import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  const auth = await login(preferences.login, preferences.password)
  const apiPortfolios = await fetchAccounts(auth)

  const accountsData = convertAccounts(apiPortfolios)
  const accounts = []
  const transactions = []
  await Promise.all(accountsData.map(async ({ mainProduct, products, zenAccount }) => {
    accounts.push(zenAccount)
    if (ZenMoney.isAccountSkipped(zenAccount.id)) {
      return
    }
    let apiTransactions = mainProduct ? await fetchTransactions(auth, mainProduct, fromDate, toDate) : null
    if (!apiTransactions) {
      await Promise.all(products.map(async product => {
        const batch = await fetchTransactions(auth, product, fromDate, toDate)
        if (batch) {
          if (apiTransactions) {
            apiTransactions.push(...batch)
          } else {
            apiTransactions = batch
          }
        }
      }))
    }
    if (apiTransactions) {
      apiTransactions.forEach(apiTransaction => {
        const transaction = convertTransaction(apiTransaction, zenAccount)
        if (transaction) {
          transactions.push(transaction)
        }
      })
    } else {
      console.log(`skipping transactions for account ${zenAccount.id}`)
    }
  }))

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: adjustTransactions({ transactions })
  }
}
