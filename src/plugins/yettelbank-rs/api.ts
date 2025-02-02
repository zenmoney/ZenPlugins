import { AccountInfo, Auth, Preferences, Session, TransactionInfo } from './models'
import { fetchAllAccounts, fetchAuthorization, fetchProductTransactions } from './fetchApi'
import { InvalidLoginOrPasswordError } from '../../errors'

export async function login (preferences: Preferences, auth?: Auth): Promise<Session> {
  if (auth != null) {
    console.log('Auth is not null, but procceeding with login')
  }

  if (preferences.login.length === 0 || preferences.password.length === 0) {
    throw new InvalidLoginOrPasswordError('Username or password can not be empty')
  }

  return { auth: await fetchAuthorization(preferences) }
}

export async function fetchAccounts (session: Session): Promise<AccountInfo[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (session: Session, accountId: string, fromDate: Date, toDate: Date): Promise<TransactionInfo[]> {
  if (toDate === null) {
    toDate = new Date()
  }
  return await fetchProductTransactions(accountId, session, fromDate, toDate)
}
