import { uniqBy } from 'lodash'

import { Account, ScrapeFunc } from '../../types/zenmoney'
import { generateRandomString } from '../../common/utils'

import { Auth, Preferences, VakifStatementTransaction, VakifStatementAccount, TransactionWithId } from './models'
import { convertPdfStatementAccount, convertVakifPdfStatementTransaction } from './converters'
import { parsePdfVakifStatement } from './api'

export const scrape: ScrapeFunc<Preferences> = async ({ fromDate, isFirstRun }) => {
  console.log(fromDate)
  let auth = ZenMoney.getData('auth') as Auth | undefined
  if (auth == null || auth.deviceId === '') {
    auth = {
      deviceId: generateRandomString(16, '0123456789abcdef')
    }
  }
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  const rawAccountsAndTransactions: null | Array<{ account: VakifStatementAccount, transactions: VakifStatementTransaction[] }> = await parsePdfVakifStatement()
  console.log(`Parsed ${rawAccountsAndTransactions ? rawAccountsAndTransactions.length : 0} statements from PDF`)

  const transactions: TransactionWithId[] = []
  const accounts: Account[] = []

  if (rawAccountsAndTransactions !== null) {
    for (const [index, { account: rawAccount, transactions: rawTransactions }] of rawAccountsAndTransactions.entries()) {
      console.log(`Processing account ${index + 1}: ID ${rawAccount.id}`)

      const account = convertPdfStatementAccount(rawAccount)
      console.log('Converted account:', account)

      const currentTransactions = convertVakifPdfStatementTransaction(rawAccount.id, rawTransactions).filter(x => x.transaction.date.getTime() - fromDate.getTime() >= 0)

      console.log(`Converted to ${currentTransactions.length} transactions`)

      accounts.push(account)
      transactions.push(...currentTransactions)
    }
  }
  return {
    accounts,
    transactions: isFirstRun ? [] : uniqBy(transactions, x => x.statementUid).map(x => x.transaction)
  }
}
