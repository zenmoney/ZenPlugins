import crypto from 'crypto-js'
import { fetchJson } from '../../common/network'
import { InvalidPreferencesError, TemporaryError } from '../../errors'
import { getArray, getOptArray, getOptNumber, getOptString, getString } from '../../types/get'
import { AssetAmount, C2CTransfer, CapitalTransfer, Credentials, EarnPosition, EarnTransfer, FundingAsset, InternalTransfer, PayTransfer, WalletBalance } from './models'

const RECV_WINDOW = 20000

export function buildQueryString (query: Record<string, string | number | undefined>): string {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export function signQuery (secret: string, query: string): string {
  return crypto.HmacSHA256(query, secret).toString(crypto.enc.Hex)
}

async function signedGet (credentials: Credentials, path: string, query: Record<string, string | number | undefined> = {}): Promise<unknown> {
  const payload = buildQueryString({ ...query, recvWindow: RECV_WINDOW, timestamp: Date.now() })
  const signature = signQuery(credentials.apiSecret, payload)
  const response = await fetchJson(`${credentials.baseUrl}${path}?${payload}&signature=${signature}`, {
    method: 'GET',
    headers: { 'X-MBX-APIKEY': credentials.apiKey },
    sanitizeRequestLog: { headers: { 'X-MBX-APIKEY': true }, query: { signature: true } }
  })
  if (response.status === 401 || response.status === 403) {
    throw new InvalidPreferencesError('Binance: API key rejected. Create a read-only key with Enable Reading only.')
  }
  if (response.status === 418 || response.status === 429) {
    throw new TemporaryError('Binance: request limit reached, try again later')
  }
  const code = getOptNumber(response.body, 'code')
  if (code != null && code < 0) {
    const message = getOptString(response.body, 'msg') ?? 'unknown API error'
    if (code === -2014 || code === -2015 || code === -1022) throw new InvalidPreferencesError(`Binance: ${message}`)
    throw new TemporaryError(`Binance: ${message} (code=${code})`)
  }
  return response.body
}

async function signedPost (credentials: Credentials, path: string, query: Record<string, string | number | undefined> = {}): Promise<unknown> {
  const payload = buildQueryString({ ...query, recvWindow: RECV_WINDOW, timestamp: Date.now() })
  const signature = signQuery(credentials.apiSecret, payload)
  // Binance accepts signed POST parameters in the query string. Keep the exact
  // signed byte sequence in the URL: fetchJson JSON-encodes string bodies,
  // which would add quotes and make Binance reject the signature.
  const response = await fetchJson(`${credentials.baseUrl}${path}?${payload}&signature=${signature}`, {
    method: 'POST',
    headers: { 'X-MBX-APIKEY': credentials.apiKey },
    sanitizeRequestLog: { headers: { 'X-MBX-APIKEY': true }, query: { signature: true } }
  })
  if (response.status === 401 || response.status === 403) {
    throw new InvalidPreferencesError('Binance: API key rejected. Create a read-only key with Enable Reading only.')
  }
  if (response.status === 418 || response.status === 429) {
    throw new TemporaryError('Binance: request limit reached, try again later')
  }
  const code = getOptNumber(response.body, 'code')
  if (code != null && code < 0) {
    const message = getOptString(response.body, 'msg') ?? 'unknown API error'
    if (code === -2014 || code === -2015 || code === -1022) throw new InvalidPreferencesError(`Binance: ${message}`)
    throw new TemporaryError(`Binance: ${message} (code=${code})`)
  }
  return response.body
}

export async function fetchSpotBalances (credentials: Credentials): Promise<AssetAmount[]> {
  const body = await signedGet(credentials, '/api/v3/account', { omitZeroBalances: 'true' })
  return getArray(body, 'balances').map(row => ({
    asset: getString(row, 'asset').toUpperCase(),
    free: Number(getString(row, 'free')),
    locked: Number(getString(row, 'locked'))
  }))
}

export async function fetchFlexibleEarn (credentials: Credentials): Promise<EarnPosition[]> {
  return await fetchEarnPositions(credentials, '/sapi/v1/simple-earn/flexible/position', 'totalAmount')
}

export async function fetchFundingBalances (credentials: Credentials): Promise<FundingAsset[]> {
  const body = await signedPost(credentials, '/sapi/v1/asset/get-funding-asset', { needBtcValuation: 'false' })
  const rows: unknown[] = Array.isArray(body) ? body : []
  return rows.map(row => ({
    asset: getString(row, 'asset').toUpperCase(),
    amount: ['free', 'locked', 'freeze', 'withdrawing']
      .map(key => Number(getOptString(row, key) ?? 0))
      .reduce((sum, value) => sum + value, 0)
  }))
}

export async function fetchLockedEarn (credentials: Credentials): Promise<EarnPosition[]> {
  return await fetchEarnPositions(credentials, '/sapi/v1/simple-earn/locked/position', 'amount')
}

async function fetchEarnPositions (credentials: Credentials, path: string, amountKey: string): Promise<EarnPosition[]> {
  const result: EarnPosition[] = []
  for (let current = 1; ; current++) {
    const body = await signedGet(credentials, path, { current, size: 100 })
    const rows = getArray(body, 'rows')
    result.push(...rows.map(row => ({
      asset: getString(row, 'asset').toUpperCase(),
      amount: Number(getString(row, amountKey))
    })))
    const total = getOptNumber(body, 'total') ?? result.length
    if (rows.length < 100 || result.length >= total) return result
  }
}

export async function fetchPrices (baseUrl: string): Promise<Map<string, number>> {
  const response = await fetchJson(`${baseUrl}/api/v3/ticker/price`)
  if (response.status === 418 || response.status === 429) throw new TemporaryError('Binance: price request limit reached')
  const prices = new Map<string, number>()
  const rows: unknown[] = Array.isArray(response.body) ? response.body : []
  for (const row of rows) {
    const price = Number(getString(row, 'price'))
    if (Number.isFinite(price)) prices.set(getString(row, 'symbol').toUpperCase(), price)
  }
  return prices
}

export async function fetchWalletBalances (credentials: Credentials): Promise<WalletBalance[]> {
  const body = await signedGet(credentials, '/sapi/v1/asset/wallet/balance', { quoteAsset: 'USDT' })
  const rows: unknown[] = Array.isArray(body) ? body : []
  return rows.map(row => ({
    walletName: getString(row, 'walletName').trim(),
    balance: Number(getString(row, 'balance')),
    active: Boolean((row as { activate?: unknown }).activate)
  })).filter(row => row.walletName !== '' && Number.isFinite(row.balance))
}

const MAX_HISTORY_RANGE_MS = 89 * 24 * 60 * 60 * 1000
const MAX_ACTIVITY_RANGE_MS = 29 * 24 * 60 * 60 * 1000

function historyRanges (fromDate: Date, toDate: Date): Array<{ startTime: number, endTime: number }> {
  const ranges: Array<{ startTime: number, endTime: number }> = []
  let startTime = fromDate.getTime()
  const end = toDate.getTime()
  while (startTime < end) {
    const endTime = Math.min(startTime + MAX_HISTORY_RANGE_MS, end)
    ranges.push({ startTime, endTime })
    startTime = endTime + 1
  }
  return ranges
}

function activityRanges (fromDate: Date, toDate: Date): Array<{ startTime: number, endTime: number }> {
  const earliest = toDate.getTime() - 180 * 24 * 60 * 60 * 1000
  return ranges(Math.max(fromDate.getTime(), earliest), toDate.getTime(), MAX_ACTIVITY_RANGE_MS)
}

function ranges (from: number, to: number, maximumRange: number): Array<{ startTime: number, endTime: number }> {
  const result: Array<{ startTime: number, endTime: number }> = []
  for (let startTime = from; startTime < to;) {
    const endTime = Math.min(startTime + maximumRange, to)
    result.push({ startTime, endTime })
    startTime = endTime + 1
  }
  return result
}

function parseBinanceDate (value: string): Date {
  // Capital withdrawal history returns `YYYY-MM-DD HH:mm:ss` without a timezone.
  // Binance documents its API timestamps in UTC; make that explicit.
  return new Date(`${value.replace(' ', 'T')}Z`)
}

export async function fetchCapitalTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<CapitalTransfer[]> {
  const all: CapitalTransfer[] = []
  for (const range of historyRanges(fromDate, toDate)) {
    const [depositsBody, withdrawalsBody] = await Promise.all([
      signedGet(credentials, '/sapi/v1/capital/deposit/hisrec', { ...range, status: 1, limit: 1000 }),
      signedGet(credentials, '/sapi/v1/capital/withdraw/history', { ...range, status: 6, limit: 1000 })
    ])
    for (const row of (Array.isArray(depositsBody) ? depositsBody : [])) {
      const amount = Number(getString(row, 'amount'))
      if (!Number.isFinite(amount) || amount === 0) continue
      all.push({
        id: getString(row, 'id'),
        direction: 'deposit',
        coin: getString(row, 'coin').toUpperCase(),
        amount,
        fee: 0,
        date: new Date(getOptNumber(row, 'completeTime') ?? getOptNumber(row, 'insertTime') ?? 0),
        network: getOptString(row, 'network') ?? null,
        walletType: getOptNumber(row, 'walletType') ?? 0
      })
    }
    for (const row of (Array.isArray(withdrawalsBody) ? withdrawalsBody : [])) {
      const amount = Number(getString(row, 'amount'))
      if (!Number.isFinite(amount) || amount === 0) continue
      const completeTime = getOptString(row, 'completeTime') ?? getString(row, 'applyTime')
      all.push({
        id: getString(row, 'id'),
        direction: 'withdrawal',
        coin: getString(row, 'coin').toUpperCase(),
        amount,
        fee: Number(getOptString(row, 'transactionFee') ?? 0),
        date: parseBinanceDate(completeTime),
        network: getOptString(row, 'network') ?? null,
        walletType: getOptNumber(row, 'walletType') ?? 0
      })
    }
  }
  // Binance can return the same completed item on a boundary retry. Keep one
  // canonical item per direction/id before handing it to ZenMoney.
  const unique = new Map<string, CapitalTransfer>()
  for (const transfer of all) unique.set(`${transfer.direction}:${transfer.id}`, transfer)
  return [...unique.values()].sort((left, right) => left.date.getTime() - right.date.getTime())
}

function partyName (value: unknown): string | null {
  if (value == null || typeof value !== 'object') return null
  return getOptString(value, 'name') ?? getOptString(value, 'binanceId') ?? null
}

function identifier (value: unknown, keys: string[]): string {
  for (const key of keys) {
    const text = getOptString(value, key)
    if (text != null && text !== '') return text
    const number = getOptNumber(value, key)
    if (number != null) return String(number)
  }
  throw new TemporaryError(`Binance: history record has no identifier (${keys.join(', ')})`)
}

async function fetchPayRange (credentials: Credentials, startTime: number, endTime: number): Promise<PayTransfer[]> {
  const body = await signedGet(credentials, '/sapi/v1/pay/transactions', { startTime, endTime, limit: 100 })
  const rows = getOptArray(body, 'data') ?? []
  if (rows.length >= 100 && endTime - startTime > 60_000) {
    const middle = Math.floor((startTime + endTime) / 2)
    return [
      ...await fetchPayRange(credentials, startTime, middle),
      ...await fetchPayRange(credentials, middle + 1, endTime)
    ]
  }
  return rows.flatMap(row => payTransfersFromRow(row))
}

export function payTransfersFromRow (row: unknown): PayTransfer[] {
  const topAmount = Number(getString(row, 'amount'))
  if (!Number.isFinite(topAmount) || topAmount === 0) return []
  const sign = topAmount < 0 ? -1 : 1
  const id = getString(row, 'transactionId')
  const common = {
    date: new Date(getOptNumber(row, 'transactionTime') ?? 0),
    orderType: getOptString(row, 'orderType') ?? 'PAY',
    counterparty: partyName(topAmount >= 0 ? (row as { payerInfo?: unknown }).payerInfo : (row as { receiverInfo?: unknown }).receiverInfo)
  }
  const components: PayTransfer[] = []
  for (const detail of getOptArray(row, 'fundsDetail') ?? []) {
    const coin = getOptString(detail, 'currency')?.toUpperCase()
    const walletAssetCost = (detail as { walletAssetCost?: unknown }).walletAssetCost
    if (coin == null || walletAssetCost == null || typeof walletAssetCost !== 'object') continue
    for (const [walletType, rawAmount] of Object.entries(walletAssetCost as Record<string, unknown>)) {
      const amount = Number(rawAmount)
      if (!Number.isFinite(amount) || amount === 0) continue
      components.push({ id: `${id}_${coin}_${walletType}`, amount: sign * Math.abs(amount), coin, walletType: Number(walletType), ...common })
    }
  }
  if (components.length > 0) return components
  return [{
    id,
    amount: topAmount,
    coin: getString(row, 'currency').toUpperCase(),
    walletType: getOptNumber(row, 'walletType') ?? 1,
    ...common
  }]
}

export async function fetchPayTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<PayTransfer[]> {
  const result: PayTransfer[] = []
  for (const range of activityRanges(fromDate, toDate)) result.push(...await fetchPayRange(credentials, range.startTime, range.endTime))
  return uniqueBy(result, row => row.id)
}

export async function fetchC2CTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<C2CTransfer[]> {
  const result: C2CTransfer[] = []
  for (const range of activityRanges(fromDate, toDate)) {
    for (const tradeType of ['BUY', 'SELL'] as const) {
      for (let page = 1; ; page++) {
        const body = await signedGet(credentials, '/sapi/v1/c2c/orderMatch/listUserOrderHistory', { ...range, tradeType, page, rows: 100 })
        const rows = getOptArray(body, 'data') ?? []
        result.push(...rows.filter(row => getOptString(row, 'orderStatus') === 'COMPLETED').map(row => ({
          id: getString(row, 'orderNumber'),
          direction: tradeType.toLowerCase() as 'buy' | 'sell',
          coin: getString(row, 'asset').toUpperCase(),
          amount: Number(getString(row, 'amount')),
          fee: Number(getOptString(row, 'commission') ?? 0),
          date: new Date(getOptNumber(row, 'createTime') ?? 0),
          fiat: getOptString(row, 'fiat') ?? '',
          fiatAmount: Number(getOptString(row, 'totalPrice') ?? 0),
          counterparty: getOptString(row, 'counterPartNickName') ?? null
        })))
        const total = getOptNumber(body, 'total') ?? result.length
        if (rows.length < 100 || page * 100 >= total) break
      }
    }
  }
  return uniqueBy(result, row => row.id)
}

const INTERNAL_TRANSFER_TYPES: Array<{ type: string, from: 'spot' | 'funding', to: 'spot' | 'funding' }> = [
  { type: 'MAIN_FUNDING', from: 'spot', to: 'funding' },
  { type: 'FUNDING_MAIN', from: 'funding', to: 'spot' }
]

export async function fetchInternalTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<InternalTransfer[]> {
  const result: InternalTransfer[] = []
  for (const range of activityRanges(fromDate, toDate)) {
    for (const transferType of INTERNAL_TRANSFER_TYPES) {
      for (let current = 1; ; current++) {
        const body = await signedGet(credentials, '/sapi/v1/asset/transfer', { ...range, type: transferType.type, current, size: 100 })
        const rows = getOptArray(body, 'rows') ?? []
        result.push(...rows.filter(row => getOptString(row, 'status') === 'CONFIRMED').map(row => ({
          id: String(getOptNumber(row, 'tranId') ?? getString(row, 'tranId')),
          coin: getString(row, 'asset').toUpperCase(),
          amount: Number(getString(row, 'amount')),
          date: new Date(getOptNumber(row, 'timestamp') ?? 0),
          from: transferType.from,
          to: transferType.to
        })))
        const total = getOptNumber(body, 'total') ?? result.length
        if (rows.length < 100 || current * 100 >= total) break
      }
    }
  }
  return uniqueBy(result, row => `${row.from}:${row.to}:${row.id}`)
}

const EARN_HISTORY: Array<{ path: string, direction: 'subscription' | 'redemption' }> = [
  { path: '/sapi/v1/simple-earn/flexible/history/subscriptionRecord', direction: 'subscription' },
  { path: '/sapi/v1/simple-earn/flexible/history/redemptionRecord', direction: 'redemption' },
  { path: '/sapi/v1/simple-earn/locked/history/subscriptionRecord', direction: 'subscription' },
  { path: '/sapi/v1/simple-earn/locked/history/redemptionRecord', direction: 'redemption' }
]

export async function fetchEarnTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<EarnTransfer[]> {
  const result: EarnTransfer[] = []
  for (const range of activityRanges(fromDate, toDate)) {
    for (const history of EARN_HISTORY) {
      for (let current = 1; ; current++) {
        const body = await signedGet(credentials, history.path, { ...range, current, size: 100 })
        const rows = getOptArray(body, 'rows') ?? []
        result.push(...rows.filter(row => ['SUCCESS', 'Success'].includes(getOptString(row, 'status') ?? '')).map(row => ({
          id: identifier(row, ['purchaseId', 'redeemId', 'id']),
          coin: getString(row, 'asset').toUpperCase(),
          amount: Number(getOptString(row, 'amount') ?? 0),
          date: new Date(getOptNumber(row, 'time') ?? 0),
          direction: history.direction
        })))
        const total = getOptNumber(body, 'total') ?? result.length
        if (rows.length < 100 || current * 100 >= total) break
      }
    }
  }
  return uniqueBy(result, row => `${row.direction}:${row.id}`)
}

function uniqueBy<T> (rows: T[], key: (row: T) => string): T[] {
  const unique = new Map<string, T>()
  for (const row of rows) unique.set(key(row), row)
  return [...unique.values()]
}
