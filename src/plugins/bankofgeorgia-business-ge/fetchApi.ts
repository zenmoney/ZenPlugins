import { fetchJson } from '../../common/network'
import { AuthResponse, BalanceResponse, StatementResponse } from './models'
import { TemporaryError, InvalidPreferencesError } from '../../errors'
import { stringify } from 'querystring'

const BASE_URL = 'https://api.businessonline.ge/api'
const TOKEN_URL = 'https://account.bog.ge/auth/realms/bog/protocol/openid-connect/token'

export async function fetchToken (clientId: string, clientSecret: string): Promise<AuthResponse> {
  const response = await fetchJson(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    },
    stringify,
    sanitizeRequestLog: { body: { client_id: true, client_secret: true } }
  })

  if (response.status !== 200) {
    throw new InvalidPreferencesError('Unable to authorize using provided client credentials')
  }

  return response.body as AuthResponse
}

export async function fetchAccountStatement (
  accessToken: string,
  accountNumber: string,
  currency: string,
  startDate: string,
  endDate: string
): Promise<StatementResponse> {
  const url = `${BASE_URL}/statement/${accountNumber}/${currency}/${startDate}/${endDate}`

  const headers = { Authorization: `Bearer ${accessToken}` }

  const response = await fetchJson(url, {
    method: 'GET',
    headers
  })

  if (response.status !== 200) {
    throw new TemporaryError(`API responded with unexpected status ${response.status}`)
  }

  return response.body as StatementResponse
}

export async function fetchAccountBalance (
  accessToken: string,
  accountNumber: string,
  currency: string
): Promise<BalanceResponse> {
  const url = `${BASE_URL}/accounts/${accountNumber}/${currency}`
  const headers = { Authorization: `Bearer ${accessToken}` }

  const response = await fetchJson(url, {
    method: 'GET',
    headers
  })

  if (response.status !== 200) {
    throw new TemporaryError(`API responded with unexpected status ${response.status}`)
  }

  return response.body as BalanceResponse
}
