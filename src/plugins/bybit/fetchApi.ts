import crypto from 'crypto-js'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidPreferencesError, TemporaryError } from '../../errors'
import { getArray, getOptNumber, getOptString, getString } from '../../types/get'
import { CardTransaction, CardTransactionQueryType, CoinBalance, Credentials } from './models'

const BASE_URL = 'https://api.bybit.com'
const RECV_WINDOW = '20000'
const MIN_REQUEST_INTERVAL_MS = 1500
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

async function callApi (creds: Credentials, request: BybitRequest): Promise<FetchResponse> {
  await waitForRequestSlot()

  const { apiKey, apiSecret } = creds
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
    url = `${BASE_URL}${request.path}${queryString.length > 0 ? `?${queryString}` : ''}`
  } else {
    const bodyObject = stripEmpty(request.body)
    payload = JSON.stringify(bodyObject)
    url = `${BASE_URL}${request.path}`
    options.body = bodyObject
  }

  const signature = signRequest(apiSecret, timestamp, apiKey, RECV_WINDOW, payload)
  options.headers = {
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-RECV-WINDOW': RECV_WINDOW,
    'X-BAPI-SIGN': signature,
    'X-BAPI-SIGN-TYPE': '2'
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
      throw new InvalidPreferencesError(`Bybit: ${retMsg} (retCode=${retCode}). Recreate a read-only API key in Bybit Dashboard → API with Bybit Card permissions enabled.`)
    }
    // 10006 / 10018 rate-limit / ip ban
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
    declinedReason: nullIfEmpty(getOptString(item, 'declinedReason'))
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
