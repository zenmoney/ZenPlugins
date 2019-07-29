import { login, fetchAccountsAndTransactions } from './api'
import { convertAccount, convertTransactions } from './converters'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { isArray, values } from 'lodash'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  const pinHash = ZenMoney.getData('pinHash', null)
  const auth = await login(preferences, isInBackground, { pinHash: pinHash })
  const fetchedData = await fetchAccountsAndTransactions(auth, fromDate, toDate)

  // обработаем счета
  const accounts = {}
  const initialized = ZenMoney.getData('initialized', false) // флаг первичной инициализации счетов, когда необходимо передать остатки всех счетов
  let skippedAccounts = 0
  await Promise.all(fetchedData.accounts.map(async account => {
    const acc = convertAccount(account, initialized)
    if (!acc) return
    if (ZenMoney.isAccountSkipped(acc.id)) {
      skippedAccounts++
      console.log(`>>> Счёт #${acc.id} '${acc.title}' пропущен пользователем`)
      return
    }

    if (isArray(acc)) {
      acc.forEach(function (item) {
        if (!item) return
        accounts[item.id] = item
      })
    } else { accounts[acc.id] = acc }
  }))
  if (!initialized) {
    ZenMoney.setData('initialized', true)
    ZenMoney.saveData()
  }

  const resultTransactions = convertTransactions(fetchedData.transactions, accounts)
  const resultAccounts = ensureSyncIDsAreUniqueButSanitized({ accounts: values(accounts), sanitizeSyncId })

  if (!isArray(resultAccounts) || resultAccounts.length === 0) {
    if (skippedAccounts > 0) {
      throw new TemporaryError('Кажется, вы пропустили все счета. Нечего загружать. Попробуйте снова.')
    }
    throw new Error('Пустой список счетов')
  }

  return {
    accounts: resultAccounts,
    transactions: resultTransactions
  }
}
