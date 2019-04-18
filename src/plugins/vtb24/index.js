import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { convertAccounts, convertApiTransactionsToReadableTransactions } from './converters'
import { fetchAccounts, fetchTransactions, login } from './api'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  const auth = await login(preferences.login, preferences.password)
  const apiPortfolios = await fetchAccounts(auth)
  const apiAccounts = convertAccounts(apiPortfolios)
  const zenAccounts = []

  const apiTransactionsByAccountId = {}

  await Promise.all(apiAccounts.map(async apiAccount => {
    if (zenAccounts.indexOf(apiAccount.zenAccount) < 0) {
      zenAccounts.push(apiAccount.zenAccount)
    }
    if (ZenMoney.isAccountSkipped(apiAccount.zenAccount.id)) {
      return
    }
    try {
      apiTransactionsByAccountId[apiAccount.id] = (await fetchTransactions(auth, apiAccount, fromDate, toDate))
    } catch (e) {
      if (e && e.message && ['временно', 'Ошибка обращения'].some(errorMsgPattern => e.message.indexOf(errorMsgPattern) >= 0)) {
        if (apiAccount.cards && apiAccount.cards.length) {
          await Promise.all(apiAccount.cards.map(async apiCard => {
            try {
              apiTransactionsByAccountId[apiAccount.id] =
                (apiTransactionsByAccountId[apiAccount.id] || []).concat(await fetchTransactions(auth, apiCard, fromDate, toDate))
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
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts: zenAccounts, sanitizeSyncId }),
    transactions: convertApiTransactionsToReadableTransactions(apiTransactionsByAccountId, apiAccounts)
  }
}
