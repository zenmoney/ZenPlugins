import { fetchToken, fetchAccountStatement, fetchAccountBalance } from './fetchApi'
import { Preferences, StatementResponse, Account, BalanceResponse } from './models'

const CURRENCIES = ['GEL', 'USD', 'EUR']

async function getAccessToken (preferences: Preferences): Promise<string> {
  let accessToken = ZenMoney.getData('accessToken') as string | undefined
  let tokenExpiry = ZenMoney.getData('tokenExpiry') as string | undefined

  if ((accessToken == null) || (tokenExpiry == null) || new Date() >= new Date(tokenExpiry)) {
    const authResponse = await fetchToken(preferences.clientId, preferences.clientSecret)
    accessToken = authResponse.access_token
    tokenExpiry = new Date(Date.now() + authResponse.expires_in * 1000).toISOString()
    ZenMoney.setData('accessToken', accessToken)
    ZenMoney.setData('tokenExpiry', tokenExpiry)
    ZenMoney.saveData()
  }

  return accessToken
}

export function parseAccounts (preferences: Preferences): Account[] {
  const accountStrings = preferences.accounts.split(',').map(acc => acc.trim())
  const accounts: Account[] = []

  for (const accountString of accountStrings) {
    const accountCurrency = accountString.slice(-3)
    const includesCurrency = CURRENCIES.includes(accountCurrency)
    if (includesCurrency) {
      accounts.push({
        id: accountString,
        number: accountString.slice(0, -3),
        currency: accountCurrency
      })
    } else {
      for (const currency of CURRENCIES) {
        accounts.push({
          id: accountString + currency,
          number: accountString,
          currency
        })
      }
    }
  }

  return accounts
}

function formatDate (date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function fetchTransactions (
  preferences: Preferences,
  account: Account,
  fromDate: Date,
  toDate: Date
): Promise<StatementResponse> {
  const accessToken = await getAccessToken(preferences)
  return await fetchAccountStatement(accessToken, account.number, account.currency, formatDate(fromDate), formatDate(toDate))
}

export async function fetchBalance (
  preferences: Preferences,
  account: Account
): Promise<BalanceResponse> {
  const accessToken = await getAccessToken(preferences)
  return await fetchAccountBalance(accessToken, account.number, account.currency)
}
