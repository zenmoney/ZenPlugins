import crypto from 'crypto-js'
import { fetchJson } from '../../common/network'
import { InvalidPreferencesError, TemporaryError } from '../../errors'
import { getArray, getOptNumber, getOptString, getString } from '../../types/get'
import { CapitalTransfer, Credentials, SpotAsset } from './models'

const BASE_URL = 'https://api.mexc.com'
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
  const response = await fetchJson(`${BASE_URL}${path}?${payload}&signature=${signature}`, {
    method: 'GET',
    headers: { 'X-MEXC-APIKEY': credentials.apiKey },
    sanitizeRequestLog: { headers: { 'X-MEXC-APIKEY': true }, query: { signature: true } }
  })
  if (response.status === 401 || response.status === 403) {
    throw new InvalidPreferencesError('MEXC: API key rejected. Create a read-only key with account viewing enabled.')
  }
  if (response.status === 418 || response.status === 429) {
    throw new TemporaryError('MEXC: request limit reached, try again later')
  }
  const code = getOptNumber(response.body, 'code')
  if (code != null && code !== 0) {
    const message = getOptString(response.body, 'msg') ?? 'unknown API error'
    if (code === 700002 || code === 700003 || code === 700005 || code === 700006) {
      throw new InvalidPreferencesError(`MEXC: ${message}`)
    }
    throw new TemporaryError(`MEXC: ${message} (code=${code})`)
  }
  return response.body
}

export async function fetchSpotBalances (credentials: Credentials): Promise<SpotAsset[]> {
  const body = await signedGet(credentials, '/api/v3/account', { omitZeroBalances: 'true' })
  return getArray(body, 'balances').map(row => ({
    asset: getString(row, 'asset').toUpperCase(),
    free: Number(getString(row, 'free')),
    locked: Number(getString(row, 'locked'))
  })).filter(row => Number.isFinite(row.free) && Number.isFinite(row.locked))
}

export async function fetchPrices (): Promise<Map<string, number>> {
  const response = await fetchJson(`${BASE_URL}/api/v3/ticker/price`)
  if (response.status === 418 || response.status === 429) throw new TemporaryError('MEXC: price request limit reached')
  const rows: unknown[] = Array.isArray(response.body) ? response.body : []
  const prices = new Map<string, number>()
  for (const row of rows) {
    const price = Number(getString(row, 'price'))
    if (Number.isFinite(price)) prices.set(getString(row, 'symbol').toUpperCase(), price)
  }
  return prices
}

const MAX_HISTORY_MS = 89 * 24 * 60 * 60 * 1000
// MEXC accepts capital-history windows of at most seven days. The public API
// does not paginate a wider range for us, so the plugin does it transparently.
const MAX_CAPITAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 - 1

function records (body: unknown): unknown[] {
  return Array.isArray(body) ? body : getArray(body, 'data')
}

async function fetchCapitalRows (credentials: Credentials, path: string, startTime: number, endTime: number): Promise<unknown[]> {
  const rows = records(await signedGet(credentials, path, { startTime, endTime, limit: 1000 }))
  if (rows.length < 1000 || endTime - startTime <= 1000) return rows
  const middle = Math.floor((startTime + endTime) / 2)
  const [left, right] = await Promise.all([
    fetchCapitalRows(credentials, path, startTime, middle),
    fetchCapitalRows(credentials, path, middle + 1, endTime)
  ])
  return [...left, ...right]
}

/**
 * MEXC exposes no more than 90 days of capital history. We ask for all that
 * the exchange can legally return and never pretend that an older period was
 * imported. Only terminal statuses are emitted.
 */
export async function fetchCapitalTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<CapitalTransfer[]> {
  const safeFrom = new Date(Math.max(fromDate.getTime(), toDate.getTime() - MAX_HISTORY_MS))
  const transfers: CapitalTransfer[] = []
  for (let start = safeFrom.getTime(); start <= toDate.getTime(); start += MAX_CAPITAL_WINDOW_MS + 1) {
    const end = Math.min(start + MAX_CAPITAL_WINDOW_MS, toDate.getTime())
    const [deposits, withdrawals] = await Promise.all([
      fetchCapitalRows(credentials, '/api/v3/capital/deposit/hisrec', start, end),
      fetchCapitalRows(credentials, '/api/v3/capital/withdraw/history', start, end)
    ])
    for (const row of deposits) {
      const status = getOptNumber(row, 'status')
      // MEXC documents both SUCCESS (5) and COMPLETED (12) for deposits.
      if (status !== 5 && status !== 12) continue
      const amount = Number(getString(row, 'amount'))
      const id = getString(row, 'txId')
      if (id === '' || !Number.isFinite(amount) || amount === 0) continue
      transfers.push({ id, direction: 'deposit', coin: getString(row, 'coin').toUpperCase(), amount, fee: 0, date: new Date(getOptNumber(row, 'insertTime') ?? 0), network: getOptString(row, 'network') ?? null })
    }
    for (const row of withdrawals) {
      // MEXC documents SUCCESS as status 7 for withdrawals.
      if (getOptNumber(row, 'status') !== 7) continue
      const amount = Number(getString(row, 'amount'))
      const id = getString(row, 'id')
      if (id === '' || !Number.isFinite(amount) || amount === 0) continue
      transfers.push({ id, direction: 'withdrawal', coin: getString(row, 'coin').toUpperCase(), amount, fee: Number(getOptString(row, 'transactionFee') ?? 0), date: new Date(getOptNumber(row, 'applyTime') ?? 0), network: getOptString(row, 'network') ?? null })
    }
  }
  const unique = new Map<string, CapitalTransfer>()
  for (const transfer of transfers) unique.set(`${transfer.direction}:${transfer.id}`, transfer)
  return [...unique.values()].sort((left, right) => left.date.getTime() - right.date.getTime())
}
