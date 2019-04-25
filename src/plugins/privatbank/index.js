import { convertAccountMapToArray, convertAccountSyncID } from '../../common/accounts'
import { RetryError } from '../../common/retry'
import { combineIntoTransferByTransferId, convertTransactionAccounts } from '../../common/transactions'
import { convertAccounts, convertTransactions } from './converters'
import { PrivatBank } from './privatbank'
import * as config from './config'

function adjustAccounts (accounts) {
  return convertAccountSyncID(convertAccountMapToArray(accounts))
}

function adjustTransactions (transactions, accounts) {
  return combineIntoTransferByTransferId(convertTransactionAccounts(transactions, accounts))
}

export async function scrape ({ preferences, fromDate, toDate, isFirstRun }) {
  const merchants = preferences.merchantId.split(/\s+/)
  const passwords = preferences.password.split(/\s+/)
  if (merchants.length !== passwords.length) {
    throw new InvalidPreferencesError('Количество паролей, разделенных через пробел, в настройках подключения должно быть равно количеству мерчантов, разделенных через пробел')
  }
  if (!config[preferences.proxy]) {
    throw new InvalidPreferencesError('Укажите новый IP-адрес в настройках мерчанта в Приват24. Новый IP вы можете посмотреть в настройках синхронизации с Приватбанком в Дзен-мани.')
  }

  const accounts = {}
  let transactions = []
  await Promise.all(merchants.map(async (merchant, i) => {
    const bank = new PrivatBank({
      merchant: merchant,
      password: passwords[i],
      baseUrl: config[preferences.proxy]
    })
    let apiTransactions
    try {
      apiTransactions = await bank.fetchTransactions(fromDate, toDate)
    } catch (e) {
      if (e instanceof RetryError) {
        throw new TemporaryError('Информация из ПриватБанка временно недоступна. Запустите синхронизацию через некоторое время.\n\nЕсли ситуация повторится, выберите другой IP-адрес в настройках синхронизации с банком.')
        // if (isFirstRun) {
        //   throw new TemporaryError('Информация из ПриватБанка временно недоступна. Запустите синхронизацию через некоторое время.\n\nЕсли ситуация повторится, выберите другой IP-адрес в настройках синхронизации с банком.')
        // } else {
        //   apiTransactions = null
        // }
      } else {
        throw e
      }
    }
    let apiAccounts
    try {
      apiAccounts = await bank.fetchAccounts()
    } catch (e) {
      if (e instanceof RetryError) {
        throw new TemporaryError('Информация из ПриватБанка временно недоступна. Запустите синхронизацию через некоторое время.\n\nЕсли ситуация повторится, выберите другой IP-адрес в настройках синхронизации с банком.')
      } else {
        throw e
      }
    }
    const account = convertAccounts(apiAccounts, !apiTransactions)
    if (apiTransactions) {
      transactions = transactions.concat(convertTransactions(apiTransactions, account))
    }
    Object.assign(accounts, account)
  }))
  return {
    accounts: adjustAccounts(accounts),
    transactions: adjustTransactions(transactions, accounts)
  }
}
