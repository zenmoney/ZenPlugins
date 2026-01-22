import { Account, ScrapeFunc } from '../../types/zenmoney'
import { getAccountsList, getTransactionsForAccounts, registerDevice, sessionStartApi } from './api'
import { InstallationContext, Preferences } from './models'
import { isUndefined } from 'lodash'
import { convertAccount, convertTransactions } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate }) => {
  let savedData = ZenMoney.getData('installationContext') as InstallationContext | undefined

  if (isUndefined(savedData)) {
    savedData = await registerDevice(preferences)
    ZenMoney.setData('installationContext', savedData)
    ZenMoney.saveData()
  }

  const sessionContext = await sessionStartApi(savedData, preferences)

  const bunqAccounts = await getAccountsList(sessionContext)

  const accountsToSync = bunqAccounts.filter(
    account => !ZenMoney.isAccountSkipped(String(account.id))
  )
  const accounts: Account[] = accountsToSync.map(bunqAccount => convertAccount(bunqAccount))

  const bunqTransactions = await getTransactionsForAccounts(accountsToSync, sessionContext, fromDate.toISOString())
  const transactions = convertTransactions(bunqTransactions, bunqAccounts)

  return {
    accounts,
    transactions
  }
}
