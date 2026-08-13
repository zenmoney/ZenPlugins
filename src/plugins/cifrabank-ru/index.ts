import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchRelatedCards, fetchTransactions, generateDeviceId, login } from './api'
import { buildCardNumberMap, convertAccounts, convertOperation } from './converters'
import { Auth, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const effectiveToDate = toDate ?? new Date()

  const storedAuth = ZenMoney.getData('auth') as Auth | undefined
  const auth: Auth = {
    deviceId: storedAuth?.deviceId ?? generateDeviceId(),
    refresh: storedAuth?.refresh
  }
  const session = await login(preferences, auth)
  ZenMoney.setData('auth', { deviceId: auth.deviceId, refresh: session.refresh })
  ZenMoney.saveData()

  const [apiAccounts, apiCards] = await Promise.all([
    fetchAccounts(session, auth.deviceId),
    fetchRelatedCards(session, auth.deviceId)
  ])
  const cardNumberMap = buildCardNumberMap(apiCards)
  const convertedAccounts = convertAccounts(apiAccounts, cardNumberMap)

  const accounts: Account[] = []
  const transactions: Transaction[] = []
  await Promise.all(convertedAccounts.map(async ({ account, products }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const seenIds = new Set<string>()
    await Promise.all(products.map(async product => {
      const apiOperations = await fetchTransactions(session, auth.deviceId, product, fromDate, effectiveToDate)
      for (const apiOperation of apiOperations) {
        const transaction = convertOperation(apiOperation, account.id)
        if (transaction == null) {
          continue
        }
        const dedupKey = transaction.movements[0]?.id
        if (dedupKey != null) {
          if (seenIds.has(dedupKey)) {
            continue
          }
          seenIds.add(dedupKey)
        }
        transactions.push(transaction)
      }
    }))
  }))

  return { accounts, transactions }
}
