import { uniqBy } from 'lodash'

import { Account, ScrapeFunc } from '../../types/zenmoney'
import { generateRandomString } from '../../common/utils'

import { Auth, Preferences, VakifStatementTransaction, VakifStatementAccount, TransactionWithId } from './models'
import { convertPdfStatementAccount, convertVakifPdfStatementTransaction } from './converters'
import { parsePdfVakifStatement } from './api'

export const scrape: ScrapeFunc<Preferences> = async ({ fromDate, isFirstRun }) => {
  let auth = ZenMoney.getData('auth') as Auth | undefined
  if (auth == null || auth.deviceId === '') {
    auth = {
      deviceId: generateRandomString(16, '0123456789abcdef')
    }
  }
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  const rawAccountsAndTransactions: null | Array<{ account: VakifStatementAccount, transactions: VakifStatementTransaction[] }> = await parsePdfVakifStatement()

  const transactions: TransactionWithId[] = []
  const accounts: Account[] = []

  if (rawAccountsAndTransactions !== null) {
    for (const { account: rawAccount, transactions: rawTransactions } of rawAccountsAndTransactions) {
      const account = convertPdfStatementAccount(rawAccount)
      const currentTransactions = convertVakifPdfStatementTransaction(rawAccount.id, rawTransactions).filter(x => x.transaction.date.getTime() - fromDate.getTime() >= 0)
      accounts.push(account)
      transactions.push(...currentTransactions)
    }
  }
  return {
    accounts,
    transactions: isFirstRun ? [] : uniqBy(transactions, x => x.statementUid).map(x => x.transaction)
  }
}
