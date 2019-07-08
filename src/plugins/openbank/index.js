import { login, fetchAccounts, fetchTransactions } from './api'
import { convertAccount, convertTransaction } from './converters'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { filter, values, flattenDeep, isArray } from 'lodash'

export async function scrape ({ preferences, fromDate, toDate }) {
  let auth = ZenMoney.getData('auth', {})
  auth = await login(auth, preferences)

  const apiAccounts = await fetchAccounts()
  let transactions = {}
  const accounts = await Promise.all(apiAccounts.map(async apiAccount => {
    let skipReason = ''
    if (isAccountSkipped(apiAccount.account_id)) {
      skipReason = 'пропущен(а) пользователем'
    } else if (apiAccount.is_blocked === 1) {
      skipReason = 'заблокирован(а)'
    } else if (apiAccount.account_id < 2) {
      skipReason = `низкий ID (${apiAccount.account_id})`
    }
    if (skipReason) {
      console.log(`>>> Пропускаем карту/счет '${apiAccount.title || apiAccount.deposit_name}' (#${apiAccount.account_id}): ${skipReason}`)
      return null
    }

    const account = convertAccount(apiAccount)

    const apiTransactions = await fetchTransactions(account.id, fromDate)
    transactions[account.id] = await Promise.all(apiTransactions.map(async apiTransaction => {
      return convertTransaction(apiTransaction, account.id)
    }))

    return account
  }))

  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const resultAccounts = ensureSyncIDsAreUniqueButSanitized({ accounts: filter(accounts, account => account), sanitizeSyncId })
  if (!isArray(resultAccounts) || resultAccounts.length === 0) {
    throw new Error('Пустой список счетов')
  }

  return {
    accounts: resultAccounts,
    transactions: flattenDeep(values(transactions))
  }
}

function isAccountSkipped (accountId) {
  return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(accountId)
}
