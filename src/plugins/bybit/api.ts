import { InvalidPreferencesError } from '../../errors'
import { parseCardBalanceCoinsList } from './converters'
import {
  fetchCardTransactionsPage,
  fetchConvertCoinUsdtValues as fetchConvertCoinUsdtValuesApi,
  fetchFlexibleEarnPositions as fetchFlexibleEarnPositionsApi,
  fetchFundingBalances
} from './fetchApi'
import {
  Auth,
  CardTransaction,
  CardTransactionQueryType,
  CoinBalance,
  Credentials,
  FlexibleEarnPosition,
  Preferences
} from './models'

// if > 100, the API returns 10 only
const PAGE_LIMIT = 100
const DEFAULT_BASE_URL = 'https://api.bybit.com'
const ALLOWED_API_HOSTS: ReadonlySet<string> = new Set([
  'api.bybit.com',
  'api.bytick.com',
  'api.bybit.nl',
  'api.bybit.tr',
  'api.bybit.kz',
  'api.bybitgeorgia.ge',
  'api.bybit.ae',
  'api.bybit.eu',
  'api.bybit.id',
  'api.manepa.jp'
])

export function normalizeBaseUrl (rawBaseUrl?: string): string {
  const trimmedBaseUrl = rawBaseUrl?.trim()
  const value = trimmedBaseUrl == null || trimmedBaseUrl === ''
    ? DEFAULT_BASE_URL
    : trimmedBaseUrl
  let url: URL
  try {
    url = new URL(value)
  } catch (error) {
    throw new InvalidPreferencesError('Bybit: API base URL must be a valid HTTPS URL')
  }

  if (url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.port !== '' ||
      url.pathname !== '/' ||
      url.search !== '' ||
      url.hash !== '' ||
      !ALLOWED_API_HOSTS.has(url.hostname)) {
    throw new InvalidPreferencesError('Bybit: API base URL must be an official Bybit regional API host')
  }

  return `https://${url.hostname}`
}

export async function login (preferences: Preferences): Promise<Auth> {
  if (preferences.apiKey == null || preferences.apiKey === '' ||
    preferences.apiSecret == null || preferences.apiSecret === '' ||
    preferences.cardBalanceCoins == null || preferences.cardBalanceCoins.trim() === '') {
    throw new InvalidPreferencesError('Bybit: API Key, API Secret, and Card funding coins are required')
  }
  // validate the coin list
  const cardBalanceCoins = parseCardBalanceCoinsList(preferences.cardBalanceCoins)
  // Always include fiat USD from the Funding wallet (1:1 to USD)
  cardBalanceCoins.add('USD')
  const credentials: Credentials = {
    apiKey: preferences.apiKey,
    apiSecret: preferences.apiSecret,
    baseUrl: normalizeBaseUrl(preferences.baseUrl)
  }
  return { credentials, cardBalanceCoins }
}

export async function fetchAccounts (creds: Credentials): Promise<CoinBalance[]> {
  return await fetchFundingBalances(creds)
}

export async function fetchConvertCoinUsdtValues (creds: Credentials): Promise<Map<string, number>> {
  return await fetchConvertCoinUsdtValuesApi(creds)
}

export async function fetchFlexibleEarnPositions (creds: Credentials): Promise<FlexibleEarnPosition[]> {
  return await fetchFlexibleEarnPositionsApi(creds)
}

export async function fetchTransactions (
  creds: Credentials,
  fromDate: Date,
  toDate: Date,
  type: CardTransactionQueryType
): Promise<CardTransaction[]> {
  const transactions: CardTransaction[] = []
  const createBeginTime = fromDate.getTime()
  const createEndTime = toDate.getTime()

  for (let page = 1; ; page++) {
    const result = await fetchCardTransactionsPage(creds, {
      type,
      createBeginTime,
      createEndTime,
      page,
      limit: PAGE_LIMIT
    })
    result.transactions.forEach(txn => transactions.push(txn))
    const fetchedSoFar = page * PAGE_LIMIT
    if (result.transactions.length < PAGE_LIMIT || fetchedSoFar >= result.totalCount) {
      break
    }
  }

  return transactions
}

export async function fetchFinancialTransactions (
  creds: Credentials,
  fromDate: Date,
  toDate: Date
): Promise<CardTransaction[]> {
  return await fetchTransactions(creds, fromDate, toDate, 'SIDE_QUERY_FINANCIAL_ALL')
}

export async function fetchAuthorizationTransactions (
  creds: Credentials,
  fromDate: Date,
  toDate: Date
): Promise<CardTransaction[]> {
  return await fetchTransactions(creds, fromDate, toDate, 'SIDE_QUERY_AUTH')
}
