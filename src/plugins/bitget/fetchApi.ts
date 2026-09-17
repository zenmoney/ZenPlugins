import crypto from 'crypto-js'
import { fetchJson } from '../../common/network'
import { InvalidPreferencesError, TemporaryError } from '../../errors'
import { getArray, getOptString, getString } from '../../types/get'
import { CapitalTransfer, Credentials, WalletBalance } from './models'

const BASE_URL = 'https://api.bitget.com'

export function buildRequestPath (path: string, query: Record<string, string | number | undefined> = {}): string {
  const queryString = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return queryString === '' ? path : `${path}?${queryString}`
}

export function signRequest (secret: string, timestamp: string, requestPath: string): string {
  return crypto.enc.Base64.stringify(crypto.HmacSHA256(`${timestamp}GET${requestPath}`, secret))
}

async function signedGet (credentials: Credentials, path: string, query: Record<string, string | number | undefined> = {}): Promise<unknown> {
  const requestPath = buildRequestPath(path, query)
  const timestamp = String(Date.now())
  const response = await fetchJson(`${BASE_URL}${requestPath}`, {
    method: 'GET',
    headers: {
      'ACCESS-KEY': credentials.apiKey,
      'ACCESS-SIGN': signRequest(credentials.apiSecret, timestamp, requestPath),
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': credentials.passphrase,
      locale: 'en-US'
    },
    sanitizeRequestLog: {
      headers: { 'ACCESS-KEY': true, 'ACCESS-SIGN': true, 'ACCESS-PASSPHRASE': true }
    }
  })
  if (response.status === 401 || response.status === 403) {
    throw new InvalidPreferencesError('Bitget: API key rejected. Recreate a read-only key with Spot and Wallet viewing enabled.')
  }
  if (response.status === 418 || response.status === 429) throw new TemporaryError('Bitget: request limit reached, try again later')
  const code = getOptString(response.body, 'code')
  if (code != null && code !== '00000') {
    const message = getOptString(response.body, 'msg') ?? 'unknown API error'
    if (code === '40006' || code === '40009' || code === '40012') throw new InvalidPreferencesError(`Bitget: ${message} (code=${code})`)
    throw new TemporaryError(`Bitget: ${message} (code=${code})`)
  }
  return response.body
}

export async function fetchWalletBalances (credentials: Credentials): Promise<WalletBalance[]> {
  const body = await signedGet(credentials, '/api/v2/account/all-account-balance')
  return getArray(body, 'data').map(row => ({
    accountType: getString(row, 'accountType').trim(),
    valueUsdt: Number(getString(row, 'usdtBalance'))
  })).filter(wallet => wallet.accountType !== '' && Number.isFinite(wallet.valueUsdt))
}

const MAX_HISTORY_RANGE_MS = 89 * 24 * 60 * 60 * 1000

async function fetchHistoryPage (credentials: Credentials, path: string, query: Record<string, string | number | undefined>): Promise<unknown[]> {
  return getArray(await signedGet(credentials, path, { ...query, limit: 100 }), 'data')
}

async function fetchHistory (credentials: Credentials, path: string, fromDate: Date, toDate: Date): Promise<unknown[]> {
  const all: unknown[] = []
  for (let start = fromDate.getTime(); start < toDate.getTime(); start += MAX_HISTORY_RANGE_MS) {
    const end = Math.min(start + MAX_HISTORY_RANGE_MS, toDate.getTime())
    let idLessThan: string | undefined
    for (let page = 0; page < 100; page++) {
      const rows = await fetchHistoryPage(credentials, path, { startTime: start, endTime: end, idLessThan })
      all.push(...rows)
      if (rows.length < 100) break
      idLessThan = getString(rows[rows.length - 1], 'orderId')
      if (idLessThan === '') break
    }
  }
  return all
}

export async function fetchCapitalTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<CapitalTransfer[]> {
  const [deposits, withdrawals] = await Promise.all([
    fetchHistory(credentials, '/api/v2/spot/wallet/deposit-records', fromDate, toDate),
    fetchHistory(credentials, '/api/v2/spot/wallet/withdrawal-records', fromDate, toDate)
  ])
  return parseCapitalTransfers(deposits, withdrawals)
}

export function parseCapitalTransfers (deposits: unknown[], withdrawals: unknown[]): CapitalTransfer[] {
  const transfers: CapitalTransfer[] = []
  for (const row of deposits) {
    if (getString(row, 'status').toLowerCase() !== 'success') continue
    const id = getString(row, 'orderId')
    const amount = Number(getString(row, 'size'))
    if (id === '' || !Number.isFinite(amount) || amount === 0) continue
    transfers.push({ id, direction: 'deposit', coin: getString(row, 'coin').toUpperCase(), amount, fee: 0, date: new Date(Number(getString(row, 'cTime'))), network: getOptString(row, 'chain') ?? null })
  }
  for (const row of withdrawals) {
    if (getString(row, 'status').toLowerCase() !== 'success') continue
    const id = getString(row, 'orderId')
    const amount = Number(getString(row, 'size'))
    const parsedFee = Math.abs(Number(getOptString(row, 'fee') ?? 0))
    if (id === '' || !Number.isFinite(amount) || amount === 0) continue
    transfers.push({ id, direction: 'withdrawal', coin: getString(row, 'coin').toUpperCase(), amount, fee: Number.isFinite(parsedFee) ? parsedFee : 0, date: new Date(Number(getString(row, 'cTime'))), network: getOptString(row, 'chain') ?? null })
  }
  const unique = new Map<string, CapitalTransfer>()
  for (const transfer of transfers) unique.set(`${transfer.direction}:${transfer.id}`, transfer)
  return [...unique.values()].sort((left, right) => left.date.getTime() - right.date.getTime())
}
