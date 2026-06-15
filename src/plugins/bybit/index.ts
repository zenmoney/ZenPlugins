import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import {
  fetchAccounts,
  fetchAuthorizationTransactions,
  fetchConvertCoinUsdtValues,
  fetchFinancialTransactions,
  login
} from './api'
import {
  createAggregatedAccount,
  convertTransaction,
  selectCardTransactionsForImport
} from './converters'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const auth = await login(preferences)

  const balances = await fetchAccounts(auth.credentials)
  const convertUsdtValues = await fetchConvertCoinUsdtValues(auth.credentials)

  const aggregateAccount = createAggregatedAccount(balances, auth.cardBalanceCoins, convertUsdtValues)
  if (ZenMoney.isAccountSkipped(aggregateAccount.id)) {
    return { accounts: [aggregateAccount], transactions: [] }
  }

  const endDate = toDate ?? new Date()
  const financialEntries = await fetchFinancialTransactions(auth.credentials, fromDate, endDate)
  const authorizationEntries = await fetchAuthorizationTransactions(auth.credentials, fromDate, endDate)
  const entries = selectCardTransactionsForImport(financialEntries, authorizationEntries)
  const transactions: Transaction[] = []
  for (const entry of entries) {
    const transaction = convertTransaction(entry, aggregateAccount)
    if (transaction != null) {
      transactions.push(transaction)
    }
  }

  return { accounts: [aggregateAccount], transactions }
}
