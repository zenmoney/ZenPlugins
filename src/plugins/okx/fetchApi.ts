import crypto from 'crypto-js'
import { fetchJson } from '../../common/network'
import { InvalidPreferencesError, TemporaryError } from '../../errors'
import { getArray, getOptString, getString } from '../../types/get'
import { CapitalTransfer, Credentials, WalletBalance } from './models'

export function requestPath (path: string, query: Record<string, string | number | undefined> = {}): string {
  const serialized = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return serialized === '' ? path : `${path}?${serialized}`
}

export function signRequest (secret: string, timestamp: string, path: string): string {
  return crypto.enc.Base64.stringify(crypto.HmacSHA256(`${timestamp}GET${path}`, secret))
}

async function signedGet (credentials: Credentials, path: string, query: Record<string, string | number | undefined> = {}): Promise<unknown> {
  const fullPath = requestPath(path, query)
  const timestamp = new Date().toISOString()
  const response = await fetchJson(`${credentials.baseUrl}${fullPath}`, {
    method: 'GET',
    headers: {
      'OK-ACCESS-KEY': credentials.apiKey,
      'OK-ACCESS-SIGN': signRequest(credentials.apiSecret, timestamp, fullPath),
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': credentials.passphrase,
      'Content-Type': 'application/json'
    },
    sanitizeRequestLog: { headers: { 'OK-ACCESS-KEY': true, 'OK-ACCESS-SIGN': true, 'OK-ACCESS-PASSPHRASE': true } }
  })
  if (response.status === 401 || response.status === 403) {
    throw new InvalidPreferencesError('OKX: API key rejected. Recreate a read-only key with Trading, Funding and Earn viewing enabled.')
  }
  if (response.status === 429) throw new TemporaryError('OKX: request limit reached, try again later')
  const code = getOptString(response.body, 'code')
  if (code != null && code !== '0') {
    const message = getOptString(response.body, 'msg') ?? 'unknown API error'
    if (code === '50101' || code === '50102' || code === '50113') throw new InvalidPreferencesError(`OKX: ${message} (code=${code})`)
    throw new TemporaryError(`OKX: ${message} (code=${code})`)
  }
  return response.body
}

function totalByUsdt (rows: unknown[]): number {
  return rows.reduce<number>((sum, row) => sum + Number(getString(row, 'eqUsd')), 0)
}

async function fetchPrices (baseUrl: string): Promise<Map<string, number>> {
  const response = await fetchJson(`${baseUrl}/api/v5/market/tickers?instType=SPOT`)
  if (response.status === 429) throw new TemporaryError('OKX: price request limit reached, try again later')
  const prices = new Map<string, number>()
  for (const row of getArray(response.body, 'data')) {
    const price = Number(getString(row, 'last'))
    if (Number.isFinite(price)) prices.set(getString(row, 'instId').toUpperCase(), price)
  }
  return prices
}

function valueInUsdt (coin: string, amount: number, prices: Map<string, number>): number {
  const normalized = coin.toUpperCase()
  if (normalized === 'USDT' || normalized === 'USD') return amount
  const direct = prices.get(`${normalized}-USDT`)
  if (direct != null) return amount * direct
  for (const bridge of ['BTC', 'ETH']) {
    const assetBridge = prices.get(`${normalized}-${bridge}`)
    const bridgeUsdt = prices.get(`${bridge}-USDT`)
    if (assetBridge != null && bridgeUsdt != null) return amount * assetBridge * bridgeUsdt
  }
  return 0
}

export async function fetchWalletBalances (credentials: Credentials): Promise<WalletBalance[]> {
  const [trading, funding, savings, prices] = await Promise.all([
    signedGet(credentials, '/api/v5/account/balance'),
    signedGet(credentials, '/api/v5/asset/balances'),
    signedGet(credentials, '/api/v5/finance/savings/balance'),
    fetchPrices(credentials.baseUrl)
  ])
  const tradingRows = getArray(trading, 'data.0.details')
  const fundingRows = getArray(funding, 'data')
  const savingsRows = getArray(savings, 'data')
  const fundingValue = fundingRows.reduce<number>((sum, row) => sum + valueInUsdt(getString(row, 'ccy'), Number(getString(row, 'bal')), prices), 0)
  const savingsValue = savingsRows.reduce<number>((sum, row) => sum + valueInUsdt(getString(row, 'ccy'), Number(getString(row, 'amt')), prices), 0)
  const wallets: WalletBalance[] = [
    { wallet: 'Trading', valueUsdt: totalByUsdt(tradingRows), savings: false },
    { wallet: 'Funding', valueUsdt: fundingValue, savings: false },
    { wallet: 'Savings', valueUsdt: savingsValue, savings: true }
  ]
  return wallets.filter(wallet => Number.isFinite(wallet.valueUsdt))
}

export async function fetchCapitalTransfers (credentials: Credentials, fromDate: Date, toDate: Date): Promise<CapitalTransfer[]> {
  const fetchHistory = async (path: string): Promise<unknown[]> => {
    const result: unknown[] = []
    let after = toDate.getTime() + 1
    const before = fromDate.getTime() - 1
    for (let page = 0; page < 100; page++) {
      const body = await signedGet(credentials, path, { after, before, limit: 100 })
      const rows = getArray(body, 'data')
      result.push(...rows)
      if (rows.length < 100) break
      const oldest = Math.min(...rows.map(row => Number(getString(row, 'ts'))).filter(Number.isFinite))
      if (!Number.isFinite(oldest) || oldest >= after || oldest <= before) break
      after = oldest
    }
    return result
  }
  const [depositRows, withdrawalRows] = await Promise.all([
    fetchHistory('/api/v5/asset/deposit-history'),
    fetchHistory('/api/v5/asset/withdrawal-history')
  ])
  const transfers: CapitalTransfer[] = []
  for (const row of depositRows) {
    // OKX uses state 2 for a completed deposit.
    if (getString(row, 'state') !== '2') continue
    const date = new Date(Number(getString(row, 'ts')))
    if (date < fromDate || date > toDate) continue
    const amount = Number(getString(row, 'amt'))
    const id = getString(row, 'depId')
    if (id === '' || !Number.isFinite(amount) || amount === 0) continue
    transfers.push({ id, direction: 'deposit', coin: getString(row, 'ccy').toUpperCase(), amount, fee: 0, date, network: getOptString(row, 'chain') ?? null })
  }
  for (const row of withdrawalRows) {
    // OKX uses state 2 for a completed withdrawal.
    if (getString(row, 'state') !== '2') continue
    const date = new Date(Number(getString(row, 'ts')))
    if (date < fromDate || date > toDate) continue
    const amount = Number(getString(row, 'amt'))
    const id = getString(row, 'wdId')
    if (id === '' || !Number.isFinite(amount) || amount === 0) continue
    transfers.push({ id, direction: 'withdrawal', coin: getString(row, 'ccy').toUpperCase(), amount, fee: Number(getOptString(row, 'fee') ?? 0), date, network: getOptString(row, 'chain') ?? null })
  }
  const unique = new Map<string, CapitalTransfer>()
  for (const transfer of transfers) unique.set(`${transfer.direction}:${transfer.id}`, transfer)
  return [...unique.values()].sort((left, right) => left.date.getTime() - right.date.getTime())
}
