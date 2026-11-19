import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Session, Preferences } from './models'
import { convertAccount, convertTransaction } from './converters'
import { ininalApi } from './api'
import get from '../../types/get'

function parseSessionData (data: unknown): Session | undefined {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return undefined
  }

  const deviceId = get(data, 'deviceId')
  const userId = get(data, 'userId')
  const accessToken = get(data, 'accessToken')
  if (typeof deviceId !== 'string' || deviceId === '') return undefined

  return {
    deviceId,
    userId: typeof userId === 'string' && userId !== '' ? userId : undefined,
    accessToken: typeof accessToken === 'string' && accessToken !== '' ? accessToken : undefined
  }
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  ZenMoney.locale = 'tr'
  const saveSession = (session: Session): void => {
    ZenMoney.setData('session', { ...session })
    ZenMoney.saveData()
  }
  let session = parseSessionData(ZenMoney.getData('session'))
  session = await ininalApi.login(preferences, isInBackground, session)
  saveSession(session)

  const { session: newSession, accounts: accountInfos } = await ininalApi.fetchAccounts(session, saveSession)

  // refresh saved session if available
  if (newSession != null) {
    session = newSession
  }
  assert(session != null, 'could not get session')

  saveSession(session)
  console.assert(accountInfos.length > 0, 'No accounts returned')
  const accounts = accountInfos.map(convertAccount)

  const transactionsByAccount = await Promise.all(accounts.map(async (account): Promise<Transaction[]> => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return []
    }

    const accountTransactions = await ininalApi.fetchAccountTransactions(session as Session, account.id, fromDate, toDate as Date)
    return accountTransactions.map(t => convertTransaction(t, account))
  }))

  return {
    accounts,
    transactions: transactionsByAccount.flat()
  }
}
