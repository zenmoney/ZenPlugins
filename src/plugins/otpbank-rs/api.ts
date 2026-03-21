import { Auth, OtpAccount, OtpCard, OtpTransaction, Preferences, Product, Session } from './models'
import { fetchAllAccounts, fetchAllCards, fetchAuthorization, fetchProductTransactions } from './fetchApi'
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

  if (password == null || password === '') {
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

export async function fetchCards (session: Session): Promise<OtpCard[]> {
  return await fetchAllCards(session)
}

export async function fetchTransactions (
  session: Session,
  product: Product,
  currency: keyof typeof Currency,
  fromDate: Date,
  toDate: Date
): Promise<OtpTransaction[]> {
  return await fetchProductTransactions(session, product, currency, fromDate, toDate)
}
