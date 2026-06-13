import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login } from './api'
import { fetchJson } from '../../common/network'
import { buildCardNumberMap, convertAccounts, convertOperation } from './converters'
import { Auth, Preferences } from './models'

const CARDS_URL = 'https://mo.ffinpay.ru/ncs-mobile/rest/v1/cards/related'

async function fetchCards (token: string): Promise<unknown[]> {
  const response = await fetchJson(CARDS_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'okhttp/5.3.2',
      Authorization: `Bearer ${token}`
    }
  })
  if (response.status !== 200) {
    return []
  }
  return Array.isArray(response.body) ? response.body : []
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const effectiveToDate = toDate ?? new Date()

  const storedAuth = ZenMoney.getData('auth') as Auth | undefined
  const session = await login(preferences, storedAuth)
  ZenMoney.setData('auth', { refresh: session.refresh })
  ZenMoney.saveData()

  const [apiAccounts, apiCards] = await Promise.all([
    fetchAccounts(session),
    fetchCards(session.token)
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
      const apiOperations = await fetchTransactions(session, product, fromDate, effectiveToDate)
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
