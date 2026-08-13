import { TemporaryUnavailableError } from '../../errors'
import { Auth, Preferences, Product, Session } from './models'
import { fetchAllProducts, fetchAuthorization, fetchProductTransactions } from './fetchApi'

const reusableAuthTtlMs = 4 * 60 * 1000

function isReusableAuth (auth: Auth | undefined): auth is Auth {
  if (auth?.cookieHeader == null || auth.cookieHeader === '' || auth.updatedAt == null) {
    return false
  }
  const updatedAt = new Date(auth.updatedAt).getTime()
  return !Number.isNaN(updatedAt) && Date.now() - updatedAt < reusableAuthTtlMs
}

async function retryWithAuth<T> (preferences: Preferences, session: Session, action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (e) {
    if (!(e instanceof TemporaryUnavailableError)) {
      throw e
    }
    session.auth = await fetchAuthorization(preferences)
    return await action()
  }
}

export async function login (preferences: Preferences, auth?: Auth): Promise<Session> {
  if (isReusableAuth(auth)) {
    return { auth }
  }
  return { auth: await fetchAuthorization(preferences) }
}

export async function fetchAccounts (preferences: Preferences, session: Session): Promise<unknown[]> {
  return await retryWithAuth(preferences, session, async () => await fetchAllProducts(session))
}

export async function fetchTransactions (preferences: Preferences, session: Session, product: Product, fromDate: Date, toDate: Date): Promise<unknown[]> {
  return await retryWithAuth(preferences, session, async () => await fetchProductTransactions(session, product, fromDate, toDate))
}
