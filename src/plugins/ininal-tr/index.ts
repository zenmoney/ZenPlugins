import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Session, Preferences } from './models'
import { convertAccount, convertTransaction } from './converters'
import { ininalApi } from './api'

function parseSessionData (data: unknown): Session | undefined {
  if (typeof data !== 'object') {
    return undefined
  }

  const {
    deviceId,
    userId,
    accessToken
  } = data as {
    deviceId: string
    userId: string
    accessToken: string
  }

  return {
    deviceId,
    userId,
    accessToken
  }
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  let session = parseSessionData(ZenMoney.getData('session'))
  session = await ininalApi.login(preferences, isInBackground, session)

  // not saving yet since session might get refreshed on fetchAccounts

  const { session: newSession, accounts: accountInfos } = await ininalApi.fetchAccounts(session)
  const accounts = accountInfos.map(convertAccount)

  // refresh saved session if available
  if (newSession != null) {
    session = newSession
  }
  assert(session != null, 'could not get session')

  ZenMoney.setData('session', session)
  ZenMoney.saveData()

  const transactionsByAccount = await Promise.all(accounts.map(async (account): Promise<Transaction[]> => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return []
    }

    const accountTransactions = await ininalApi.fetchAccountTransactions(session as Session, account.id, fromDate, toDate as Date)
    return accountTransactions.map(t => convertTransaction(t, account))
  }))

  return {
    accounts: accountInfos.map(convertAccount),
    transactions: transactionsByAccount.flat()
  }
}
