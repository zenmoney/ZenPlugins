import { ScrapeFunc } from '../../types/zenmoney'
import { Auth, Preferences, ConvertedTransaction, ConvertedAccount } from './models'
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

  const parsed = await parsePdfStatements()
  if (parsed == null) {
    return { accounts: [], transactions: [] }
  }

  const { accounts: rawAccounts, transactions: rawTransactions, statementDate } = parsed

  const convertedAccounts: ConvertedAccount[] = rawAccounts.map(
    rawAccount => convertPdfStatementAccount(rawAccount, statementDate)
  )

  const initialValue: ConvertedTransaction[] = []
  const convertedTransactions = rawTransactions.reduce((acc, rawTx) => {
    const converted = convertPdfStatementTransaction(rawTx, convertedAccounts)
    if (converted != null && (!isFirstRun || (converted.transaction.date.getTime() - fromDate.getTime() >= 0))) {
      const isDuplicate = acc.find((item) => {
        const omitPaths = ['transaction.merchant', 'transaction.comment', 'statementUid']
        return isEqual(omit(item, omitPaths), omit(converted, omitPaths)) && converted.statementUid !== item.statementUid
      }) != null
      if (!isDuplicate) {
        acc.push(converted)
      }
    }
    return acc
  }, initialValue)

  const groupedTransactions = toPairs(groupBy(convertedTransactions.map(({ transaction }) => transaction), 'date'))
    .sort((a, b) => a[0] > b[0] ? -1 : 1)
  const sortedTransactions = []
  for (const pair of groupedTransactions) {
    sortedTransactions.push(...pair[1].reverse())
  }

  return {
    accounts: uniqBy(
      convertedAccounts
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(({ account }) => account),
      'id'
    ),
    transactions: sortedTransactions
  }
}
