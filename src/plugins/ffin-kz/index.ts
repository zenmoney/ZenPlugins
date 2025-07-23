import { ScrapeFunc, AccountOrCard } from '../../types/zenmoney'
import { Auth, Preferences, StatementTransaction, ConvertedTransaction } from './models'
import { getMobileExchangeRates, parsePdfStatements } from './api'
import { convertPdfStatementTransaction } from './converters/transactions'
import { isEqual, omit, groupBy, toPairs } from 'lodash'
import { generateRandomString } from '../../common/utils'

export const scrape: ScrapeFunc<Preferences> = async ({ fromDate, isFirstRun }) => {
  let auth = ZenMoney.getData('auth') as Auth | undefined
  if ((auth == null) || auth.deviceId === '') {
    auth = {
      deviceId: generateRandomString(16, '0123456789abcdef')
    }
  }
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  const rawAccountsAndTransactions: null | Array<{ account: AccountOrCard, transactions: StatementTransaction[] }> = await parsePdfStatements()
  const result: {
    accounts: AccountOrCard[]
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
  return {
    accounts: result.accounts,
    transactions: sortedTransactions
  }
}
