import { adjustTransactions } from '../../common/transactionGroupHandler'
import { TemporaryUnavailableError } from '../../errors'
import { fetchProducts, fetchTransactions, login, logout } from './api'
import { convertAccounts, convertTransaction } from './converters'

function getLinkedAccounts (link) {
  return Array.isArray(link.accounts) ? link.accounts : [link.account]
}

function isWithinInterval (date, fromDate, toDate) {
  return date >= fromDate && date <= toDate
}

function isTransactionForSkippedAccount (transaction) {
  const movement = transaction.movements.find(item => typeof item.account?.id === 'string')
  return movement ? ZenMoney.isAccountSkipped(movement.account.id) : false
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  ZenMoney.locale = 'uk'
  toDate = toDate || new Date()
  const lastSync = ZenMoney.getData('lastSync', null)
  if (lastSync && isInBackground && Date.now() - lastSync < 3600000) {
    throw new TemporaryUnavailableError('Синхронізацію нещодавно виконано. Спробуйте ще раз пізніше.')
  }

  const persistedState = {
    auth: ZenMoney.getData('auth', null),
    legacyDevice: ZenMoney.getData('device', null)
  }
  let session
  try {
    session = await login(preferences, isInBackground, persistedState)
    ZenMoney.setData('auth', session.authState)
    ZenMoney.saveData()

    const links = convertAccounts(await fetchProducts(session))
    const accounts = links.flatMap(getLinkedAccounts)
    const transactionBatches = await Promise.all(links.map(async link => {
      const linkedAccounts = getLinkedAccounts(link)
      if (linkedAccounts.every(account => ZenMoney.isAccountSkipped(account.id)) || link.fetchParams.sources.length === 0) {
        return []
      }
      const transactions = []
      const apiTransactions = await fetchTransactions(session, link.fetchParams, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, link)
        if (transaction &&
          !isTransactionForSkippedAccount(transaction) &&
          isWithinInterval(transaction.date, fromDate, toDate)) {
          transactions.push(transaction)
        }
      }
      return transactions
    }))

    const transactions = transactionBatches.flat()
    ZenMoney.setData('lastSync', Date.now())
    ZenMoney.saveData()
    return {
      accounts,
      transactions: adjustTransactions({ transactions, accounts })
    }
  } finally {
    try {
      await logout(session)
    } catch (error) {
      console.warn('Could not close the PUMB session after synchronization', error)
    }
  }
}
