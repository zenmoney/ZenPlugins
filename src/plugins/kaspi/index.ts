import { ScrapeFunc } from '../../types/zenmoney'
import { Auth, Preferences, StatementTransaction, StatementAccount, ConvertedTransaction, ConvertedAccount } from './models'
import { parsePdfStatements } from './api'
import { convertPdfStatementAccount } from './converters/accounts'
import { convertPdfStatementTransaction } from './converters/transactions'
import { isEqual, omit, uniqBy, groupBy, toPairs } from 'lodash'
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
  const rawAccountsAndTransactions: null | Array<{ account: StatementAccount, transactions: StatementTransaction[] }> = await parsePdfStatements()
  const result: {
    accounts: ConvertedAccount[]
    transactions: ConvertedTransaction[]
  } = {
    accounts: [],
    transactions: []
  }
  if (rawAccountsAndTransactions !== null) {
    for (const { account: rawAccount, transactions: rawTransactions } of rawAccountsAndTransactions) {
      const account = convertPdfStatementAccount(rawAccount)
      const initialValue: ConvertedTransaction[] = []
      const transactions = rawTransactions.reduce((convertedTransactions, item) => {
        const transaction = convertPdfStatementTransaction(item, account)
        if (!isFirstRun || (transaction.transaction.date.getTime() - fromDate.getTime() >= 0)) {
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
    accounts: uniqBy(
      result.accounts
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(({ account }) => account),
      'id'
    ),
    transactions: sortedTransactions
  }
}
