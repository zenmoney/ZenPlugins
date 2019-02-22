import * as _ from 'lodash'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { combineIntoTransferByTransferId } from '../../common/transactions'
import { convertAccounts, convertTransaction } from './converters'
import { fetchAccounts, fetchTransactions, login } from './vtb'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  const auth = await login(preferences.login, preferences.password)
  const apiAccounts = convertAccounts(await fetchAccounts(auth))
  const zenAccounts = []
  const transactions = []
  await Promise.all(apiAccounts.map(async apiAccount => {
    if (zenAccounts.indexOf(apiAccount.zenAccount) < 0) {
      zenAccounts.push(apiAccount.zenAccount)
    }
    if (ZenMoney.isAccountSkipped(apiAccount.zenAccount.id)) {
      return
    }
    try {
      (await fetchTransactions(auth, apiAccount, fromDate, toDate)).forEach(apiTransaction => {
        const transaction = convertTransaction(apiTransaction, apiAccount)
        if (transaction) {
          transactions.push(transaction)
        }
      })
    } catch (e) {
      if (e && e.message && e.message.indexOf('временно') >= 0) {
        if (apiAccount.cards && apiAccount.cards.length) {
          await Promise.all(apiAccount.cards.map(async apiCard => {
            try {
              (await fetchTransactions(auth, apiCard, fromDate, toDate)).forEach(apiTransaction => {
                const transaction = convertTransaction(apiTransaction, apiAccount)
                if (transaction) {
                  transactions.push(transaction)
                }
              })
            } catch (e) {
              if (e && e.message && e.message.indexOf('временно') >= 0) {
                console.log(`skipping transactions for account ${apiAccount.id} card ${apiCard.id}`)
              } else {
                throw e
              }
            }
          }))
        } else {
          console.log(`skipping transactions for account ${apiAccount.id}`)
        }
      } else {
        throw e
      }
    }
  }))

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({
      accounts: zenAccounts,
      sanitizeSyncId
    }),
    transactions: _.sortBy(combineIntoTransferByTransferId(transactions), zenTransaction => zenTransaction.date)
  }
}
