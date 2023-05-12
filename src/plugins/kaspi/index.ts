import { ScrapeFunc } from '../../types/zenmoney'
import { Auth, Preferences, StatementTransaction, StatementAccount, ConvertedTransaction, ConvertedAccount } from './models'
import { parsePdfStatements } from './api'
import { convertPdfStatementAccount } from './converters/accounts'
import { convertPdfStatementTransaction } from './converters/transactions'
import { isEqual, omit, uniqBy } from 'lodash'
import { generateRandomString } from '../../common/utils'

export const scrape: ScrapeFunc<Preferences> = async () => {
  let auth = ZenMoney.getData('auth') as Auth | undefined
  if (!auth || auth.deviceId === '') {
    auth = {
      deviceId: generateRandomString(16, '0123456789abcdef')
    }
  }
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  const rawAccountsAndTransactions: null | Array<{ account: StatementAccount, transactions: StatementTransaction[] }> = await parsePdfStatements(auth)
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
      const transactions = rawTransactions.map(transaction => convertPdfStatementTransaction(transaction, account))
      result.accounts.push(account)
      if (result.transactions.length === 0) {
        result.transactions = result.transactions.concat(transactions)
      } else {
        for (const transaction of transactions) {
          if (!result.transactions.find((item) => {
            const omitPaths = ['transaction.merchant', 'transaction.comment', 'statementUid']
            return isEqual(omit(item, omitPaths), omit(transaction, omitPaths)) && transaction.statementUid !== item.statementUid
          })) {
            result.transactions.push(transaction)
          }
        }
      }
    }
  }
  return {
    accounts: uniqBy(
      result.accounts
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(({ account }) => account),
      'id'
    ),
    transactions: result.transactions.map(({ transaction }) => transaction)
  }
}
