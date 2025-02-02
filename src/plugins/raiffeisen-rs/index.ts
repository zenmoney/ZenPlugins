import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAllAccounts, fetchAccountTransactions, fetchAuthorization, fetchTransactionsInProgress } from './fetchApi'
import { convertAccounts, convertTransactionInProgress, convertTransactions } from './converters'
import { Auth, GetAccountTransactionsResponse, Preferences, RaiffAccount } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const auth: Auth = await fetchAuthorization(preferences)

  const fetchedAccounts = await fetchAllAccounts(auth)
  const accounts: RaiffAccount[] = convertAccounts(fetchedAccounts)
  const transactions: Transaction[] = []

  const uniqueAccountIds = fetchedAccounts
    .map(account => account.AccountNumber)
    .filter((value, index, array) => array.indexOf(value) === index)

  const apiTransactions: GetAccountTransactionsResponse[] = []
  for (const accountNumber of uniqueAccountIds) {
    if (accounts.some(account => account.id.startsWith(accountNumber) && ZenMoney.isAccountSkipped(account.id))) {
      continue
    }

    const productCoreID = accounts.filter(account => account.id.startsWith(accountNumber))[0].ProductCodeCore
    apiTransactions.push(...await fetchAccountTransactions(accountNumber, productCoreID, auth, fromDate, toDate))

    const transactionsInProgress = await fetchTransactionsInProgress(accountNumber, auth)
    for (const transaction of transactionsInProgress) {
      transactions.push(convertTransactionInProgress(transaction, accountNumber))
    }
  }

  transactions.push(...convertTransactions(apiTransactions))

  return {
    accounts,
    transactions
  }
}
