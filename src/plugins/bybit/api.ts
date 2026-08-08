import { InvalidPreferencesError } from '../../errors'
import { parseCardBalanceCoinsList } from './converters'
import {
  fetchCardTransactionsPage,
  fetchConvertCoinUsdtValues as fetchConvertCoinUsdtValuesApi,
  fetchFundingBalances
} from './fetchApi'
import { Auth, CardTransaction, CardTransactionQueryType, CoinBalance, Credentials, Preferences } from './models'

// if > 100, the API returns 10 only
const PAGE_LIMIT = 100

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
  const credentials: Credentials = { apiKey: preferences.apiKey, apiSecret: preferences.apiSecret }
  return { credentials, cardBalanceCoins }
}

export async function fetchAccounts (creds: Credentials): Promise<CoinBalance[]> {
  return await fetchFundingBalances(creds)
}

export async function fetchConvertCoinUsdtValues (creds: Credentials): Promise<Map<string, number>> {
  return await fetchConvertCoinUsdtValuesApi(creds)
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
