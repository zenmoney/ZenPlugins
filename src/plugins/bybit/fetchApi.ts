import crypto from 'crypto-js'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidPreferencesError, TemporaryError } from '../../errors'
import { getArray, getOptNumber, getOptString, getString } from '../../types/get'
import {
  CardTransaction,
  CardTransactionQueryType,
  CoinBalance,
  Credentials,
  EarnTransfer,
  ExternalTransfer,
  FlexibleEarnPosition,
  InternalTransfer,
  UnifiedWallet
} from './models'

const RECV_WINDOW = '20000'
// Asset and Earn history need many small date windows on the first sync.
// Four signed requests per second stay well below Bybit's documented limits
// while avoiding a multi-minute first run.
const MIN_REQUEST_INTERVAL_MS = 500
const INTERNAL_HISTORY_DAYS = 180
let lastRequestAt = 0

export interface CardTransactionPage {
  transactions: CardTransaction[]
  page: number
  pageSize: number
  totalCount: number
}

interface GetRequest {
  method: 'GET'
  path: string
  query: Record<string, string | number | undefined>
}

interface PostRequest {
  method: 'POST'
  path: string
  body: Record<string, string | number | undefined>
}

type BybitRequest = GetRequest | PostRequest

async function waitForRequestSlot (): Promise<void> {
  const now = Date.now()
  const waitMs = lastRequestAt + MIN_REQUEST_INTERVAL_MS - now
  if (waitMs > 0) {
    await new Promise(resolve => setTimeout(resolve, waitMs))
  }
  lastRequestAt = Date.now()
}

export function buildQueryString (query: Record<string, string | number | undefined>): string {
  // Bybit V5 expects the signed query string to be in insertion order, not sorted.
  // We keep the order of the keys as provided by the caller.
  const parts: string[] = []
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') {
      continue
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }
  return parts.join('&')
}

export function stripEmpty (body: Record<string, string | number | undefined>): Record<string, string | number> {
  // Strip undefined/empty values so the signed body matches the wire body.
  const clean: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === '') {
      continue
    }
    clean[key] = value
  }
  return clean
}

export function signRequest (apiSecret: string, timestamp: string, apiKey: string, recvWindow: string, payload: string): string {
  // Bybit V5 spec: sign = HMAC_SHA256(apiSecret, timestamp + apiKey + recvWindow + (queryString | bodyString))
  const message = timestamp + apiKey + recvWindow + payload
  return crypto.HmacSHA256(message, apiSecret).toString(crypto.enc.Hex)
}

async function callApi (creds: Credentials, request: BybitRequest, attempt = 0): Promise<FetchResponse> {
  await waitForRequestSlot()

  const { apiKey, apiSecret, baseUrl, siteId } = creds
  const timestamp = Date.now().toString()

  let url: string
  const options: FetchOptions = {
    method: request.method,
    sanitizeRequestLog: {
      headers: { 'X-BAPI-API-KEY': true, 'X-BAPI-SIGN': true }
    }
  }

  let payload: string
  if (request.method === 'GET') {
    const queryString = buildQueryString(request.query)
    payload = queryString
    url = `${baseUrl}${request.path}${queryString.length > 0 ? `?${queryString}` : ''}`
  } else {
    const bodyObject = stripEmpty(request.body)
    payload = JSON.stringify(bodyObject)
    url = `${baseUrl}${request.path}`
    options.body = bodyObject
  }

  const signature = signRequest(apiSecret, timestamp, apiKey, RECV_WINDOW, payload)
  options.headers = {
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-RECV-WINDOW': RECV_WINDOW,
    'X-BAPI-SIGN': signature,
    'X-BAPI-SIGN-TYPE': '2',
    ...(siteId == null ? {} : { 'x-site-id': siteId })
  }

  const response = await fetchJson(url, options)

  if (response.status === 429) {
    throw new TemporaryError('Bybit: too many requests, try again later')
  }
  if (response.status === 401 || response.status === 403) {
    throw new InvalidPreferencesError('Bybit: API key rejected (HTTP ' + String(response.status) + '). Recreate a read-only key in Bybit Dashboard → API.')
  }

  const retCode = getOptNumber(response.body, 'retCode')
  if (retCode !== undefined && retCode !== 0) {
    const retMsg = getOptString(response.body, 'retMsg') ?? 'unknown error'
    // 10003 invalid api key, 10004 invalid sign, 33004 api key expired, 10005 permission denied
    if (retCode === 10003 || retCode === 10004 || retCode === 33004 || retCode === 10005) {
      throw new InvalidPreferencesError(`Bybit: ${retMsg} (retCode=${retCode}). Recreate a read-only API key in Bybit Dashboard → API with Bybit Card, Earn, Wallet, and Exchange History permissions enabled.`)
    }
    // 10006 / 10018 rate-limit / ip ban
    if (retCode === 10006 && attempt < 4) {
      await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)))
      return await callApi(creds, request, attempt + 1)
    }
    if (retCode === 10006 || retCode === 10018) {
      throw new TemporaryError(`Bybit: ${retMsg} (retCode=${retCode})`)
    }
    throw new TemporaryError(`Bybit API error: ${retMsg} (retCode=${retCode})`)
  }

  return response
}

export async function fetchFundingBalances (creds: Credentials): Promise<CoinBalance[]> {
  const response = await callApi(creds, {
    method: 'GET',
    path: '/v5/asset/transfer/query-account-coins-balance',
    query: { accountType: 'FUND' }
  })

  const balances = getArray(response.body, 'result.balance')
  return balances.map(item => ({
    coin: getString(item, 'coin'),
    walletBalance: Number(getString(item, 'walletBalance')),
    transferBalance: Number(getString(item, 'transferBalance'))
  }))
}

export async function fetchUnifiedWallet (creds: Credentials): Promise<UnifiedWallet> {
  const response = await callApi(creds, {
    method: 'GET',
    path: '/v5/account/wallet-balance',
    query: { accountType: 'UNIFIED' }
  })
  const wallet = getArray(response.body, 'result.list')[0]
  if (wallet == null) {
    throw new TemporaryError('Bybit: Unified wallet was not returned by the API')
  }
  return { totalEquity: parseAmountString(wallet, 'totalEquity') }
}

const DAY_MS = 24 * 60 * 60 * 1000

async function fetchCursorRows (
  creds: Credentials,
  path: string,
  query: Record<string, string | number | undefined>,
  listKey: 'rows' | 'list'
): Promise<unknown[]> {
  const rows: unknown[] = []
  let cursor: string | undefined
  do {
    const response = await callApi(creds, {
      method: 'GET', path, query: { ...query, limit: 50, cursor }
    })
    rows.push(...getArray(response.body, `result.${listKey}`))
    const nextCursor = getOptString(response.body, 'result.nextPageCursor')
    cursor = nextCursor == null || nextCursor === '' ? undefined : nextCursor
  } while (cursor != null)
  return rows
}

function historyRanges (fromDate: Date, toDate: Date, days: number): Array<{ startTime: number, endTime: number }> {
  const ranges: Array<{ startTime: number, endTime: number }> = []
  let startTime = fromDate.getTime()
  const finalTime = toDate.getTime()
  while (startTime < finalTime) {
    const endTime = Math.min(startTime + days * DAY_MS - 1, finalTime - 1)
    ranges.push({ startTime, endTime })
    startTime = endTime + 1
  }
  return ranges
}

function apiDate (value: string): Date {
  const numeric = Number(value)
  return new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
}

export async function fetchExternalTransfers (creds: Credentials, fromDate: Date, toDate: Date): Promise<ExternalTransfer[]> {
  const transfers = new Map<string, ExternalTransfer>()
  for (const range of historyRanges(fromDate, toDate, 29)) {
    const deposits = await fetchCursorRows(creds, '/v5/asset/deposit/query-record', range, 'rows')
    for (const row of deposits) {
      if (getOptNumber(row, 'status') !== 3 || getOptString(row, 'depositType') === '50') continue
      const id = getString(row, 'id')
      transfers.set(`deposit:${id}`, {
        id,
        direction: 'deposit',
        coin: getString(row, 'coin').toUpperCase(),
        amount: parseAmountString(row, 'amount'),
        fee: parseAmountString(row, 'depositFee'),
        date: apiDate(getString(row, 'successAt')),
        network: nullIfEmpty(getOptString(row, 'chain'))
      })
    }

    const internalDeposits = await fetchCursorRows(creds, '/v5/asset/deposit/query-internal-record', range, 'rows')
    for (const row of internalDeposits) {
      if (getOptNumber(row, 'status') !== 2) continue
      const id = getString(row, 'id')
      transfers.set(`internal-deposit:${id}`, {
        id: `internal-${id}`,
        direction: 'deposit',
        coin: getString(row, 'coin').toUpperCase(),
        amount: parseAmountString(row, 'amount'),
        fee: 0,
        date: apiDate(getString(row, 'createdTime')),
        network: 'Bybit internal'
      })
    }

    const withdrawals = await fetchCursorRows(creds, '/v5/asset/withdraw/query-record', { ...range, withdrawType: 2 }, 'rows')
    for (const row of withdrawals) {
      if ((getOptString(row, 'status') ?? '').toLowerCase() !== 'success') continue
      const id = getOptString(row, 'withdrawId') ?? getString(row, 'withdrawID')
      transfers.set(`withdrawal:${id}`, {
        id,
        direction: 'withdrawal',
        coin: getString(row, 'coin').toUpperCase(),
        amount: parseAmountString(row, 'amount'),
        fee: parseAmountString(row, 'withdrawFee'),
        date: apiDate(getString(row, 'createTime')),
        network: nullIfEmpty(getOptString(row, 'chain'))
      })
    }
  }
  return [...transfers.values()]
}

export async function fetchInternalTransfers (creds: Credentials, fromDate: Date, toDate: Date): Promise<InternalTransfer[]> {
  const transfers = new Map<string, InternalTransfer>()
  const boundedFromDate = new Date(Math.max(fromDate.getTime(), toDate.getTime() - INTERNAL_HISTORY_DAYS * DAY_MS))
  for (const range of historyRanges(boundedFromDate, toDate, 7)) {
    const rows = await fetchCursorRows(creds, '/v5/asset/transfer/query-inter-transfer-list', range, 'list')
    for (const row of rows) {
      if ((getOptString(row, 'status') ?? '').toUpperCase() !== 'SUCCESS') continue
      const id = getString(row, 'transferId')
      transfers.set(id, {
        id,
        coin: getString(row, 'coin').toUpperCase(),
        amount: parseAmountString(row, 'amount'),
        fromAccountType: getString(row, 'fromAccountType').toUpperCase(),
        toAccountType: getString(row, 'toAccountType').toUpperCase(),
        date: apiDate(getString(row, 'timestamp'))
      })
    }
  }
  return [...transfers.values()]
}

export async function fetchEarnTransfers (creds: Credentials, fromDate: Date, toDate: Date): Promise<EarnTransfer[]> {
  const transfers = new Map<string, EarnTransfer>()
  const boundedFromDate = new Date(Math.max(fromDate.getTime(), toDate.getTime() - INTERNAL_HISTORY_DAYS * DAY_MS))
  for (const range of historyRanges(boundedFromDate, toDate, 7)) {
    const rows = await fetchCursorRows(creds, '/v5/earn/order', { ...range, category: 'FlexibleSaving' }, 'list')
    for (const row of rows) {
      const type = getOptString(row, 'orderType')
      if ((type !== 'Stake' && type !== 'Redeem') || getOptString(row, 'status') !== 'Success') continue
      const id = getString(row, 'orderId')
      transfers.set(id, {
        id,
        coin: getString(row, 'coin').toUpperCase(),
        amount: parseAmountString(row, 'orderValue'),
        type,
        date: apiDate(getString(row, 'createdAt'))
      })
    }
  }
  return [...transfers.values()]
}

export async function fetchCardTransactionsPage (
  creds: Credentials,
  params: {
    type: CardTransactionQueryType
    createBeginTime: number
    createEndTime: number
    page: number
    limit: number
  }
): Promise<CardTransactionPage> {
  const response = await callApi(creds, {
    method: 'POST',
    path: '/v5/card/transaction/query-asset-records',
    body: {
      type: params.type,
      createBeginTime: params.createBeginTime,
      createEndTime: params.createEndTime,
      page: params.page,
      limit: params.limit
    }
  })

  const data = getArray(response.body, 'result.data')
  return {
    transactions: data.map(parseCardTransaction),
    page: getOptNumber(response.body, 'result.pageNo') ?? params.page,
    pageSize: getOptNumber(response.body, 'result.pageSize') ?? params.limit,
    totalCount: getOptNumber(response.body, 'result.totalCount') ?? data.length
  }
}

export async function fetchConvertCoinUsdtValues (creds: Credentials): Promise<Map<string, number>> {
  // Convert API gives the "one-click" USDT-worth value (`uBalance`) for every coin in the
  // selected wallet. For the Bybit Card the relevant wallet is Funding (eb_convert_funding).
  // Requires the API key to have the "Exchange / Exchange History" (read-only) permission.
  const response = await callApi(creds, {
    method: 'GET',
    path: '/v5/asset/exchange/query-coin-list',
    query: { accountType: 'eb_convert_funding', side: 0 }
  })
  const list = getArray(response.body, 'result.coins')
  const values = new Map<string, number>()
  for (const item of list) {
    const coin = getString(item, 'coin').toUpperCase()
    values.set(coin, parseAmountString(item, 'uBalance'))
  }
  return values
}

export async function fetchFlexibleEarnPositions (creds: Credentials): Promise<FlexibleEarnPosition[]> {
  const response = await callApi(creds, {
    method: 'GET',
    path: '/v5/earn/position',
    query: { category: 'FlexibleSaving' }
  })

  return getArray(response.body, 'result.list').map(item => {
    return {
      coin: getString(item, 'coin').toUpperCase(),
      amount: parseAmountString(item, 'amount'),
      // availableAmount is the redeemable portion and therefore the amount that
      // Auto-Deduction can use for card spending. Do not fall back to the total
      // amount: it can contain frozen funds.
      availableAmount: parseAmountString(item, 'availableAmount')
    }
  })
}

/**
 * Values every non-stable Earn asset in USDT using Bybit's own spot ticker.
 * A missing quote is a hard error: silently treating a held asset as zero
 * would understate the user's capital.
 */
export async function fetchEarnUsdtPrices (
  creds: Credentials,
  positions: FlexibleEarnPosition[]
): Promise<Map<string, number>> {
  // Only the accounting unit itself is exactly 1. Other stablecoins can
  // deviate from their peg, so use Bybit's live market price for them too.
  const prices = new Map<string, number>([['USDT', 1]])
  const coins = [...new Set(positions.map(position => position.coin.toUpperCase()))]
  for (const coin of coins) {
    if (prices.has(coin)) continue
    const response = await callApi(creds, {
      method: 'GET',
      path: '/v5/market/tickers',
      query: { category: 'spot', symbol: `${coin}USDT` }
    })
    const ticker = getArray(response.body, 'result.list')[0]
    if (ticker == null) {
      throw new TemporaryError(`Bybit: no USDT market price was returned for Flexible Earn asset ${coin}`)
    }
    const price = parseAmountString(ticker, 'lastPrice')
    if (price <= 0) {
      throw new TemporaryError(`Bybit: invalid USDT market price for Flexible Earn asset ${coin}`)
    }
    prices.set(coin, price)
  }
  return prices
}

function parseCardTransaction (item: unknown): CardTransaction {
  return {
    txnId: getString(item, 'txnId'),
    orderNo: nullIfEmpty(getOptString(item, 'orderNo')),
    side: getString(item, 'side'),
    tradeStatus: getString(item, 'tradeStatus'),
    txnCreate: getString(item, 'txnCreate'),
    basicAmount: parseAmountString(item, 'basicAmount'),
    basicCurrency: getOptString(item, 'basicCurrency') ?? 'USD',
    baseAmount: parseAmountString(item, 'baseAmount'),
    paidAmount: parseAmountString(item, 'paidAmount'),
    paidCurrency: getString(item, 'paidCurrency'),
    transactionAmount: parseAmountString(item, 'transactionAmount'),
    transactionCurrency: getString(item, 'transactionCurrency'),
    transactionCurrencyAmount: parseAmountString(item, 'transactionCurrencyAmount'),
    merchName: nullIfEmpty(getOptString(item, 'merchName')),
    merchCity: nullIfEmpty(getOptString(item, 'merchCity')),
    merchCountry: nullIfEmpty(getOptString(item, 'merchCountry')),
    mccCode: parseOptIntString(item, 'mccCode'),
    merchCategoryDesc: nullIfEmpty(getOptString(item, 'merchCategoryDesc')),
    pan4: nullIfEmpty(getOptString(item, 'pan4')),
    declinedReason: nullIfEmpty(getOptString(item, 'declinedReason')),
    totalFees: parseAmountString(item, 'totalFees')
  }
}

function nullIfEmpty (value: string | undefined): string | null {
  return value == null || value === '' ? null : value
}

function parseAmountString (item: unknown, path: string): number {
  const raw = getOptString(item, path)
  if (raw == null || raw === '') {
    return 0
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseOptIntString (item: unknown, path: string): number | null {
  const raw = getOptString(item, path)
  if (raw == null || raw === '') {
    return null
  }
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}
