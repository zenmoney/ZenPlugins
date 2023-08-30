import { Auth, Preferences, Product, Session } from './models'
import { fetchAllAccounts, fetchAuthorization, fetchProductTransactions } from './fetchApi'

export async function login (preferences: Preferences, auth?: Auth): Promise<Session> {
  if (auth != null) {
    return { auth }
  }

  return { auth: await fetchAuthorization(preferences) }
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (session: Session, product: Product, fromDate: Date, toDate: Date): Promise<unknown[]> {
  return await fetchProductTransactions(product, session)
}
