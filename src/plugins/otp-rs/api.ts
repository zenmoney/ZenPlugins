import { Auth, OtpAccount, OtpTransaction, Preferences, Session } from './models'
import { fetchAllAccounts, fetchAuthorization, fetchProductTransactions } from './fetchApi'
import { InvalidLoginOrPasswordError } from '../../errors'
import { Currency } from './helpers'

export async function login (preferences: Preferences, auth?: Auth): Promise<Session> {
  if (auth != null) {
    console.log('Auth is not null')
    return { auth, login: '' }
  }

  if (preferences.login.length === 0 || preferences.password.length === 0) {
    throw new InvalidLoginOrPasswordError('Username or password can not be empty')
  }

  const authorization = await fetchAuthorization(preferences)

  return { auth:  { cookieHeader: authorization.cookieHeader} , login: authorization.login}
}

export async function fetchAccounts (session: Session): Promise<OtpAccount[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (session: Session, accountNumber: string, currency: keyof typeof Currency, fromDate: Date, toDate: Date): Promise<OtpTransaction[]> {
  return await fetchProductTransactions(session, accountNumber, currency, fromDate, toDate)
}
