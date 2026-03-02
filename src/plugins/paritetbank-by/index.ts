import { authenticate, getAccounts, getTransactions } from './api'
import type { ScrapeFunc } from '../../types/zenmoney'
import type { PreferenceInput } from './types/base'
import { generateUUID } from '../../common/utils'
import { isNonEmptyString } from './helpers'

export const scrape: ScrapeFunc<PreferenceInput> = async ({ preferences, fromDate, toDate }) => {
  // console.log('SCRAPE', preferences, fromDate, toDate)
  const { login, password } = preferences

  const pluginData = {
    deviceId: ZenMoney.getData('deviceId') as string | undefined
  }

  if (!isNonEmptyString(pluginData.deviceId)) {
    pluginData.deviceId = generateUUID()
    ZenMoney.setData('deviceId', pluginData.deviceId)
    ZenMoney.saveData()
  }

  const { sessionToken } = await authenticate(login, password, pluginData.deviceId)

  // console.log('SUCCESSFUL LOGIN', sessionToken)

  const accounts = await getAccounts({ sessionToken })

  // console.log('SUCCESSFUL ACCOUNTS FETCH', accounts)

  const transactions = []

  // No Promise.all([...]) because bank may not like it
  for (const account of accounts) {
    console.log('GET TRANSACTIONS FOR', account.id)
    const accountTransactions = await getTransactions({ sessionToken, fromDate, toDate }, account)
    transactions.push(...accountTransactions)
  }

  return { accounts, transactions }
}
