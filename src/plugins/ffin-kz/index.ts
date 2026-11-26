import { ScrapeFunc, Account, AccountType } from '../../types/zenmoney'
import { Auth, Preferences, StatementTransaction, ConvertedTransaction } from './models'
import { getMobileExchangeRates, parsePdfStatements } from './api'
import { convertPdfStatementTransaction } from './converters/transactions'
import { isEqual, omit, groupBy, toPairs } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { mergeCounterparts, mergeSinglesIntoSelfTransfers, dedupeSinglesAgainstTransfers, dropPlaceholderTransfers, dropOffsettingSinglesSameAccount } from './transferCleanup'
import { cashbackMonth, configureCashbacks, readCashbackSettings } from './cashback-api'
import { convertCashbacks } from './converters/cashbacks'

export const scrape: ScrapeFunc<Preferences> = async ({ fromDate, isFirstRun, preferences, isInBackground }) => {
  ZenMoney.locale = 'ru'
  let auth = ZenMoney.getData('auth') as Auth | undefined
  if ((auth == null) || auth.deviceId === '') {
    auth = {
      deviceId: generateRandomString(16, '0123456789abcdef')
    }
  }
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  const rawAccountsAndTransactions: null | Array<{ account: Account, transactions: StatementTransaction[] }> = await parsePdfStatements()
  const result: {
    accounts: Account[]
    transactions: ConvertedTransaction[]
  } = {
    accounts: [],
    transactions: []
  }
  const currencyRates = await getMobileExchangeRates()
  if (Object.keys(currencyRates).length === 0) {
    console.warn('Не удалось получить курсы валют, проверьте подключение к интернету')
  }
  if (rawAccountsAndTransactions !== null) {
    for (const { account, transactions: rawTransactions } of rawAccountsAndTransactions) {
      const initialValue: ConvertedTransaction[] = []
      const transactions = rawTransactions.reduce((convertedTransactions, item) => {
        const transaction = convertPdfStatementTransaction(item, account, currencyRates)
        if ((transaction != null) && (!isFirstRun || (transaction.transaction.date.getTime() - fromDate.getTime() >= 0))) {
          convertedTransactions.push(transaction)
        }
        return convertedTransactions
      }, initialValue)
      result.accounts.push(account)
      if (result.transactions.length === 0) {
        result.transactions = result.transactions.concat(transactions)
      } else {
        for (const transaction of transactions) {
          if (result.transactions.find((item) => {
            const omitPaths = ['transaction.merchant', 'transaction.comment', 'statementUid']
            return isEqual(omit(item, omitPaths), omit(transaction, omitPaths)) && transaction.statementUid !== item.statementUid
          }) == null) {
            result.transactions.push(transaction)
          }
        }
      }
    }
  }
  const groupedTransactions = toPairs(groupBy(result.transactions.map(({ transaction }) => transaction), 'date'))
    .sort((a, b) => a[0] > b[0] ? -1 : 1)
  const sortedTransactions = []
  for (const pair of groupedTransactions) {
    sortedTransactions.push(...pair[1].reverse())
  }

  const mergedTransfers = mergeCounterparts(sortedTransactions)
  const mergedWithSingles = mergeSinglesIntoSelfTransfers(mergedTransfers)
  const deduped = dedupeSinglesAgainstTransfers(mergedWithSingles)
  const withoutPlaceholders = dropPlaceholderTransfers(deduped)
  const cleaned = dropOffsettingSinglesSameAccount(withoutPlaceholders)

  let cashbacks
  if (preferences.shouldScrapeCashbacks !== false && result.accounts.some(account => account.type === AccountType.ccard)) {
    const month = cashbackMonth(new Date())
    const saved = preferences.reconfigureCashbacks === true ? null : readCashbackSettings(ZenMoney.getData('cashbackSettings'))
    const settings = saved?.month === month
      ? saved
      : await configureCashbacks(month, isInBackground)
    cashbacks = convertCashbacks(result.accounts, settings)
    ZenMoney.setData('cashbackSettings', settings)
    ZenMoney.saveData()
  }
  return {
    accounts: result.accounts,
    transactions: cleaned,
    ...(cashbacks === undefined ? {} : { cashbacks })
  }
}
