import { InvalidPreferencesError } from '../../errors'
import {
  fetchCardTransactionsPage,
  fetchConvertCoinUsdtValues as fetchConvertCoinUsdtValuesApi,
  fetchEarnUsdtPrices as fetchEarnUsdtPricesApi,
  fetchFlexibleEarnPositions as fetchFlexibleEarnPositionsApi,
  fetchEarnTransfers as fetchEarnTransfersApi,
  fetchExternalTransfers as fetchExternalTransfersApi,
  fetchFundingBalances,
  fetchInternalTransfers as fetchInternalTransfersApi,
  fetchUnifiedWallet as fetchUnifiedWalletApi
} from './fetchApi'
import {
  Auth,
  CardTransaction,
  CardTransactionQueryType,
  CoinBalance,
  Credentials,
  FlexibleEarnPosition,
  EarnTransfer,
  ExternalTransfer,
  InternalTransfer,
  UnifiedWallet,
  Preferences
} from './models'

// if > 100, the API returns 10 only
const PAGE_LIMIT = 100
const DEFAULT_BASE_URL = 'https://api.bybit.com'
const REGION_ENDPOINTS: Readonly<Record<string, { baseUrl: string, siteId?: string }>> = {
  global: { baseUrl: DEFAULT_BASE_URL },
  netherlands: { baseUrl: 'https://api.bybit.nl' },
  turkey: { baseUrl: 'https://api.bybit.tr' },
  kazakhstan: { baseUrl: 'https://api.bybit.kz' },
  georgia: { baseUrl: 'https://api.bybitgeorgia.ge' },
  uae: { baseUrl: 'https://api.bybit.ae' },
  eea: { baseUrl: 'https://api.bybit.eu' },
  indonesia: { baseUrl: 'https://api.bybit.id' },
  japan: { baseUrl: 'https://api.manepa.jp' },
  brazil: { baseUrl: DEFAULT_BASE_URL, siteId: 'BRA_BTL' }
}
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
    preferences.apiSecret == null || preferences.apiSecret === '') {
    throw new InvalidPreferencesError('Bybit: API Key and API Secret are required')
  }
  const region = preferences.region?.trim()
  const endpoint = region == null || region === ''
    ? { baseUrl: normalizeBaseUrl(preferences.baseUrl) }
    : REGION_ENDPOINTS[region]
  if (endpoint == null) {
    throw new InvalidPreferencesError('Bybit: choose a supported account region')
  }
  const credentials: Credentials = {
    apiKey: preferences.apiKey,
    apiSecret: preferences.apiSecret,
    ...endpoint
  }
  return { credentials }
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

export async function fetchEarnUsdtPrices (creds: Credentials, positions: FlexibleEarnPosition[]): Promise<Map<string, number>> {
  return await fetchEarnUsdtPricesApi(creds, positions)
}

export async function fetchUnifiedWallet (creds: Credentials): Promise<UnifiedWallet> {
  return await fetchUnifiedWalletApi(creds)
}

export async function fetchExternalTransfers (creds: Credentials, fromDate: Date, toDate: Date): Promise<ExternalTransfer[]> {
  return await fetchExternalTransfersApi(creds, fromDate, toDate)
}

export async function fetchInternalTransfers (creds: Credentials, fromDate: Date, toDate: Date): Promise<InternalTransfer[]> {
  return await fetchInternalTransfersApi(creds, fromDate, toDate)
}

export async function fetchEarnTransfers (creds: Credentials, fromDate: Date, toDate: Date): Promise<EarnTransfer[]> {
  return await fetchEarnTransfersApi(creds, fromDate, toDate)
}

export function isCardTransactionInRange (transaction: CardTransaction, fromDate: Date, toDate: Date): boolean {
  const createdAt = Number(transaction.txnCreate)
  return Number.isFinite(createdAt) && createdAt >= fromDate.getTime() && createdAt < toDate.getTime()
}

export async function fetchTransactions (
  creds: Credentials,
  fromDate: Date,
  toDate: Date,
  type: CardTransactionQueryType
): Promise<CardTransaction[]> {
  const transactions = new Map<string, CardTransaction>()
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
    // The live Card endpoint may return records outside createBeginTime /
    // createEndTime for SIDE_QUERY_FINANCIAL_ALL.  Filter locally as well so
    // adjacent ZenMoney sync windows cannot import the same transaction twice.
    result.transactions
      .filter(txn => isCardTransactionInRange(txn, fromDate, toDate))
      .forEach(txn => transactions.set(txn.txnId, txn))
    const fetchedSoFar = page * PAGE_LIMIT
    if (result.transactions.length < PAGE_LIMIT || fetchedSoFar >= result.totalCount) {
      break
    }
  }

  return [...transactions.values()]
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
