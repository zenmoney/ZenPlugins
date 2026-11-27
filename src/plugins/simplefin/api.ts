import { Auth, Preferences, SimpleFinAccountSet } from './models'
import { claimAccessUrl, fetchAccounts as fetchSimpleFinAccounts } from './fetchApi'

export async function login (preferences: Preferences, auth?: Auth): Promise<Auth> {
  if (auth !== undefined && auth.token === preferences.token) {
    return auth
  }

  if (isAccessUrl(preferences.token)) {
    return {
      token: preferences.token,
      accessUrl: preferences.token
    }
  }

  return {
    token: preferences.token,
    accessUrl: await claimAccessUrl(preferences.token)
  }
}

export async function fetchAccounts (auth: Auth, fromDate: Date, toDate: Date): Promise<SimpleFinAccountSet> {
  return await fetchSimpleFinAccounts(auth, fromDate, toDate)
}

function isAccessUrl (value: string): boolean {
  return value.trim().startsWith('https://')
}
