import { Account, ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { convertAccounts, convertTransaction, deduplicateTransactions } from './converters'
import { Auth, Preferences } from './models'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { coldAuth, fetchAccounts, fetchTransactions, hotAuth } from './api'
import { SessionExpiredError } from './fetchApi'
import { getOptString } from '../../types/get'

export function getStoredAuth (): Auth | undefined {
  const auth = ZenMoney.getData('auth')
  if (['imei', 'deviceId', 'authToken', 'sessionKey']
    .every(key => (getOptString(auth, key)?.length ?? 0) > 0)) {
    return auth as Auth
  }

  const hasLegacyData = ['sessionKey', 'deviceId', 'deviceRegisterDateTime']
    .some(key => ZenMoney.getData(key) != null)
  if (auth != null || hasLegacyData) {
    ZenMoney.clearData()
    ZenMoney.saveData()
  }
  return undefined
}

async function authenticate (preferences: Preferences, auth: Auth | undefined): Promise<Auth> {
  if (auth === undefined) {
    return await coldAuth(preferences)
  }
  try {
    return await hotAuth(preferences, auth)
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      return await coldAuth(preferences)
    }
    throw error
  }
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const auth = await authenticate(preferences, getStoredAuth())
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accounts: Account[] = []
  const transactions: ExtendedTransaction[] = []
  await Promise.all(convertAccounts(await fetchAccounts(auth)).map(async ({ account, products }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    await Promise.all(products.map(async product => {
      const apiTransactions = await fetchTransactions(product, fromDate, toDate ?? new Date(), auth)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction !== undefined) {
          transactions.push(transaction)
        }
      }
    }))
  }))
  return {
    accounts,
    transactions: adjustTransactions({ transactions: deduplicateTransactions(transactions) })
  }
}
