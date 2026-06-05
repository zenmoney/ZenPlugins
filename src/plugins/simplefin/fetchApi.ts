import { fetch, fetchJson } from '../../common/network'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidPreferencesError, TemporaryError } from '../../errors'
import { getArray, getOptArray, getOptBoolean, getOptNumber, getOptString, getString } from '../../types/get'
import { Auth, SimpleFinAccount, SimpleFinAccountSet, SimpleFinConnection, SimpleFinTransaction } from './models'

const protocolVersion = '2'

export async function claimAccessUrl (token: string): Promise<string> {
  const claimUrl = decodeToken(token)
  assertHttpsUrl(claimUrl, 'SimpleFIN Token must decode to an HTTPS claim URL')

  const response = await fetch(claimUrl, {
    method: 'POST',
    sanitizeRequestLog: { url: true },
    sanitizeResponseLog: { body: true }
  })

  if (response.status === 403) {
    throw new InvalidPreferencesError('SimpleFIN Token is invalid or has already been claimed')
  }
  if (response.status !== 200) {
    throw new TemporaryError(`Could not claim SimpleFIN access URL. HTTP ${response.status}`)
  }
  if (typeof response.body !== 'string') {
    throw new TemporaryError('Could not read SimpleFIN access URL')
  }

  const accessUrl = response.body.trim()
  assertHttpsUrl(accessUrl, 'SimpleFIN Access URL must use HTTPS')
  return accessUrl
}

export async function fetchAccounts (auth: Auth, fromDate: Date, toDate: Date): Promise<SimpleFinAccountSet> {
  const response = await fetchJson(makeAccountsUrl(auth.accessUrl, fromDate, toDate), {
    sanitizeRequestLog: { url: true },
    sanitizeResponseLog: { body: true }
  })

  if (response.status === 403) {
    throw new InvalidLoginOrPasswordError('SimpleFIN access was revoked or credentials are invalid')
  }
  if (response.status === 402) {
    throw new TemporaryError('SimpleFIN Bridge payment is required')
  }
  if (response.status !== 200) {
    throw new TemporaryError(`Could not load SimpleFIN accounts. HTTP ${response.status}`)
  }

  assertNoErrors(response.body)
  return parseAccountSet(response.body)
}

function decodeToken (token: string): string {
  return Buffer.from(token.trim(), 'base64').toString('utf8')
}

function assertHttpsUrl (url: string, message: string): void {
  try {
    if (new URL(url).protocol !== 'https:') {
      throw new InvalidPreferencesError(message)
    }
  } catch (e) {
    if (e instanceof InvalidPreferencesError) {
      throw e
    }
    throw new InvalidPreferencesError(message)
  }
}

function makeAccountsUrl (accessUrl: string, fromDate: Date, toDate: Date): string {
  assertHttpsUrl(accessUrl, 'SimpleFIN Access URL must use HTTPS')
  const url = new URL(accessUrl)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/accounts`
  url.searchParams.set('start-date', timestamp(fromDate).toString())
  url.searchParams.set('end-date', timestamp(toDate).toString())
  url.searchParams.set('pending', '1')
  url.searchParams.set('version', protocolVersion)
  return url.toString()
}

function timestamp (date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

function assertNoErrors (data: unknown): void {
  const errors = [
    ...parseErrList(data),
    ...parseLegacyErrors(data)
  ]
  if (errors.length > 0) {
    throw new BankMessageError(errors.map(sanitizeMessage).join('\n'))
  }
}

function parseErrList (data: unknown): string[] {
  return (getOptArray(data, 'errlist') ?? []).map(error => {
    const code = getOptString(error, 'code')
    const message = getOptString(error, 'msg') ?? getOptString(error, 'message')
    return [code, message].filter(Boolean).join(': ')
  }).filter(message => message.length > 0)
}

function parseLegacyErrors (data: unknown): string[] {
  return (getOptArray(data, 'errors') ?? []).map(error => String(error)).filter(message => message.length > 0)
}

function sanitizeMessage (message: string): string {
  return message
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/[^\S\r\n]+/g, ' ')
    .split('')
    .filter(char => {
      const code = char.charCodeAt(0)
      return code > 31 && (code < 127 || code > 159)
    })
    .join('')
    .trim()
    .slice(0, 500)
}

function parseAccountSet (data: unknown): SimpleFinAccountSet {
  return {
    connections: (getOptArray(data, 'connections') ?? []).map(parseConnection),
    accounts: getArray(data, 'accounts').map(parseAccount)
  }
}

function parseConnection (connection: unknown): SimpleFinConnection {
  return {
    connId: getString(connection, 'conn_id'),
    name: getOptString(connection, 'name'),
    orgName: getOptString(connection, 'org_name'),
    orgUrl: getOptString(connection, 'org_url'),
    sfinUrl: getOptString(connection, 'sfin_url')
  }
}

function parseAccount (account: unknown): SimpleFinAccount {
  return {
    id: getString(account, 'id'),
    name: getString(account, 'name'),
    connId: getOptString(account, 'conn_id'),
    connName: getOptString(account, 'conn_name'),
    currency: getString(account, 'currency'),
    balance: parseAmount(getString(account, 'balance')),
    availableBalance: parseOptionalAmount(getOptString(account, 'available-balance')),
    balanceDate: getOptNumber(account, 'balance-date'),
    transactions: getArray(account, 'transactions').map(parseTransaction),
    extra: parseExtra(account)
  }
}

function parseTransaction (transaction: unknown): SimpleFinTransaction {
  return {
    id: getString(transaction, 'id'),
    posted: getNumberFromUnknown(transaction, 'posted'),
    amount: parseAmount(getString(transaction, 'amount')),
    description: getString(transaction, 'description'),
    transactedAt: getOptNumber(transaction, 'transacted_at'),
    pending: getOptBoolean(transaction, 'pending'),
    extra: parseExtra(transaction)
  }
}

function getNumberFromUnknown (obj: unknown, path: string): number {
  return getOptNumber(obj, path) ?? parseAmount(getString(obj, path))
}

function parseOptionalAmount (value?: string): number | undefined {
  return value === undefined ? undefined : parseAmount(value)
}

function parseAmount (value: string): number {
  const amount = Number(value)
  console.assert(Number.isFinite(amount), 'cant parse SimpleFIN numeric string', value)
  return amount
}

function parseExtra (data: unknown): Record<string, unknown> | undefined {
  const extra = getOptArray(data, 'extra')
  if (extra !== undefined) {
    return undefined
  }
  const value = getOptObject(data, 'extra')
  return value
}

function getOptObject (obj: unknown, path: string): Record<string, unknown> | undefined {
  const value = getOptUnknown(obj, path)
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function getOptUnknown (obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let value = obj
  for (const part of parts) {
    if (value === null || typeof value !== 'object' || !(part in value)) {
      return undefined
    }
    value = (value as Record<string, unknown>)[part]
  }
  return value
}
