import crypto from 'crypto-js'
import { fetchJson } from '../../common/network'
import { InvalidPreferencesError, TemporaryError } from '../../errors'
import { getArray, getOptArray, getOptNumber, getOptString, getString } from '../../types/get'
import { CapitalTransfer, Credentials, InternalTransfer, WalletBalance } from './models'

const BASE_URL = 'https://open-api.bingx.com'

export function buildQueryString (query: Record<string, string | number | undefined>): string {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export function signQuery (secret: string, query: string): string {
  return crypto.HmacSHA256(query, secret).toString(crypto.enc.Hex)
}

async function signedGet (credentials: Credentials, path: string, query: Record<string, string | number | undefined> = {}): Promise<unknown> {
  const payload = buildQueryString({ ...query, recvWindow: 5000, timestamp: Date.now() })
  const response = await fetchJson(`${BASE_URL}${path}?${payload}&signature=${signQuery(credentials.apiSecret, payload)}`, {
    method: 'GET',
    headers: { 'X-BX-APIKEY': credentials.apiKey },
    sanitizeRequestLog: { headers: { 'X-BX-APIKEY': true }, query: { signature: true } }
  })
  if (response.status === 401 || response.status === 403) throw new InvalidPreferencesError('BingX: API key rejected. Recreate a read-only key.')
  if (response.status === 418 || response.status === 429) throw new TemporaryError('BingX: request limit reached, try again later')
  const code = getOptNumber(response.body, 'code')
  if (code != null && code !== 0) {
    const message = getOptString(response.body, 'msg') ?? getOptString(response.body, 'message') ?? 'unknown API error'
    if (code === 100001 || code === 100002 || code === 100004) throw new InvalidPreferencesError(`BingX: ${message} (code=${code})`)
    throw new TemporaryError(`BingX: ${message} (code=${code})`)
  }
  return response.body
}

async function fetchPrices (): Promise<Map<string, number>> {
  const response = await fetchJson(`${BASE_URL}/openApi/spot/v1/ticker/price`)
  const prices = new Map<string, number>()
  for (const row of getArray(response.body, 'data')) {
    const symbol = getString(row, 'symbol').replace('_', '-').toUpperCase()
    const direct = getOptString(row, 'price')
    const nested = getOptString(row, 'trades.0.price')
    const value = Number(direct ?? nested ?? 0)
    if (Number.isFinite(value) && value > 0) prices.set(symbol, value)
  }
  return prices
}

function valueInUsdt (asset: string, amount: number, prices: Map<string, number>): number {
  const coin = asset.toUpperCase()
  if (coin === 'USDT' || coin === 'USD') return amount
  const quoted = prices.get(`${coin}-USDT`)
  if (quoted != null) return amount * quoted
  return ['USDC', 'BUSD', 'FDUSD', 'USDE'].includes(coin) ? amount : 0
}

export async function fetchWalletBalances (credentials: Credentials): Promise<WalletBalance[]> {
  const [spot, overview, prices] = await Promise.all([
    signedGet(credentials, '/openApi/spot/v1/account/balance'),
    signedGet(credentials, '/openApi/account/v1/allAccountBalance'),
    fetchPrices()
  ])
  const spotRows = getArray(spot, 'data.balances').length > 0 ? getArray(spot, 'data.balances') : getArray(spot, 'data.balance')
  const fundSpot = spotRows.reduce<number>((sum, row) => {
    const amount = Number(getOptString(row, 'free') ?? getOptString(row, 'available') ?? 0) + Number(getOptString(row, 'locked') ?? getOptString(row, 'freeze') ?? 0)
    return sum + valueInUsdt(getOptString(row, 'asset') ?? getString(row, 'coin'), amount, prices)
  }, 0)
  const titleByType: Record<string, string> = { USDTMPerp: 'USDT-M Futures', stdFutures: 'Standard Futures', coinMPerp: 'Coin-M Futures', copyTrading: 'Copy Trading', grid: 'Grid Bots', eran: 'Wealth', c2c: 'C2C' }
  const additional: WalletBalance[] = getArray(overview, 'data').filter(row => getString(row, 'accountType') !== 'sopt').map(row => ({
    wallet: titleByType[getString(row, 'accountType')] ?? getString(row, 'accountType'),
    valueUsdt: Number(getString(row, 'usdtBalance')),
    savings: ['grid', 'eran', 'copyTrading'].includes(getString(row, 'accountType'))
  }))
  return [{ wallet: 'Fund / Spot', valueUsdt: fundSpot, savings: false }, ...additional]
    .filter(wallet => Number.isFinite(wallet.valueUsdt))
}

const INTERNAL_TRANSFER_TYPES: Array<{ type: string, fromWallet: string, toWallet: string }> = [
  { type: 'FUND_SFUTURES', fromWallet: 'Fund / Spot', toWallet: 'Standard Futures' },
  { type: 'SFUTURES_FUND', fromWallet: 'Standard Futures', toWallet: 'Fund / Spot' },
  { type: 'FUND_PFUTURES', fromWallet: 'Fund / Spot', toWallet: 'USDT-M Futures' },
  { type: 'PFUTURES_FUND', fromWallet: 'USDT-M Futures', toWallet: 'Fund / Spot' },
  { type: 'SFUTURES_PFUTURES', fromWallet: 'Standard Futures', toWallet: 'USDT-M Futures' },
  { type: 'PFUTURES_SFUTURES', fromWallet: 'USDT-M Futures', toWallet: 'Standard Futures' }
]

export async function fetchInternalTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<InternalTransfer[]> {
  const result: InternalTransfer[] = []
  let nextRequestAt = 0
  for (const direction of INTERNAL_TRANSFER_TYPES) {
    for (let current = 1; current <= 1000; current++) {
      // This endpoint is limited to two requests per second per IP. Querying
      // its required direction values without pacing can temporarily disable
      // an otherwise valid read-only key.
      const waitMs = nextRequestAt - Date.now()
      if (waitMs > 0) await new Promise(resolve => setTimeout(resolve, waitMs))
      const body = await signedGet(credentials, '/openApi/api/v3/asset/transfer', { type: direction.type, startTime: fromDate.getTime(), endTime: toDate.getTime(), current, size: 100 })
      nextRequestAt = Date.now() + 550
      const rows = internalTransferRows(body)
      for (const row of rows) {
        if (getString(row, 'status').toUpperCase() !== 'CONFIRMED') continue
        const id = String(responseNumber(row, 'tranId'))
        const amount = Number(getString(row, 'amount'))
        const date = new Date(responseNumber(row, 'timestamp'))
        if (id === '0' || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(date.getTime())) continue
        result.push({ id, coin: getString(row, 'asset').toUpperCase(), amount, date, fromWallet: direction.fromWallet, toWallet: direction.toWallet })
      }
      if (rows.length < 100) break
    }
  }
  const unique = new Map<string, InternalTransfer>()
  for (const transfer of result) unique.set(`${transfer.id}:${transfer.coin}`, transfer)
  return [...unique.values()].sort((left, right) => left.date.getTime() - right.date.getTime())
}

export function internalTransferRows (body: unknown): unknown[] {
  // BingX currently unwraps `data` in the common signed-request adapter for
  // this endpoint. Keep the documented { data: { rows } } response compatible
  // as well, so a server-side response-shape change does not break scraping.
  return getOptArray(body, 'rows') ?? getOptArray(body, 'data.rows') ?? []
}

export function historyRows (body: unknown): unknown[] {
  // Unlike most BingX endpoints, capital history currently returns a bare
  // JSON array instead of { code, data }. Keep both API shapes compatible.
  if (Array.isArray(body)) return body
  const data = getOptArray(body, 'data') ?? []
  const items = getOptArray(body, 'data.items') ?? []
  const list = getOptArray(body, 'data.list') ?? []
  return items.length > 0 ? items : list.length > 0 ? list : data
}

function responseNumber (row: unknown, ...paths: string[]): number {
  for (const path of paths) {
    const numeric = getOptNumber(row, path)
    if (numeric !== undefined) return numeric
    const text = getOptString(row, path)
    if (text !== undefined) return Number(text)
  }
  return 0
}

async function fetchHistory (credentials: Credentials, path: string, fromDate: Date, toDate: Date): Promise<unknown[]> {
  const all: unknown[] = []
  for (let offset = 0; offset < 100000; offset += 1000) {
    const rows = historyRows(await signedGet(credentials, path, { startTime: fromDate.getTime(), endTime: toDate.getTime(), offset, limit: 1000 }))
    all.push(...rows)
    if (rows.length < 1000) break
  }
  return all
}

export async function fetchCapitalTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<CapitalTransfer[]> {
  const [deposits, withdrawals] = await Promise.all([
    fetchHistory(credentials, '/openApi/api/v3/capital/deposit/hisrec', fromDate, toDate),
    fetchHistory(credentials, '/openApi/api/v3/capital/withdraw/history', fromDate, toDate)
  ])
  const transfers: CapitalTransfer[] = []
  for (const row of deposits) {
    // The current BingX endpoint returns status 1 for a completed deposit.
    if (String(getOptNumber(row, 'status') ?? getOptString(row, 'status') ?? '') !== '1') continue
    const id = getOptString(row, 'id') ?? getOptString(row, 'tranId') ?? getOptString(row, 'txId') ?? ''
    const amount = responseNumber(row, 'amount', 'quantity')
    if (id === '' || !Number.isFinite(amount) || amount === 0) continue
    const time = responseNumber(row, 'time', 'createTime', 'applyTime', 'insertTime', 'timestamp')
    transfers.push({ id, direction: 'deposit', coin: (getOptString(row, 'coin') ?? getOptString(row, 'asset') ?? '').toUpperCase(), amount, fee: 0, date: new Date(time), network: getOptString(row, 'network') ?? getOptString(row, 'chain') ?? null })
  }
  for (const row of withdrawals) {
    if (String(getOptNumber(row, 'status') ?? getOptString(row, 'status') ?? '') !== '1') continue
    const id = getOptString(row, 'id') ?? getOptString(row, 'tranId') ?? getOptString(row, 'txId') ?? ''
    const amount = responseNumber(row, 'amount', 'quantity')
    if (id === '' || !Number.isFinite(amount) || amount === 0) continue
    const time = responseNumber(row, 'time', 'createTime', 'applyTime', 'insertTime', 'timestamp')
    transfers.push({ id, direction: 'withdrawal', coin: (getOptString(row, 'coin') ?? getOptString(row, 'asset') ?? '').toUpperCase(), amount, fee: responseNumber(row, 'transactionFee', 'fee'), date: new Date(time), network: getOptString(row, 'network') ?? getOptString(row, 'chain') ?? null })
  }
  const unique = new Map<string, CapitalTransfer>()
  for (const transfer of transfers) unique.set(`${transfer.direction}:${transfer.id}`, transfer)
  return [...unique.values()].sort((left, right) => left.date.getTime() - right.date.getTime())
}
