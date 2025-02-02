import { Auth, OtpAccount, OtpTransaction, Preferences, Session } from './models'
import { fetchAllAccounts, fetchAuthorization, fetchProductTransactions } from './fetchApi'
import { InvalidLoginOrPasswordError } from '../../errors'
import { Currency } from './helpers'

export async function login (preferences: Preferences, auth?: Auth): Promise<Session> {
  // Ignore any passed auth
  if (preferences.login === '') {
    throw new InvalidLoginOrPasswordError('Username cannot be empty')
  }

  // Request password every time
  const password = await ZenMoney.readLine('Enter your mBank token:', {
    inputType: 'text',
    time: 120000
  })

  if (!password) {
    throw new InvalidLoginOrPasswordError('Password cannot be empty')
  }

  const authorization = await fetchAuthorization({
    login: preferences.login,
    password
  })

  return {
    auth: { cookieHeader: authorization.cookieHeader },
    login: authorization.login
  }
}

export async function fetchAccounts (session: Session): Promise<OtpAccount[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (
  session: Session,
  accountNumber: string,
  currency: keyof typeof Currency,
  fromDate: Date,
  toDate: Date
): Promise<OtpTransaction[]> {
  return await fetchProductTransactions(session, accountNumber, currency, fromDate, toDate)
}
